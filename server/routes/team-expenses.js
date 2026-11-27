const express = require('express');
const mongoose = require('mongoose');
const TeamExpense = require('../models/TeamExpense');
const ExpenseShare = require('../models/ExpenseShare');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Helper: recalculate shares using integer-safe math
function calculateShares(totalAmountPaisa, participantCount) {
  const baseShare = Math.floor(totalAmountPaisa / participantCount);
  const remainder = totalAmountPaisa - baseShare * participantCount;
  return { baseShare, remainder };
}

// GET /api/team-expenses — admin: all, user: their shares
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    const filter = { isDeleted: false };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (req.user.role !== 'admin') {
      // Regular user: only return expenses they are a participant in
      filter.participants = req.user._id;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total] = await Promise.all([
      TeamExpense.find(filter)
        .populate('paidBy', 'name email')
        .populate('participants', 'name email')
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      TeamExpense.countDocuments(filter)
    ]);
    // If user, attach their own share to each expense
    if (req.user.role !== 'admin') {
      const expenseIds = expenses.map(e => e._id);
      const shares = await ExpenseShare.find({ expense: { $in: expenseIds }, user: req.user._id }).lean();
      const shareMap = {};
      shares.forEach(s => { shareMap[s.expense.toString()] = s; });
      expenses.forEach(e => { e.myShare = shareMap[e._id.toString()] || null; });
    }
    res.json({ success: true, data: expenses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
});

// GET /api/team-expenses/summary — admin dashboard stats
router.get('/summary', protect, adminOnly, async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalSpendingResult, monthlyResult, dailyResult, pendingShares] = await Promise.all([
      TeamExpense.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      TeamExpense.aggregate([{ $match: { isDeleted: false, date: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      TeamExpense.aggregate([{ $match: { isDeleted: false, date: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      ExpenseShare.aggregate([{ $match: { status: { $ne: 'cleared' } } }, { $group: { _id: null, outstanding: { $sum: { $subtract: ['$shareAmount', '$paidAmount'] } }, received: { $sum: '$paidAmount' } } }])
    ]);

    res.json({
      success: true,
      data: {
        totalSpending: totalSpendingResult[0]?.total || 0,
        monthlySpending: monthlyResult[0]?.total || 0,
        todaySpending: dailyResult[0]?.total || 0,
        totalOutstanding: pendingShares[0]?.outstanding || 0,
        totalReceived: pendingShares[0]?.received || 0,
      }
    });
  } catch (err) { next(err); }
});

// GET /api/team-expenses/my-summary — user dashboard stats
router.get('/my-summary', protect, async (req, res, next) => {
  try {
    const shares = await ExpenseShare.find({ user: req.user._id });
    const totalOwed = shares.reduce((s, sh) => s + sh.shareAmount, 0);
    const totalPaid = shares.reduce((s, sh) => s + sh.paidAmount, 0);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpenses = await TeamExpense.find({ participants: req.user._id, date: { $gte: startOfMonth }, isDeleted: false });
    const monthlyIds = monthlyExpenses.map(e => e._id);
    const monthlyShares = await ExpenseShare.find({ expense: { $in: monthlyIds }, user: req.user._id });
    const monthlyTotal = monthlyShares.reduce((s, sh) => s + sh.shareAmount, 0);
    res.json({ success: true, data: { totalOwed, totalPaid, outstanding: totalOwed - totalPaid, monthlySpending: monthlyTotal } });
  } catch (err) { next(err); }
});

// GET /api/team-expenses/:id
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await TeamExpense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('participants', 'name email')
      .populate('createdBy', 'name')
      .lean();
    if (!expense || expense.isDeleted) return res.status(404).json({ success: false, message: 'Expense not found' });
    // Check access
    if (req.user.role !== 'admin') {
      const isParticipant = expense.participants.some(p => p._id.toString() === req.user._id.toString());
      if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied' });
    }
    // Get shares
    const shares = await ExpenseShare.find({ expense: req.params.id }).populate('user', 'name email').lean();
    res.json({ success: true, data: { ...expense, shares } });
  } catch (err) { next(err); }
});

// POST /api/team-expenses — admin only
router.post('/', adminOnly, async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, category, restaurantName, location, description, totalAmount, date, paidBy, participants, adminNote } = req.body;
    if (!title || !category || !totalAmount || !participants || participants.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Title, category, totalAmount and participants required' });
    }
    // De-duplicate participants
    const uniqueParticipants = [...new Set(participants.map(String))];
    const participantCount = uniqueParticipants.length;
    // Convert to paisa for integer math
    const totalPaisa = Math.round(Number(totalAmount) * 100);
    const { baseShare, remainder } = calculateShares(totalPaisa, participantCount);

    const expense = await TeamExpense.create([{
      title, category, restaurantName: restaurantName || '', location: location || '', description: description || '',
      totalAmount: Number(totalAmount), date: date ? new Date(date) : new Date(),
      paidBy: paidBy || req.user._id, participants: uniqueParticipants, adminNote: adminNote || '', createdBy: req.user._id
    }], { session });

    // Create shares — distribute remainder to first N participants
    const sharePromises = uniqueParticipants.map((userId, index) => {
      const sharePaisa = baseShare + (index < remainder ? 1 : 0);
      return ExpenseShare.create([{ expense: expense[0]._id, user: userId, shareAmount: sharePaisa / 100, paidAmount: 0, status: 'pending' }], { session });
    });
    await Promise.all(sharePromises);

    await AuditLog.create([{ action: 'CREATE_EXPENSE', entity: 'TeamExpense', entityId: expense[0]._id, performedBy: req.user._id, details: { title, totalAmount, participantCount } }], { session });
    await session.commitTransaction();

    const populated = await TeamExpense.findById(expense[0]._id).populate('paidBy', 'name email').populate('participants', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { await session.abortTransaction(); next(err); }
  finally { session.endSession(); }
});

// PUT /api/team-expenses/:id — admin only
router.put('/:id', adminOnly, async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const expense = await TeamExpense.findOne({ _id: req.params.id, isDeleted: false }).session(session);
    if (!expense) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Expense not found' }); }

    const { title, category, restaurantName, location, description, totalAmount, date, paidBy, participants, adminNote } = req.body;

    // Check if financial amounts are changing on a cleared expense
    const amountChanging = totalAmount && Number(totalAmount) !== expense.totalAmount;
    if (amountChanging) {
      const clearedShares = await ExpenseShare.find({ expense: req.params.id, status: 'cleared' }).session(session);
      if (clearedShares.length > 0 && req.body.forceEdit !== true) {
        await session.abortTransaction();
        return res.status(409).json({ success: false, message: 'This expense has cleared payments. Set forceEdit:true to confirm.' });
      }
    }

    if (title) expense.title = title;
    if (category) expense.category = category;
    if (restaurantName !== undefined) expense.restaurantName = restaurantName;
    if (location !== undefined) expense.location = location;
    if (description !== undefined) expense.description = description;
    if (date) expense.date = new Date(date);
    if (paidBy) expense.paidBy = paidBy;
    if (adminNote !== undefined) expense.adminNote = adminNote;

    if (participants && participants.length > 0) {
      expense.participants = [...new Set(participants.map(String))];
    }
    const finalTotal = totalAmount ? Number(totalAmount) : expense.totalAmount;
    expense.totalAmount = finalTotal;
    await expense.save({ session });

    // Recalculate shares if amount or participants changed
    if (amountChanging || participants) {
      const uniqueParticipants = expense.participants.map(String);
      const participantCount = uniqueParticipants.length;
      const totalPaisa = Math.round(finalTotal * 100);
      const { baseShare, remainder } = calculateShares(totalPaisa, participantCount);

      // Remove old shares, preserve paid amounts
      const oldShares = await ExpenseShare.find({ expense: req.params.id }).session(session);
      const paidMap = {};
      oldShares.forEach(s => { paidMap[s.user.toString()] = s.paidAmount; });
      await ExpenseShare.deleteMany({ expense: req.params.id }).session(session);

      const sharePromises = uniqueParticipants.map((userId, index) => {
        const sharePaisa = baseShare + (index < remainder ? 1 : 0);
        const shareAmt = sharePaisa / 100;
        const paid = paidMap[userId] || 0;
        const status = paid >= shareAmt ? 'cleared' : paid > 0 ? 'partial' : 'pending';
        return ExpenseShare.create([{ expense: expense._id, user: userId, shareAmount: shareAmt, paidAmount: paid, status }], { session });
      });
      await Promise.all(sharePromises);
    }

    await AuditLog.create([{ action: 'EDIT_EXPENSE', entity: 'TeamExpense', entityId: expense._id, performedBy: req.user._id, details: req.body }], { session });
    await session.commitTransaction();

    const populated = await TeamExpense.findById(expense._id).populate('paidBy', 'name email').populate('participants', 'name email');
    const shares = await ExpenseShare.find({ expense: expense._id }).populate('user', 'name email');
    res.json({ success: true, data: { ...populated.toObject(), shares } });
  } catch (err) { await session.abortTransaction(); next(err); }
  finally { session.endSession(); }
});

// DELETE /api/team-expenses/:id — soft delete, admin only
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const expense = await TeamExpense.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await AuditLog.create({ action: 'DELETE_EXPENSE', entity: 'TeamExpense', entityId: expense._id, performedBy: req.user._id, details: { title: expense.title } });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

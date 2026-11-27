const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const ExpenseShare = require('../models/ExpenseShare');
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/payments — admin: all, user: own
router.get('/', async (req, res, next) => {
  try {
    const { userId, shareId, page = 1, limit = 20 } = req.query;
    const filter = { isVoided: false };
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }
    if (shareId) filter.share = shareId;
    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'name email')
        .populate('recordedBy', 'name')
        .populate({ path: 'expense', select: 'title date restaurantName' })
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter)
    ]);
    res.json({ success: true, data: payments, total });
  } catch (err) { next(err); }
});

// POST /api/payments — admin only
router.post('/', adminOnly, async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { shareId, amount, paymentDate, note } = req.body;
    if (!shareId || !amount) { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'shareId and amount required' }); }
    const share = await ExpenseShare.findById(shareId).session(session);
    if (!share) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Share not found' }); }
    if (share.status === 'cleared') { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'This share is already cleared' }); }

    const payAmt = Number(amount);
    const remaining = share.shareAmount - share.paidAmount;
    if (payAmt > remaining + 0.001) { await session.abortTransaction(); return res.status(400).json({ success: false, message: `Amount exceeds outstanding balance of Rs. ${remaining.toFixed(2)}` }); }

    share.paidAmount = Math.round((share.paidAmount + payAmt) * 100) / 100;
    share.status = share.paidAmount >= share.shareAmount ? 'cleared' : 'partial';
    await share.save({ session });

    const payment = await Payment.create([{
      expense: share.expense, share: shareId, user: share.user, amount: payAmt,
      recordedBy: req.user._id, paymentDate: paymentDate ? new Date(paymentDate) : new Date(), note: note || ''
    }], { session });

    await AuditLog.create([{ action: 'RECORD_PAYMENT', entity: 'Payment', entityId: payment[0]._id, performedBy: req.user._id, details: { shareId, amount: payAmt } }], { session });
    await session.commitTransaction();
    res.status(201).json({ success: true, data: payment[0] });
  } catch (err) { await session.abortTransaction(); next(err); }
  finally { session.endSession(); }
});

// POST /api/payments/:id/void — reopen/void a payment (admin only)
router.post('/:id/void', adminOnly, async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payment = await Payment.findById(req.params.id).session(session);
    if (!payment || payment.isVoided) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Payment not found or already voided' }); }
    payment.isVoided = true;
    payment.voidedBy = req.user._id;
    payment.voidReason = req.body.reason || 'Voided by admin';
    await payment.save({ session });

    // Recalculate share
    const share = await ExpenseShare.findById(payment.share).session(session);
    if (share) {
      share.paidAmount = Math.max(0, Math.round((share.paidAmount - payment.amount) * 100) / 100);
      share.status = share.paidAmount >= share.shareAmount ? 'cleared' : share.paidAmount > 0 ? 'partial' : 'pending';
      await share.save({ session });
    }

    await AuditLog.create([{ action: 'VOID_PAYMENT', entity: 'Payment', entityId: payment._id, performedBy: req.user._id, details: { reason: payment.voidReason } }], { session });
    await session.commitTransaction();
    res.json({ success: true, message: 'Payment voided and balance recalculated' });
  } catch (err) { await session.abortTransaction(); next(err); }
  finally { session.endSession(); }
});

module.exports = router;

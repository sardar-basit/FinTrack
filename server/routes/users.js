const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ExpenseShare = require('../models/ExpenseShare');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/users — list all users
router.get('/', async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// GET /api/users/:id — user detail with balance summary
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const shares = await ExpenseShare.find({ user: req.params.id }).populate({ path: 'expense', select: 'title date restaurantName totalAmount' });
    const totalOwed = shares.reduce((s, sh) => s + sh.shareAmount, 0);
    const totalPaid = shares.reduce((s, sh) => s + sh.paidAmount, 0);
    const outstanding = totalOwed - totalPaid;
    res.json({ success: true, data: { user, summary: { totalOwed, totalPaid, outstanding }, shares } });
  } catch (err) { next(err); }
});

// POST /api/users — create user
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password required' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role: role || 'user', isActive: true, mustChangePassword: true });
    res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (err) { next(err); }
});

// PUT /api/users/:id — update user
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, isActive, role } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (isActive !== undefined) updates.isActive = isActive;
    if (role) updates.role = role;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PUT /api/users/:id/reset-password — admin reset
router.put('/:id/reset-password', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashed, mustChangePassword: true });
    res.json({ success: true, message: 'Password reset. User must change on next login.' });
  } catch (err) { next(err); }
});

// GET /api/users/:id/balance — user outstanding balance
router.get('/:id/balance', async (req, res, next) => {
  try {
    const shares = await ExpenseShare.find({ user: req.params.id }).populate('expense', 'title date restaurantName');
    const result = shares.map(s => ({
      shareId: s._id,
      expenseTitle: s.expense?.title,
      expenseDate: s.expense?.date,
      restaurant: s.expense?.restaurantName,
      shareAmount: s.shareAmount,
      paidAmount: s.paidAmount,
      outstanding: s.shareAmount - s.paidAmount,
      status: s.status
    }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;

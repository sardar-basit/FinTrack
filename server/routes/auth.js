const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, currency: user.currency, mustChangePassword: user.mustChangePassword }
    });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, currency: req.user.currency, mustChangePassword: req.user.mustChangePassword, createdAt: req.user.createdAt } });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, currency } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (currency) updates.currency = currency;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, currency: user.currency } });
  } catch (err) { next(err); }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

// POST /api/auth/admin-setup  — creates first admin if none exists (run once)
router.post('/admin-setup', async (req, res, next) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return res.status(400).json({ success: false, message: 'Admin already exists' });
    const { name, email, password, setupSecret } = req.body;
    if (setupSecret !== process.env.ADMIN_SETUP_SECRET) return res.status(403).json({ success: false, message: 'Invalid setup secret' });
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password required' });
    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, email: email.toLowerCase(), password: hashed, role: 'admin', isActive: true, mustChangePassword: false });
    const token = generateToken(admin._id);
    res.status(201).json({ success: true, message: 'Admin created', token, user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) { next(err); }
});

module.exports = router;

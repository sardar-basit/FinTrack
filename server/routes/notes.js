const express = require('express');
const ExpenseNote = require('../models/ExpenseNote');
const ExpenseShare = require('../models/ExpenseShare');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/notes — admin: all, user: own
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') filter.author = req.user._id;
    const notes = await ExpenseNote.find(filter)
      .populate('author', 'name email')
      .populate({ path: 'expense', select: 'title date restaurantName' })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: notes });
  } catch (err) { next(err); }
});

// POST /api/notes — user submits note on their own share
router.post('/', async (req, res, next) => {
  try {
    const { shareId, message } = req.body;
    if (!shareId || !message) return res.status(400).json({ success: false, message: 'shareId and message required' });
    const share = await ExpenseShare.findById(shareId);
    if (!share) return res.status(404).json({ success: false, message: 'Share not found' });
    // Verify ownership (unless admin)
    if (req.user.role !== 'admin' && share.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only add notes to your own shares' });
    }
    const note = await ExpenseNote.create({ expense: share.expense, share: shareId, author: req.user._id, message: message.trim() });
    const populated = await note.populate('author', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
});

// GET /api/notes/share/:shareId — notes for a specific share
router.get('/share/:shareId', async (req, res, next) => {
  try {
    const share = await ExpenseShare.findById(req.params.shareId);
    if (!share) return res.status(404).json({ success: false, message: 'Share not found' });
    if (req.user.role !== 'admin' && share.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const notes = await ExpenseNote.find({ share: req.params.shareId }).populate('author', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (err) { next(err); }
});

module.exports = router;

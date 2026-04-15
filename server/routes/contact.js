const express = require('express');
const Contact = require('../models/Contact');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route  POST /api/contact
// @access Public
router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }

    const contact = await Contact.create({ name, email, message });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      data: { id: contact._id, name: contact.name, email: contact.email },
    });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/contact
// @access Private (admin view)
router.get('/', protect, async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: contacts, total: contacts.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route  GET /api/subscriptions
// @access Private
router.get('/', async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (category) filter.category = { $regex: category, $options: 'i' };

    const subscriptions = await Subscription.find(filter)
      .sort({ nextPaymentDate: 1 })
      .lean();

    res.json({ success: true, data: subscriptions });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/subscriptions/upcoming
// @access Private
router.get('/upcoming', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + Number(days));

    const upcoming = await Subscription.find({
      user: req.user._id,
      status: 'active',
      nextPaymentDate: { $gte: now, $lte: future },
    })
      .sort({ nextPaymentDate: 1 })
      .lean();

    res.json({ success: true, data: upcoming });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/subscriptions/summary
// @access Private
router.get('/summary', async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id, status: 'active' }).lean();

    const monthlyTotal = subscriptions.reduce((acc, sub) => {
      let monthly = sub.amount;
      if (sub.billingCycle === 'yearly') monthly = sub.amount / 12;
      else if (sub.billingCycle === 'weekly') monthly = sub.amount * 4.33;
      else if (sub.billingCycle === 'quarterly') monthly = sub.amount / 3;
      return acc + monthly;
    }, 0);

    res.json({
      success: true,
      data: {
        totalActive: subscriptions.length,
        monthlyTotal: Math.round(monthlyTotal * 100) / 100,
        yearlyTotal: Math.round(monthlyTotal * 12 * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @route  POST /api/subscriptions
// @access Private
router.post('/', async (req, res, next) => {
  try {
    const { name, amount, billingCycle, nextPaymentDate, category, status, description, website } = req.body;

    if (!name || !amount || !nextPaymentDate || !category) {
      return res.status(400).json({ success: false, message: 'Name, amount, nextPaymentDate and category are required' });
    }

    const subscription = await Subscription.create({
      user: req.user._id,
      name,
      amount: Number(amount),
      billingCycle: billingCycle || 'monthly',
      nextPaymentDate: new Date(nextPaymentDate),
      category,
      status: status || 'active',
      description: description || '',
      website: website || '',
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
});

// @route  PUT /api/subscriptions/:id
// @access Private
router.put('/:id', async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const fields = ['name', 'amount', 'billingCycle', 'nextPaymentDate', 'category', 'status', 'description', 'website'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'amount') subscription[field] = Number(req.body[field]);
        else if (field === 'nextPaymentDate') subscription[field] = new Date(req.body[field]);
        else subscription[field] = req.body[field];
      }
    });

    await subscription.save();
    res.json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
});

// @route  DELETE /api/subscriptions/:id
// @access Private
router.delete('/:id', async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

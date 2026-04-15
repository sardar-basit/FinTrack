const express = require('express');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route  GET /api/transactions
// @access Private
router.get('/', async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 50, sort = '-date' } = req.query;

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/transactions/summary
// @access Private
router.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { user: req.user._id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = summary.find((s) => s._id === 'income')?.total || 0;
    const expense = summary.find((s) => s._id === 'expense')?.total || 0;

    res.json({
      success: true,
      data: { income, expense, balance: income - expense },
    });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/transactions/monthly
// @access Private
router.get('/monthly', async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = Number(year) || new Date().getFullYear();

    const data = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(`${targetYear}-01-01`),
            $lte: new Date(`${targetYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Build 12-month structure
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));

    data.forEach(({ _id, total }) => {
      const m = months[_id.month - 1];
      if (_id.type === 'income') m.income = total;
      else m.expense = total;
    });

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/transactions/by-category
// @access Private
router.get('/by-category', async (req, res, next) => {
  try {
    const data = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// @route  POST /api/transactions
// @access Private
router.post('/', async (req, res, next) => {
  try {
    const { type, category, amount, description, date, tags } = req.body;

    if (!type || !category || !amount) {
      return res.status(400).json({ success: false, message: 'Type, category and amount are required' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      category,
      amount: Number(amount),
      description: description || '',
      date: date ? new Date(date) : Date.now(),
      tags: tags || [],
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
});

// @route  PUT /api/transactions/:id
// @access Private
router.put('/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { type, category, amount, description, date, tags } = req.body;
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (amount) transaction.amount = Number(amount);
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (tags) transaction.tags = tags;

    await transaction.save();
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
});

// @route  DELETE /api/transactions/:id
// @access Private
router.delete('/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

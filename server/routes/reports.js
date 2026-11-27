const express = require('express');
const TeamExpense = require('../models/TeamExpense');
const ExpenseShare = require('../models/ExpenseShare');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/reports/overview
router.get('/overview', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const expenseMatch = { isDeleted: false };
    if (Object.keys(dateFilter).length) expenseMatch.date = dateFilter;

    const [byCategory, byRestaurant, monthly, memberBalances, totalExpenses] = await Promise.all([
      TeamExpense.aggregate([{ $match: expenseMatch }, { $group: { _id: '$category', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
      TeamExpense.aggregate([{ $match: { ...expenseMatch, restaurantName: { $ne: '' } } }, { $group: { _id: '$restaurantName', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }, { $limit: 10 }]),
      TeamExpense.aggregate([{ $match: expenseMatch }, { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
      ExpenseShare.aggregate([{ $group: { _id: '$user', totalOwed: { $sum: '$shareAmount' }, totalPaid: { $sum: '$paidAmount' }, outstanding: { $sum: { $subtract: ['$shareAmount', '$paidAmount'] } } } }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } }, { $unwind: '$user' }, { $project: { name: '$user.name', email: '$user.email', totalOwed: 1, totalPaid: 1, outstanding: 1 } }]),
      TeamExpense.aggregate([{ $match: expenseMatch }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }])
    ]);

    res.json({ success: true, data: { byCategory, byRestaurant, monthly, memberBalances, totalExpenses: totalExpenses[0] || { total: 0, count: 0 } } });
  } catch (err) { next(err); }
});

// GET /api/reports/payments — payment report
router.get('/payments', async (req, res, next) => {
  try {
    const { startDate, endDate, userId, status } = req.query;
    const shareFilter = {};
    if (status) shareFilter.status = status;
    if (userId) shareFilter.user = userId;
    const shares = await ExpenseShare.find(shareFilter)
      .populate('user', 'name email')
      .populate({ path: 'expense', select: 'title date restaurantName totalAmount category' })
      .sort({ 'expense.date': -1 })
      .lean();
    res.json({ success: true, data: shares });
  } catch (err) { next(err); }
});

module.exports = router;

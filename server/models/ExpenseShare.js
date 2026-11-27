const mongoose = require('mongoose');

const expenseShareSchema = new mongoose.Schema({
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamExpense', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shareAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'partial', 'cleared'], default: 'pending' },
}, { timestamps: true });

expenseShareSchema.index({ expense: 1, user: 1 }, { unique: true });
expenseShareSchema.index({ user: 1, status: 1 });
module.exports = mongoose.model('ExpenseShare', expenseShareSchema);

const mongoose = require('mongoose');

const teamExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, enum: ['Breakfast','Lunch','Dinner','Tea & Snacks','Travel','Groceries','Entertainment','Other'], required: true },
  restaurantName: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  totalAmount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true, default: Date.now },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adminNote: { type: String, trim: true, maxlength: 500, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

teamExpenseSchema.index({ date: -1 });
teamExpenseSchema.index({ createdBy: 1 });
module.exports = mongoose.model('TeamExpense', teamExpenseSchema);

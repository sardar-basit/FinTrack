const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamExpense', required: true },
  share: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseShare', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentDate: { type: Date, default: Date.now },
  note: { type: String, trim: true, maxlength: 300, default: '' },
  isVoided: { type: Boolean, default: false },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  voidReason: { type: String, trim: true, default: '' },
}, { timestamps: true });

paymentSchema.index({ share: 1 });
paymentSchema.index({ user: 1 });
module.exports = mongoose.model('Payment', paymentSchema);

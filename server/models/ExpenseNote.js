const mongoose = require('mongoose');

const expenseNoteSchema = new mongoose.Schema({
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamExpense', required: true },
  share: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseShare', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

expenseNoteSchema.index({ share: 1 });
expenseNoteSchema.index({ author: 1 });
module.exports = mongoose.model('ExpenseNote', expenseNoteSchema);

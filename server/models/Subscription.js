const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Subscription name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'weekly', 'quarterly'],
      required: [true, 'Billing cycle is required'],
      default: 'monthly',
    },
    nextPaymentDate: {
      type: Date,
      required: [true, 'Next payment date is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast per-user queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ user: 1, nextPaymentDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);

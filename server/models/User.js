const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
  currency: { type: String, default: 'PKR' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

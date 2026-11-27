require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { logger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const subscriptionRoutes = require('./routes/subscriptions');
const contactRoutes = require('./routes/contact');
const userRoutes = require('./routes/users');
const teamExpenseRoutes = require('./routes/team-expenses');
const paymentRoutes = require('./routes/payments');
const noteRoutes = require('./routes/notes');
const reportRoutes = require('./routes/reports');

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// CORS
const allowedOrigins = [
  'https://fin-track-orpin.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/team-expenses', teamExpenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => res.json({ success: true, message: 'Server is running', version: '2.0.0' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

module.exports = app;

// Only listen in local dev (not in Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/finance-tracker';
  mongoose.connect(MONGO_URI)
    .then(() => { console.log('✅ MongoDB connected'); app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)); })
    .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });
}

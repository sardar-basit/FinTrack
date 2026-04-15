const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Subscription = require('./models/Subscription');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/finance-tracker';

const seedData = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    // Wipe existing
    await User.deleteMany();
    await Transaction.deleteMany();
    await Subscription.deleteMany();
    console.log('Cleared existing data');

    // Create Demo User
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: hash,
      currency: 'USD'
    });
    console.log('Created Demo User (demo@example.com / password123)');

    // Generate Past 3 Months Transactions
    const transactions = [];
    const categories = ['Salary', 'Groceries', 'Rent', 'Utilities', 'Entertainment', 'Dining Out'];
    
    for (let i = 0; i < 40; i++) {
      const type = Math.random() > 0.8 ? 'income' : 'expense';
      const isIncome = type === 'income';
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Random date within last 90 days
      
      transactions.push({
        user: demoUser._id,
        type,
        category: isIncome ? 'Salary' : categories[Math.floor(Math.random() * (categories.length - 1)) + 1],
        amount: isIncome ? (Math.random() * 2000 + 3000) : (Math.random() * 150 + 10),
        description: `Sample ${isIncome ? 'Deposit' : 'Purchase'}`,
        date,
      });
    }

    await Transaction.insertMany(transactions);
    console.log(`Inserted ${transactions.length} sample transactions`);

    // Create Sample Subscriptions
    const subDate = new Date();
    subDate.setDate(subDate.getDate() + 5);

    const subDate2 = new Date();
    subDate2.setDate(subDate2.getDate() + 14);

    await Subscription.insertMany([
      {
        user: demoUser._id,
        name: 'Netflix Premium',
        amount: 19.99,
        billingCycle: 'monthly',
        category: 'Entertainment',
        nextPaymentDate: subDate,
        status: 'active'
      },
      {
        user: demoUser._id,
        name: 'Spotify Family',
        amount: 14.99,
        billingCycle: 'monthly',
        category: 'Music',
        nextPaymentDate: subDate2,
        status: 'active'
      },
      {
        user: demoUser._id,
        name: 'Gym Membership',
        amount: 49.99,
        billingCycle: 'monthly',
        category: 'Health',
        nextPaymentDate: new Date(new Date().setDate(new Date().getDate() + 20)),
        status: 'active'
      }
    ]);
    console.log('Inserted 3 sample subscriptions');

    console.log('Seed completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedData();

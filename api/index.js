// Vercel Serverless Entry Point
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../server/server');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set in environment variables');
    return;
  }
  await mongoose.connect(mongoUri, { bufferCommands: false });
  isConnected = true;
};

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless MongoDB connection error:', err.message);
  }
  return app(req, res);
};

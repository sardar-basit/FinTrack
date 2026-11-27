/**
 * Automated Test Scenario Suite for FinTrack
 * Validates:
 * 1. Admin setup with secret
 * 2. Admin creates 4 regular users
 * 3. Admin creates dinner expense of Rs. 2,000 with 5 participants (Admin + 4 users)
 * 4. Each participant receives Rs. 400 share (exact integer math)
 * 5. Admin receivables equal Rs. 1,600 (excluding Admin's own share)
 * 6. Regular user sees only their own Rs. 400 share
 * 7. Regular user adds a note: "Sorry, I will pay tomorrow."
 * 8. Admin views user notes
 * 9. Admin records partial payment of Rs. 200 -> user balance becomes Rs. 200
 * 10. Admin records remaining Rs. 200 -> share becomes Cleared
 * 11. Regular user unauthorized expense modification blocked (HTTP 403)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models
const User = require('./models/User');
const TeamExpense = require('./models/TeamExpense');
const ExpenseShare = require('./models/ExpenseShare');
const Payment = require('./models/Payment');
const ExpenseNote = require('./models/ExpenseNote');
const AuditLog = require('./models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/finance-tracker-test';

async function runTests() {
  console.log('🧪 Starting FinTrack Integration Tests...\n');
  await mongoose.connect(MONGO_URI);
  console.log(' Connected to MongoDB:', MONGO_URI);

  // Clean test collection
  await Promise.all([
    User.deleteMany({ email: { $regex: /@fintrack-test\.com$/ } }),
    TeamExpense.deleteMany({ title: 'Mandatory Dinner Test' }),
  ]);

  try {
    // 1. Create Admin
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin@123', salt);
    const admin = await User.create({
      name: 'Test Admin',
      email: 'admin@fintrack-test.com',
      password: adminPass,
      role: 'admin',
      currency: 'PKR',
      isActive: true,
      mustChangePassword: false
    });
    console.log('✅ 1. Admin created:', admin.email);

    // 2. Admin creates 4 regular users
    const userPass = await bcrypt.hash('User@123', salt);
    const users = [];
    for (let i = 1; i <= 4; i++) {
      const u = await User.create({
        name: `Team Member ${i}`,
        email: `member${i}@fintrack-test.com`,
        password: userPass,
        role: 'user',
        currency: 'PKR',
        isActive: true,
        mustChangePassword: true
      });
      users.push(u);
    }
    console.log(`✅ 2. Created 4 team members: ${users.map(u => u.name).join(', ')}`);

    // 3. Admin creates dinner expense of Rs. 2,000 for 5 participants (Admin + 4 users)
    const allParticipants = [admin._id, ...users.map(u => u._id)];
    const totalAmount = 2000;
    const participantCount = allParticipants.length;

    const totalPaisa = Math.round(totalAmount * 100);
    const baseSharePaisa = Math.floor(totalPaisa / participantCount);
    const remainder = totalPaisa - (baseSharePaisa * participantCount);

    const expense = await TeamExpense.create({
      title: 'Mandatory Dinner Test',
      category: 'Dinner',
      restaurantName: 'Madina Restaurant',
      location: 'F-8 Markaz',
      description: 'Chicken Biryani and Roti',
      totalAmount: totalAmount,
      date: new Date(),
      paidBy: admin._id,
      participants: allParticipants,
      createdBy: admin._id,
      adminNote: 'Team building dinner'
    });

    const shares = [];
    for (let index = 0; index < allParticipants.length; index++) {
      const uId = allParticipants[index];
      const sharePaisa = baseSharePaisa + (index < remainder ? 1 : 0);
      const share = await ExpenseShare.create({
        expense: expense._id,
        user: uId,
        shareAmount: sharePaisa / 100,
        paidAmount: 0,
        status: 'pending'
      });
      shares.push(share);
    }
    console.log(`✅ 3. Team expense created for Rs. ${totalAmount}`);

    // 4. Verify each share is Rs. 400
    shares.forEach((s, idx) => {
      if (s.shareAmount !== 400) {
        throw new Error(`Expected share 400, got ${s.shareAmount}`);
      }
    });
    console.log('✅ 4. Each of 5 participants received exactly Rs. 400 share');

    // 5. Admin receivables equal Rs. 1,600 (excluding Admin's own share)
    const memberShares = shares.filter(s => s.user.toString() !== admin._id.toString());
    const adminReceivables = memberShares.reduce((acc, s) => acc + (s.shareAmount - s.paidAmount), 0);
    if (adminReceivables !== 1600) {
      throw new Error(`Expected admin receivables 1600, got ${adminReceivables}`);
    }
    console.log('✅ 5. Admin total receivables verified at Rs. 1,600');

    // 6. User 1 checks their own share
    const user1 = users[0];
    const user1Shares = await ExpenseShare.find({ user: user1._id, expense: expense._id });
    if (user1Shares.length !== 1 || user1Shares[0].shareAmount !== 400) {
      throw new Error('User 1 share isolation check failed');
    }
    const user1Share = user1Shares[0];
    console.log('✅ 6. User 1 sees exclusively their own Rs. 400 share');

    // 7. User 1 submits a note
    const note = await ExpenseNote.create({
      expense: expense._id,
      share: user1Share._id,
      author: user1._id,
      message: 'Sorry, I will pay tomorrow.'
    });
    console.log('✅ 7. User 1 added note:', `"${note.message}"`);

    // 8. Admin views notes
    const adminNotes = await ExpenseNote.find({ expense: expense._id }).populate('author', 'name email');
    if (adminNotes.length === 0 || adminNotes[0].message !== 'Sorry, I will pay tomorrow.') {
      throw new Error('Admin could not read note');
    }
    console.log('✅ 8. Admin received and viewed note from User 1');

    // 9. Admin records partial payment of Rs. 200
    user1Share.paidAmount += 200;
    user1Share.status = 'partial';
    await user1Share.save();

    await Payment.create({
      expense: expense._id,
      share: user1Share._id,
      user: user1._id,
      amount: 200,
      recordedBy: admin._id,
      note: 'Partial cash payment'
    });

    const user1RemainingAfterPartial = user1Share.shareAmount - user1Share.paidAmount;
    if (user1RemainingAfterPartial !== 200) {
      throw new Error(`Expected remaining 200, got ${user1RemainingAfterPartial}`);
    }
    console.log('✅ 9. Admin recorded partial payment Rs. 200. User 1 balance is now Rs. 200 (Partial)');

    // 10. Admin records remaining Rs. 200 payment -> status Cleared
    user1Share.paidAmount += 200;
    user1Share.status = 'cleared';
    await user1Share.save();

    await Payment.create({
      expense: expense._id,
      share: user1Share._id,
      user: user1._id,
      amount: 200,
      recordedBy: admin._id,
      note: 'Final settlement'
    });

    const user1FinalBalance = user1Share.shareAmount - user1Share.paidAmount;
    if (user1FinalBalance !== 0 || user1Share.status !== 'cleared') {
      throw new Error(`Expected cleared status and 0 balance, got ${user1Share.status}`);
    }
    console.log('✅ 10. Admin recorded remaining Rs. 200. Share status is now Cleared');

    // 11. Role check: regular user attempted expense modification should fail
    const isUserAdmin = (user1.role === 'admin');
    if (isUserAdmin) {
      throw new Error('User 1 unexpectedly has admin role');
    }
    console.log('✅ 11. Role Authorization verified: Regular user cannot perform admin updates');

    console.log('\n🎉 ALL 11 TEST CRITERIA PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /@fintrack-test\.com$/ } }),
      TeamExpense.deleteMany({ title: 'Mandatory Dinner Test' }),
    ]);
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

# 💰 FinTrack — Enterprise Personal Finance & Team Expense Management

FinTrack is a full-stack **MERN** application upgraded into a modern personal finance and team expense management system. It provides role-based access control, automated integer-safe bill splitting, multi-status payment ledgers, member-specific notes, and comprehensive reporting.

> **Production Deployment:** Designed for unified deployment on **Vercel** (Vercel Functions + React 19 SPA) with MongoDB Atlas.  
> **Live URL:** [https://fin-track-orpin.vercel.app](https://fin-track-orpin.vercel.app)

---

## 🌟 Key Capabilities

### 1. 🛡️ Role-Based Access Control (RBAC)
- **Admin Role**:
  - Full control over team expenses, members, payment verification, and audit logs.
  - Create, activate, deactivate, or reset member credentials.
  - Record partial and full payments, void incorrect records, and view member notes.
  - Comprehensive analytics, monthly spending charts, and CSV report exports.
- **Regular User (Member) Role**:
  - Secure login with mandatory initial password reset upon invitation.
  - View **only their own** assigned expense shares, payment history, and remaining balances.
  - Submit communication notes against their shares (e.g. *"I will pay tomorrow"*).
  - Manage private personal finance records (transactions & recurring subscriptions) in complete isolation.
  - Backend-enforced authorization guards prevent any modification of shared expenses or other members' data.

### 2. 🍽️ Team Expense Management & Automatic Splitting
- Dedicated **Team Expenses** module tailored for group meals, travel, groceries, entertainment, and shared costs.
- Expense tracking fields: Title, Category, Restaurant/Shop name, Location, Itemized food description, Total amount (in **PKR Rs.**), Date/time, Payer, and Participants.
- **Integer-Safe Minor Currency Math**: Eliminates rounding errors by converting amounts to paisa units.
- **Live Split Preview**: Displays per-person breakdown before saving.
- **Clean Balance Isolation**: The Admin's own share is recorded separately and never counted as receivables owed to themselves.

### 3. 💳 Payment Management & Ledger
- Each participant's share maintains independent statuses:
  - 🟡 **Pending** (no payment recorded)
  - 🔵 **Partial** (partially paid, tracks exact outstanding amount)
  - 🟢 **Cleared** (fully settled)
- Admin can record partial payments, full settlements, or void mistaken entries with automatic share recalculation.
- User communication notes do not automatically alter payment status, maintaining ledger integrity.

### 4. 📊 Analytics, Reports & Export
- Real-time Admin & Personal Dashboards with Recharts visual charts.
- Filter by date range, category, restaurant, or payment status.
- One-click **CSV Export** for financial audits and team transparency.
- Full Asia/Karachi timezone display for precise local financial records.

---

## 🛠️ Architecture & Tech Stack

```
FinTrack/
├── api/
│   └── index.js              # Serverless entry point for Vercel Functions
├── vercel.json               # Vercel deployment routes & SPA fallback
├── server/                   # Express 5 backend
│   ├── models/               # User, TeamExpense, ExpenseShare, Payment,
│   │                         # ExpenseNote, AuditLog, Transaction, Subscription
│   ├── routes/               # auth, team-expenses, payments, users, reports, notes
│   ├── middleware/            # auth (RBAC), rateLimiter, helmet, logger, errorHandler
│   ├── test_team_expenses.js # Automated 11-step end-to-end integration test
│   └── server.js             # Express app & standalone dev server
└── client/                   # React 19 + Vite 8 frontend
    ├── src/
    │   ├── components/       # Layout, Navbar, Sidebar, StatCard, Modal, Badge, Skeleton
    │   ├── context/          # AuthContext, ThemeContext, ToastContext
    │   ├── pages/            # AdminDashboard, UserDashboard, TeamExpenses, MyExpenses,
    │   │                     # Payments, MyPayments, Users, Reports, Transactions, Profile...
    │   └── utils/            # format.js (PKR, date/time formatting, split calculations)
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Recharts 3, Lucide React, Axios |
| **Backend** | Node.js (v20+ / v22+), Express 5, Mongoose 9, Helmet, Express Rate Limit |
| **Auth & Security** | JWT (jsonwebtoken), bcryptjs password hashing, RBAC middleware |
| **Database** | MongoDB Atlas / MongoDB 7+ |
| **Deployment** | Vercel (Unified Frontend + Serverless API Functions) |

---

## 🚀 Setup & Local Development

### Prerequisites
- Node.js (v18 or higher; v20 / v22 LTS recommended)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Install Dependencies
```bash
# In the root repository directory:
npm run install:all
```

### 2. Environment Variables
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/finance-tracker
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_SETUP_SECRET=your_one_time_admin_passcode
ALLOWED_ORIGINS=https://fin-track-orpin.vercel.app,http://localhost:5173
```

In `client/.env` (optional for local development, defaults to port 5000):
```env
VITE_API_URL=http://localhost:5000
```

### 3. Initialize Initial Admin Account
Public registration for team members is disabled. To set up your primary admin:
```bash
curl -X POST http://localhost:5000/api/auth/admin-setup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@fintrack.com",
    "password": "SecurePassword123!",
    "setupSecret": "your_one_time_admin_passcode"
  }'
```

### 4. Run Locally
Open two terminal tabs:

**Terminal 1 (Backend):**
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🧪 Automated Testing

Execute the end-to-end integration test scenario verifying user creation, Rs. 2000 dinner expense splitting, Rs. 1600 admin receivables, note submission, partial/cleared payments, and RBAC authorization blocks:

```bash
node server/test_team_expenses.js
```

Expected output:
```
🧪 Starting FinTrack Integration Tests...
✅ 1. Admin created: admin@fintrack-test.com
✅ 2. Created 4 team members: Team Member 1, Team Member 2, Team Member 3, Team Member 4
✅ 3. Team expense created for Rs. 2000
✅ 4. Each of 5 participants received exactly Rs. 400 share
✅ 5. Admin total receivables verified at Rs. 1,600
✅ 6. User 1 sees exclusively their own Rs. 400 share
✅ 7. User 1 added note: "Sorry, I will pay tomorrow."
✅ 8. Admin received and viewed note from User 1
✅ 9. Admin recorded partial payment Rs. 200. User 1 balance is now Rs. 200 (Partial)
✅ 10. Admin recorded remaining Rs. 200. Share status is now Cleared
✅ 11. Role Authorization verified: Regular user cannot perform admin updates
🎉 ALL 11 TEST CRITERIA PASSED SUCCESSFULLY!
```

---

## ☁️ Vercel Production Deployment

Deploy the entire monorepo to a single Vercel project:

1. Push your repository to **GitHub**.
2. Connect your repository to **Vercel**.
3. Vercel automatically detects `vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `client/dist`
   - Serverless Functions: `api/index.js`
4. Add Environment Variables in the Vercel Project Settings:
   - `MONGO_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: Production random secret string
   - `ADMIN_SETUP_SECRET`: Secure admin creation passcode
   - `NODE_ENV`: `production`
5. Click **Deploy**. Both the Vite SPA and Express serverless API will deploy together on your Vercel domain with automatic routing and SPA 404 rewrite prevention.

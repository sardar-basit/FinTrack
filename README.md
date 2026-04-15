# FinTrack - Personal Finance & Subscription Tracker

A full-stack MERN application for managing personal finances, tracking recurring subscriptions, and analyzing spending patterns.

## 🚀 Setup Guide

### Prerequisites
- Node.js (v16 or higher)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone & Install
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Variables
In the `server` directory, ensure you have a `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/finance-tracker
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### 3. Run the Application
Open two terminals:

**Terminal 1 (Backend):**
```bash
cd server
node server.js
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
Access the app at `http://localhost:5173`.

---

## 📚 API Documentation

### Authentication (`/api/auth`)
- `POST /register` - Register a new user (Body: name, email, password)
- `POST /login` - Authenticate and receive JWT (Body: email, password)
- `GET /me` - Get current user profile (Requires: Bearer token)
- `PUT /profile` - Update user currency/name (Requires: Bearer token)

### Transactions (`/api/transactions`)
*All routes require Bearer token*
- `GET /` - List user transactions (Query: type, category)
- `GET /summary` - Get income/expense summary
- `GET /monthly` - Get data for charts
- `POST /` - Create a transaction
- `PUT /:id` - Update a transaction
- `DELETE /:id` - Delete a transaction

### Subscriptions (`/api/subscriptions`)
*All routes require Bearer token*
- `GET /` - List user subscriptions
- `GET /summary` - Monthly recurring cost analysis
- `POST /` - Add a new subscription
- `PUT /:id` - Edit a subscription
- `DELETE /:id` - Cancel/Delete subscription

### Contact (`/api/contact`)
- `POST /` - Submit a message from the contact form
- `GET /` - Admin route to list messages (Requires: Bearer token)

---

## 🌍 Deployment Steps

### Backend (Render / Railway)
1. Push your code to GitHub.
2. Sign in to Render/Railway and create a new **Web Service**.
3. Point to the `server/` directory (if using root, set Root Directory).
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Set Environment Variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`.

### Frontend (Vercel / Netlify)
1. In `client/src/api/axiosInstance.js`, ensure `baseURL` uses an environment variable (e.g., `import.meta.env.VITE_API_URL`).
2. Sign in to Vercel/Netlify, import your GitHub repo.
3. Framework Preset: **Vite**
4. Root Directory: `client`
5. Add Environment Variable: `VITE_API_URL` pointing to your deployed backend URL.
6. Deploy! Make sure your backend `.env` CORS origin allows your new Vercel domain.

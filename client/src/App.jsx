import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForcePasswordChange from './pages/ForcePasswordChange';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import TeamExpenses from './pages/TeamExpenses';
import MyExpenses from './pages/MyExpenses';
import Payments from './pages/Payments';
import MyPayments from './pages/MyPayments';
import UsersPage from './pages/Users';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Subscriptions from './pages/Subscriptions';
import Contact from './pages/Contact';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/change-password" element={<PrivateRoute><ForcePasswordChange /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Layout>{user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}</Layout></PrivateRoute>} />
        <Route path="/team-expenses" element={<PrivateRoute adminOnly><Layout><TeamExpenses /></Layout></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute adminOnly><Layout><Payments /></Layout></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute adminOnly><Layout><UsersPage /></Layout></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute adminOnly><Layout><Reports /></Layout></PrivateRoute>} />
        <Route path="/my-expenses" element={<PrivateRoute><Layout><MyExpenses /></Layout></PrivateRoute>} />
        <Route path="/my-payments" element={<PrivateRoute><Layout><MyPayments /></Layout></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><Layout><Transactions /></Layout></PrivateRoute>} />
        <Route path="/subscriptions" element={<PrivateRoute><Layout><Subscriptions /></Layout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

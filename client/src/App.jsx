import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
// NOTE: Will import and create these later. 
// For now, these are placeholder components so App renders successfully.

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Subscriptions from './pages/Subscriptions';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
        
        {/* Protected Routes (with Layout) */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout><Navigate to="/dashboard" replace /></Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/transactions" 
          element={
            <PrivateRoute>
              <Layout><Transactions /></Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/subscriptions" 
          element={
            <PrivateRoute>
              <Layout><Subscriptions /></Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Layout><Profile /></Layout>
            </PrivateRoute>
          } 
        />
        
        {/* Public / Generic Route */}
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

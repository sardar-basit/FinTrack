import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--spacing-4)'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>FinTrack</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back! Please login to your account.</p>
        </div>
        
        <Card noPadding>
          <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-6)' }}>
            {error && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--color-error)', 
                padding: 'var(--spacing-3)', 
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-4)',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}
            
            <Input 
              label="Email Address" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            
            <Input 
              label="Password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            
            <div style={{ marginTop: 'var(--spacing-6)' }}>
              <Button type="submit" fullWidth loading={loading}>
                Sign In
              </Button>
            </div>
          </form>
          
          <div style={{ 
            padding: 'var(--spacing-4)', 
            borderTop: '1px solid var(--color-border)', 
            textAlign: 'center',
            backgroundColor: 'var(--color-surface-muted)',
            borderBottomLeftRadius: 'var(--radius-lg)',
            borderBottomRightRadius: 'var(--radius-lg)',
            fontSize: '0.875rem'
          }}>
             Don't have an account? <Link to="/signup" style={{ fontWeight: 600 }}>Sign up</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { User, Settings, Info } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axiosInstance.put('/auth/profile', { name, currency });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-6)' }}>Profile Settings</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-6)' }}>
        <Card title="Personal Information" icon={<User size={20} />}>
          <form onSubmit={handleUpdate}>
            {success && <div style={{ color: 'var(--color-success)', marginBottom: '1rem', backgroundColor: 'rgba(34,197,94,0.1)', padding: '0.75rem', borderRadius: '4px' }}>{success}</div>}
            
            <Input 
              label="Full Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
            
            <Input 
              label="Email Address" 
              value={user?.email || ''} 
              disabled 
              style={{ backgroundColor: 'var(--color-surface-muted)', cursor: 'not-allowed' }}
            />
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Preferred Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <Button type="submit" loading={loading}><Settings size={18} style={{ marginRight: '8px' }}/> Update Profile</Button>
            </div>
          </form>
        </Card>

        <Card title="About FinTrack">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '100%', color: 'var(--color-primary)' }}>
              <Info size={32} />
            </div>
            <div>
              <p style={{ marginBottom: '1rem' }}>
                FinTrack is your all-in-one personal finance dashboard. Track where your money goes, stay on top of recurring subscriptions, and visualize your spending trends over time.
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Version 1.0.0 &copy; {new Date().getFullYear()} FinTrack MERN App.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

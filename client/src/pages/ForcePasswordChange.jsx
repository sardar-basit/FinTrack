import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';

const ForcePasswordChange = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await axiosInstance.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      updateUser({ mustChangePassword: false });
      toast.success('Password changed successfully!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, background: 'var(--color-warning-bg)', border: '2px solid var(--color-warning)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Lock size={28} color="var(--color-warning)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Change your password</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Your admin has required you to set a new password.</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Temporary password</label>
              <input className="form-input" type="password" placeholder="Enter temporary password" value={form.currentPassword} onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input className="form-input" type="password" placeholder="At least 6 characters" value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Confirm new password</label>
              <input className="form-input" type="password" placeholder="Repeat new password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> Changing...</> : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;

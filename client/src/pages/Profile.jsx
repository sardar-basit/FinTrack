import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axiosInstance from '../api/axiosInstance';
import { getInitials } from '../utils/format';
import { Save, Lock, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', currency: user?.currency || 'PKR' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const r = await axiosInstance.put('/auth/profile', profileForm);
      updateUser(r.data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProfileLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) { toast.error('Passwords do not match'); return; }
    if (passForm.newPassword.length < 6) { toast.error('Min. 6 characters'); return; }
    setPassLoading(true);
    try {
      await axiosInstance.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPassLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><div className="page-header-left"><h1>Profile & Settings</h1><p>Manage your account information</p></div></div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.25rem', background: user?.role === 'admin' ? '#7c3aed' : '#10b981' }}>{getInitials(user?.name)}</div>
            <div><h3>{user?.name}</h3><p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{user?.email}</p><span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>{user?.role}</span></div>
          </div>
          <form onSubmit={saveProfile}>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Email (read-only)</label><input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} /></div>
            <div className="form-group"><label className="form-label">Currency</label><select className="form-input form-select" value={profileForm.currency} onChange={e => setProfileForm(p => ({ ...p, currency: e.target.value }))}><option value="PKR">PKR — Pakistani Rupee</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option></select></div>
            <button type="submit" className="btn btn-primary" disabled={profileLoading}>{profileLoading ? <><Loader2 size={16} className="spin" />Saving...</> : <><Save size={16} />Save Profile</>}</button>
          </form>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={20} />Change Password</h3>
          <form onSubmit={changePassword}>
            <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={passForm.currentPassword} onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={passForm.newPassword} onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min. 6 characters" required /></div>
            <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={passForm.confirm} onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))} required /></div>
            <button type="submit" className="btn btn-outline" disabled={passLoading}>{passLoading ? <><Loader2 size={16} className="spin" />Changing...</> : <><Lock size={16} />Change Password</>}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

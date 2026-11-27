import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatDate, getInitials } from '../utils/format';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { UserPlus, Edit2, Key, Eye, EyeOff, Loader2, Search } from 'lucide-react';

const defaultForm = { name: '', email: '', password: '', role: 'user', isActive: true };

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, userId: null, name: '' });
  const [resetPass, setResetPass] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    try { const r = await axiosInstance.get('/users'); setUsers(r.data.data); } catch { toast.error('Failed to load users'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const openCreate = () => { setForm(defaultForm); setModal({ open: true, editing: null }); };
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive }); setModal({ open: true, editing: u._id }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    if (!modal.editing && !form.password) { toast.error('Password required for new users'); return; }
    setSubmitting(true);
    try {
      if (modal.editing) { await axiosInstance.put(`/users/${modal.editing}`, { name: form.name, email: form.email, role: form.role, isActive: form.isActive }); toast.success('User updated'); }
      else { await axiosInstance.post('/users', form); toast.success('User created. They must change password on first login.'); }
      setModal({ open: false, editing: null }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
  };

  const handleResetPassword = async () => {
    if (!resetPass || resetPass.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await axiosInstance.put(`/users/${resetModal.userId}/reset-password`, { newPassword: resetPass });
      toast.success(`Password reset for ${resetModal.name}`);
      setResetModal({ open: false, userId: null, name: '' }); setResetPass('');
    } catch { toast.error('Failed to reset'); }
  };

  const toggleActive = async (u) => {
    try { await axiosInstance.put(`/users/${u._id}`, { isActive: !u.isActive }); toast.success(`${u.name} ${!u.isActive ? 'activated' : 'deactivated'}`); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header"><div className="page-header-left"><h1>User Management</h1><p>Create and manage team members</p></div><button className="btn btn-primary" onClick={openCreate}><UserPlus size={18} />Add User</button></div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
          </div>
        </div>
        {loading ? <SkeletonTable rows={4} /> : filtered.length === 0 ? (
          <div className="empty-state"><UserPlus size={40} /><h3>No users found</h3></div>
        ) : (
          <div className="responsive-table">
            <table className="table">
              <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}><div className="avatar" style={{ width: 36, height: 36, background: u.role === 'admin' ? '#7c3aed' : '#10b981' }}>{getInitials(u.name)}</div><div><p style={{ fontWeight: 500 }}>{u.name}</p><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</p></div></div></td>
                    <td><Badge status={u.role} label={u.role} /></td>
                    <td><Badge status={u.isActive ? 'active' : 'inactive'} label={u.isActive ? 'Active' : 'Inactive'} /></td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                    <td><div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setResetModal({ open: true, userId: u._id, name: u.name })} title="Reset Password"><Key size={14} /></button>
                      <button className={`btn btn-sm ${u.isActive ? 'btn-outline' : 'btn-accent'}`} onClick={() => toggleActive(u)} style={{ fontSize: '0.75rem' }}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? 'Edit User' : 'Add New User'}
        footer={<><button className="btn btn-outline" onClick={() => setModal({ open: false, editing: null })}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? <><Loader2 size={16} className="spin" />{modal.editing ? 'Saving...' : 'Creating...'}</> : modal.editing ? 'Save Changes' : 'Create User'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" required /></div>
          <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" required /></div>
          {!modal.editing && (
            <div className="form-group"><label className="form-label">Temporary Password *</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 characters" style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <span className="form-error" style={{ color: 'var(--color-text-muted)' }}>User must change this on first login.</span>
            </div>
          )}
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Role</label><select className="form-input form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}><option value="user">Member</option><option value="admin">Admin</option></select></div>
            {modal.editing && <div className="form-group"><label className="form-label">Status</label><select className="form-input form-select" value={String(form.isActive)} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}><option value="true">Active</option><option value="false">Inactive</option></select></div>}
          </div>
        </form>
      </Modal>
      <Modal isOpen={resetModal.open} onClose={() => { setResetModal({ open: false, userId: null, name: '' }); setResetPass(''); }} title={`Reset Password — ${resetModal.name}`}
        footer={<><button className="btn btn-outline" onClick={() => { setResetModal({ open: false, userId: null, name: '' }); setResetPass(''); }}>Cancel</button><button className="btn btn-primary" onClick={handleResetPassword}><Key size={16} />Reset</button></>}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>The user will be required to change this on next login.</p>
        <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">New Temporary Password</label><input className="form-input" type="text" placeholder="Min. 6 characters" value={resetPass} onChange={e => setResetPass(e.target.value)} /></div>
      </Modal>
    </div>
  );
};

export default UsersPage;

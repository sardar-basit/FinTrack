import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatPKR, formatDate, getInitials, calculateSplit } from '../utils/format';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Loader2, Users } from 'lucide-react';

const CATEGORIES = ['Breakfast','Lunch','Dinner','Tea & Snacks','Travel','Groceries','Entertainment','Other'];
const defaultForm = { title: '', category: 'Dinner', restaurantName: '', location: '', description: '', totalAmount: '', date: new Date().toISOString().slice(0, 16), paidBy: '', participants: [], adminNote: '' };

const TeamExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [delConfirm, setDelConfirm] = useState({ open: false, id: null });
  const [expanded, setExpanded] = useState(null);
  const [shares, setShares] = useState({});
  const toast = useToast();
  const splitPreview = form.participants.length > 0 && form.totalAmount ? calculateSplit(Number(form.totalAmount), form.participants.length) : null;

  const load = useCallback(async () => {
    try {
      const [expRes, usrRes] = await Promise.all([axiosInstance.get('/team-expenses?limit=50'), axiosInstance.get('/users')]);
      setExpenses(expRes.data.data);
      const activeUsers = usrRes.data.data.filter(u => u.isActive);
      setUsers(activeUsers);
    } catch { toast.error('Failed to load expenses'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    const admin = users.find(u => u.role === 'admin');
    setForm({ ...defaultForm, paidBy: admin?._id || '', date: new Date().toISOString().slice(0, 16) });
    setModal({ open: true, editing: null });
  };

  const openEdit = (exp) => {
    setForm({ title: exp.title, category: exp.category, restaurantName: exp.restaurantName || '', location: exp.location || '', description: exp.description || '', totalAmount: String(exp.totalAmount), date: new Date(exp.date).toISOString().slice(0, 16), paidBy: exp.paidBy?._id || '', participants: exp.participants?.map(p => p._id) || [], adminNote: exp.adminNote || '' });
    setModal({ open: true, editing: exp._id });
  };

  const toggleParticipant = (userId) => {
    setForm(prev => ({ ...prev, participants: prev.participants.includes(userId) ? prev.participants.filter(id => id !== userId) : [...prev.participants, userId] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.totalAmount || form.participants.length === 0) { toast.error('Title, amount and at least one participant required'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, totalAmount: Number(form.totalAmount) };
      if (modal.editing) { await axiosInstance.put(`/team-expenses/${modal.editing}`, payload); toast.success('Expense updated'); }
      else { await axiosInstance.post('/team-expenses', payload); toast.success('Expense created and shares distributed'); }
      setModal({ open: false, editing: null });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save expense'); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try { await axiosInstance.delete(`/team-expenses/${delConfirm.id}`); toast.success('Expense deleted'); setDelConfirm({ open: false, id: null }); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleExpand = async (expId) => {
    if (expanded === expId) { setExpanded(null); return; }
    setExpanded(expId);
    if (!shares[expId]) {
      try { const res = await axiosInstance.get(`/team-expenses/${expId}`); setShares(prev => ({ ...prev, [expId]: res.data.data.shares || [] })); }
      catch { toast.error('Failed to load shares'); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Team Expenses</h1><p>Create and manage shared team expenses</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18} />New Expense</button>
      </div>

      {loading ? <SkeletonTable rows={5} /> : expenses.length === 0 ? (
        <div className="card"><div className="empty-state"><Plus size={40} /><h3>No expenses yet</h3><p>Create your first team expense</p><button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}><Plus size={16} />Create Expense</button></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {expenses.map(exp => (
            <div key={exp._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>{exp.title}</span>
                    <span className="badge badge-user" style={{ fontSize: '0.7rem' }}>{exp.category}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(exp.date)} {exp.restaurantName && `• ${exp.restaurantName}`} {exp.location && `• ${exp.location}`}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    <Users size={12} style={{ display: 'inline', marginRight: 4 }} />{exp.participants?.length || 0} participants • Rs. {((exp.totalAmount || 0) / (exp.participants?.length || 1)).toFixed(0)} each
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-expense)' }}>{formatPKR(exp.totalAmount)}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Paid by {exp.paidBy?.name || 'Unknown'}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exp)}><Edit2 size={15} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setDelConfirm({ open: true, id: exp._id })}><Trash2 size={15} /></button>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleExpand(exp._id)} style={{ gap: 4 }}>
                    Shares {expanded === exp._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>
              {expanded === exp._id && (
                <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
                  <div className="responsive-table">
                    <table className="table">
                      <thead><tr><th>Member</th><th>Share</th><th>Paid</th><th>Remaining</th><th>Status</th></tr></thead>
                      <tbody>
                        {(shares[exp._id] || []).map(sh => (
                          <tr key={sh._id}>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', background: '#10b981' }}>{getInitials(sh.user?.name)}</div><span style={{ fontWeight: 500 }}>{sh.user?.name}</span></div></td>
                            <td style={{ fontWeight: 600 }}>{formatPKR(sh.shareAmount)}</td>
                            <td style={{ color: 'var(--color-income)' }}>{formatPKR(sh.paidAmount)}</td>
                            <td style={{ color: sh.shareAmount - sh.paidAmount > 0 ? 'var(--color-expense)' : 'var(--color-income)', fontWeight: 600 }}>{formatPKR(sh.shareAmount - sh.paidAmount)}</td>
                            <td><Badge status={sh.status} label={sh.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? 'Edit Expense' : 'New Team Expense'} size="lg"
        footer={<><button className="btn btn-outline" onClick={() => setModal({ open: false, editing: null })}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? <><Loader2 size={16} className="spin" />Saving...</> : modal.editing ? 'Update' : 'Create & Split'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Title *</label><input className="form-input" placeholder="e.g. Team Lunch" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Category *</label><select className="form-input form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Restaurant / Shop</label><input className="form-input" placeholder="e.g. Madina Restaurant" value={form.restaurantName} onChange={e => setForm(p => ({ ...p, restaurantName: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Location</label><input className="form-input" placeholder="e.g. F-8 Markaz" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Food Items / Description</label><textarea className="form-input form-textarea" placeholder="e.g. Chicken Biryani, Roti, Lassi..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Total Amount (Rs.) *</label><input className="form-input" type="number" min="1" step="1" placeholder="2000" value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Date & Time *</label><input className="form-input" type="datetime-local" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required /></div>
          </div>
          <div className="form-group"><label className="form-label">Paid By</label><select className="form-input form-select" value={form.paidBy} onChange={e => setForm(p => ({ ...p, paidBy: e.target.value }))}><option value="">Select payer</option>{users.map(u => <option key={u._id} value={u._id}>{u.name} {u.role === 'admin' ? '(Admin)' : ''}</option>)}</select></div>
          <div className="form-group">
            <label className="form-label">Participants * (select all who shared)</label>
            <div className="participant-grid">
              {users.map(u => (
                <label key={u._id} className={`participant-item ${form.participants.includes(u._id) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={form.participants.includes(u._id)} onChange={() => toggleParticipant(u._id)} />
                  <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', background: u.role === 'admin' ? '#7c3aed' : '#10b981' }}>{getInitials(u.name)}</div>
                  <span>{u.name} {u.role === 'admin' ? '(Admin)' : ''}</span>
                </label>
              ))}
            </div>
          </div>
          {splitPreview && (
            <div className="split-preview">
              <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>💰 Split Preview</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}><span>Total Amount:</span><span style={{ fontWeight: 700 }}>{formatPKR(Number(form.totalAmount))}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}><span>Participants:</span><span style={{ fontWeight: 600 }}>{form.participants.length}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}><span style={{ fontWeight: 600 }}>Per Person:</span><span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '1rem' }}>{formatPKR(splitPreview.perPerson)}</span></div>
            </div>
          )}
          <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}><label className="form-label">Admin Note (optional)</label><textarea className="form-input form-textarea" placeholder="Internal note..." value={form.adminNote} onChange={e => setForm(p => ({ ...p, adminNote: e.target.value }))} rows={2} /></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={delConfirm.open} onClose={() => setDelConfirm({ open: false, id: null })} onConfirm={handleDelete} title="Delete Expense" message="Are you sure? This will soft-delete the expense but preserve payment records." confirmLabel="Delete" danger />
    </div>
  );
};

export default TeamExpenses;

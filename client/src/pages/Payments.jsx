import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatPKR, formatDate, getInitials } from '../utils/format';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { DollarSign, Loader2, Undo2, AlertCircle } from 'lucide-react';

const Payments = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userShares, setUserShares] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, shareId: null, shareAmount: 0, paidAmount: 0 });
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: new Date().toISOString().slice(0, 10), note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [voidConfirm, setVoidConfirm] = useState({ open: false, id: null });
  const [notes, setNotes] = useState([]);
  const toast = useToast();

  const loadData = useCallback(async () => {
    try {
      const [usrRes, payRes, noteRes] = await Promise.all([axiosInstance.get('/users'), axiosInstance.get('/payments'), axiosInstance.get('/notes')]);
      setUsers(usrRes.data.data);
      setPayments(payRes.data.data);
      setNotes(noteRes.data.data);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selectedUser) { setUserShares([]); return; }
    setSharesLoading(true);
    axiosInstance.get(`/users/${selectedUser}/balance`).then(r => setUserShares(r.data.data)).catch(() => toast.error('Failed to load balances')).finally(() => setSharesLoading(false));
  }, [selectedUser]);

  const openPayModal = (share) => {
    const remaining = share.shareAmount - share.paidAmount;
    setModal({ open: true, shareId: share.shareId, shareAmount: share.shareAmount, paidAmount: share.paidAmount });
    setPayForm({ amount: String(remaining.toFixed(2)), paymentDate: new Date().toISOString().slice(0, 10), note: '' });
  };

  const submitPayment = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await axiosInstance.post('/payments', { shareId: modal.shareId, amount: Number(payForm.amount), paymentDate: payForm.paymentDate, note: payForm.note });
      toast.success('Payment recorded');
      setModal({ open: false, shareId: null, shareAmount: 0, paidAmount: 0 });
      axiosInstance.get(`/users/${selectedUser}/balance`).then(r => setUserShares(r.data.data));
      axiosInstance.get('/payments').then(r => setPayments(r.data.data));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
  };

  const voidPayment = async () => {
    try {
      await axiosInstance.post(`/payments/${voidConfirm.id}/void`, { reason: 'Voided by admin' });
      toast.success('Payment voided');
      setVoidConfirm({ open: false, id: null });
      loadData();
      if (selectedUser) axiosInstance.get(`/users/${selectedUser}/balance`).then(r => setUserShares(r.data.data));
    } catch { toast.error('Failed to void'); }
  };

  const selectedUserData = users.find(u => u._id === selectedUser);
  const memberNotes = notes.filter(n => !selectedUser || n.author?._id === selectedUser);
  const outstanding = userShares.reduce((s, sh) => s + sh.outstanding, 0);

  if (loading) return <div><div className="page-header"><div className="page-header-left"><h1>Payments</h1></div></div><SkeletonTable /></div>;

  return (
    <div>
      <div className="page-header"><div className="page-header-left"><h1>Payment Management</h1><p>Record and track member payments</p></div></div>

      <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <p className="card-title">Select Member</p>
            <select className="form-input form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">Choose a member...</option>
              {users.filter(u => u.role !== 'admin').map(u => <option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}
            </select>
            {selectedUserData && outstanding > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--color-error-bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} color="var(--color-error)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-error)', fontWeight: 600 }}>Outstanding: {formatPKR(outstanding)}</span>
              </div>
            )}
          </div>
          {selectedUser && (
            <div className="card" style={{ padding: 0 }}>
              {sharesLoading ? <SkeletonTable rows={3} /> : userShares.length === 0 ? (
                <div className="empty-state"><DollarSign size={36} /><h3>No expense shares</h3></div>
              ) : (<>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}><p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Expense Shares for {selectedUserData?.name}</p></div>
                <div className="responsive-table">
                  <table className="table">
                    <thead><tr><th>Expense</th><th>Share</th><th>Paid</th><th>Remaining</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {userShares.map(sh => (
                        <tr key={sh.shareId}>
                          <td><div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{sh.expenseTitle}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(sh.expenseDate)}</div></td>
                          <td style={{ fontWeight: 600 }}>{formatPKR(sh.shareAmount)}</td>
                          <td style={{ color: 'var(--color-income)' }}>{formatPKR(sh.paidAmount)}</td>
                          <td style={{ color: sh.outstanding > 0 ? 'var(--color-expense)' : 'var(--color-income)', fontWeight: 600 }}>{formatPKR(sh.outstanding)}</td>
                          <td><Badge status={sh.status} label={sh.status} /></td>
                          <td>{sh.status !== 'cleared' && <button className="btn btn-accent btn-sm" onClick={() => openPayModal(sh)}><DollarSign size={14} />Pay</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>)}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '1rem', padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}><p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Recent Payments</p></div>
            {payments.slice(0, 10).length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}><p>No payments yet</p></div>
            ) : (
              <div className="responsive-table">
                <table className="table">
                  <thead><tr><th>Member</th><th>Expense</th><th>Amount</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {payments.slice(0, 10).map(p => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 500 }}>{p.user?.name}</td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{p.expense?.title}</td>
                        <td style={{ color: 'var(--color-income)', fontWeight: 600 }}>{formatPKR(p.amount)}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(p.paymentDate)}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={() => setVoidConfirm({ open: true, id: p._id })} title="Void"><Undo2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}><p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Member Notes</p></div>
            {memberNotes.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}><p>No notes submitted</p></div>
            ) : (
              <div style={{ padding: '0.5rem 0' }}>
                {memberNotes.slice(0, 8).map(n => (
                  <div key={n._id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', background: '#10b981' }}>{getInitials(n.author?.name)}</div>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{n.author?.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{formatDate(n.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginLeft: 32 }}>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, shareId: null, shareAmount: 0, paidAmount: 0 })} title="Record Payment"
        footer={<><button className="btn btn-outline" onClick={() => setModal({ open: false, shareId: null, shareAmount: 0, paidAmount: 0 })}>Cancel</button><button className="btn btn-accent" onClick={submitPayment} disabled={submitting}>{submitting ? <><Loader2 size={16} className="spin" />Recording...</> : <><DollarSign size={16} />Record Payment</>}</button></>}>
        <div style={{ background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
          <div><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total Share</p><p style={{ fontWeight: 700 }}>{formatPKR(modal.shareAmount)}</p></div>
          <div><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Already Paid</p><p style={{ fontWeight: 700, color: 'var(--color-income)' }}>{formatPKR(modal.paidAmount)}</p></div>
          <div><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Remaining</p><p style={{ fontWeight: 700, color: 'var(--color-expense)' }}>{formatPKR(modal.shareAmount - modal.paidAmount)}</p></div>
        </div>
        <div className="form-group"><label className="form-label">Amount (Rs.) *</label><input className="form-input" type="number" min="1" step="0.01" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Payment Date</label><input className="form-input" type="date" value={payForm.paymentDate} onChange={e => setPayForm(p => ({ ...p, paymentDate: e.target.value }))} /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Note (optional)</label><input className="form-input" placeholder="e.g. Cash payment received" value={payForm.note} onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))} /></div>
      </Modal>
      <ConfirmDialog isOpen={voidConfirm.open} onClose={() => setVoidConfirm({ open: false, id: null })} onConfirm={voidPayment} title="Void Payment" message="Void this payment? The member's balance will be restored." confirmLabel="Void Payment" danger />
    </div>
  );
};

export default Payments;

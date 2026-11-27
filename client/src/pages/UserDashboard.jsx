import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatPKR, formatDate } from '../utils/format';
import { SkeletonCard } from '../components/Skeleton';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { Receipt, Banknote, TrendingDown, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState({ open: false, shareId: null, expenseTitle: '' });
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, expRes] = await Promise.all([
          axiosInstance.get('/team-expenses/my-summary'),
          axiosInstance.get('/team-expenses?limit=10'),
        ]);
        setSummary(sumRes.data.data);
        setExpenses(expRes.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const submitNote = async () => {
    if (!noteText.trim()) { toast.error('Note cannot be empty'); return; }
    setNoteLoading(true);
    try {
      await axiosInstance.post('/notes', { shareId: noteModal.shareId, message: noteText.trim() });
      toast.success('Note submitted successfully');
      setNoteModal({ open: false, shareId: null, expenseTitle: '' });
      setNoteText('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit note'); }
    finally { setNoteLoading(false); }
  };

  if (loading) return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}><div className="skeleton" style={{ height: '28px', width: '200px', marginBottom: '8px' }} /></div>
      <div className="stats-grid">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
    </div>
  );

  const stats = [
    { label: 'Total Expenses', value: summary?.totalOwed || 0, icon: Receipt, color: '#1e293b', iconBg: '#f1f5f9' },
    { label: 'Total Paid', value: summary?.totalPaid || 0, icon: Banknote, color: '#10b981', iconBg: '#ecfdf5' },
    { label: 'Outstanding Balance', value: summary?.outstanding || 0, icon: TrendingDown, color: '#ef4444', iconBg: '#fef2f2' },
    { label: 'This Month', value: summary?.monthlySpending || 0, icon: Calendar, color: '#3b82f6', iconBg: '#eff6ff' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>My Dashboard</h1><p>Your personal expense overview</p></div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/my-expenses')}><Receipt size={16} />View all expenses</button>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.label}</span>
              <div style={{ width: 36, height: 36, background: s.iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={18} color={s.color} /></div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{formatPKR(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="card-title">My Recent Expense Shares</p>
        {expenses.length === 0 ? (
          <div className="empty-state"><Receipt size={40} /><h3>No expenses assigned yet</h3><p>Your team expenses will appear here once the admin creates them.</p></div>
        ) : (
          <div className="responsive-table">
            <table className="table">
              <thead><tr><th>Date</th><th>Expense</th><th>Restaurant</th><th>My Share</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                {expenses.map(exp => {
                  const share = exp.myShare;
                  if (!share) return null;
                  const remaining = share.shareAmount - share.paidAmount;
                  return (
                    <tr key={exp._id}>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
                      <td style={{ fontWeight: 500 }}>{exp.title}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{exp.restaurantName || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatPKR(share.shareAmount)}</td>
                      <td style={{ color: 'var(--color-income)', fontWeight: 500 }}>{formatPKR(share.paidAmount)}</td>
                      <td style={{ color: remaining > 0 ? 'var(--color-expense)' : 'var(--color-income)', fontWeight: 600 }}>{formatPKR(remaining)}</td>
                      <td><Badge status={share.status} label={share.status} /></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => setNoteModal({ open: true, shareId: share._id, expenseTitle: exp.title })}><MessageSquare size={15} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={noteModal.open} onClose={() => { setNoteModal({ open: false, shareId: null, expenseTitle: '' }); setNoteText(''); }} title={`Add Note — ${noteModal.expenseTitle}`}
        footer={<>
          <button className="btn btn-outline" onClick={() => { setNoteModal({ open: false, shareId: null, expenseTitle: '' }); setNoteText(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={submitNote} disabled={noteLoading}>{noteLoading ? <><Loader2 size={16} className="spin" />Submitting...</> : <><MessageSquare size={16} />Submit Note</>}</button>
        </>}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>This note will be visible to the admin. It will not change your payment status.</p>
        <div className="form-group"><label className="form-label">Your note</label><textarea className="form-input form-textarea" placeholder="e.g. I will pay tomorrow, please remind me on Friday..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} /></div>
      </Modal>
    </div>
  );
};

export default UserDashboard;

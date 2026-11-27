import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatPKR, formatDate } from '../utils/format';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { MessageSquare, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const MyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState({ open: false, shareId: null, expenseTitle: '' });
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});
  const toast = useToast();

  useEffect(() => {
    axiosInstance.get('/team-expenses?limit=100')
      .then(r => setExpenses(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const submitNote = async () => {
    if (!noteText.trim()) { toast.error('Note cannot be empty'); return; }
    setNoteLoading(true);
    try {
      await axiosInstance.post('/notes', { shareId: noteModal.shareId, message: noteText.trim() });
      toast.success('Note submitted');
      setNoteModal({ open: false, shareId: null, expenseTitle: '' });
      setNoteText('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setNoteLoading(false); }
  };

  const toggleNotes = async (shareId) => {
    if (expanded === shareId) { setExpanded(null); return; }
    setExpanded(shareId);
    if (!notes[shareId]) {
      try { const r = await axiosInstance.get(`/notes/share/${shareId}`); setNotes(prev => ({ ...prev, [shareId]: r.data.data })); } catch {}
    }
  };

  if (loading) return <div><div className="page-header"><div className="page-header-left"><h1>My Expenses</h1></div></div><SkeletonTable rows={5} /></div>;

  return (
    <div>
      <div className="page-header"><div className="page-header-left"><h1>My Expenses</h1><p>All shared expenses assigned to you</p></div></div>
      <div className="card" style={{ padding: 0 }}>
        {expenses.length === 0 ? (
          <div className="empty-state"><MessageSquare size={40} /><h3>No expenses yet</h3><p>Your team expenses will appear here.</p></div>
        ) : (
          <div className="responsive-table">
            <table className="table">
              <thead><tr><th>Date</th><th>Expense</th><th>Restaurant</th><th>My Share</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {expenses.map(exp => {
                  const share = exp.myShare;
                  if (!share) return null;
                  const remaining = share.shareAmount - share.paidAmount;
                  return (
                    <tr key={exp._id}>
                      <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDate(exp.date)}</td>
                      <td style={{ fontWeight: 500 }}>{exp.title}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{exp.restaurantName || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatPKR(share.shareAmount)}</td>
                      <td style={{ color: 'var(--color-income)' }}>{formatPKR(share.paidAmount)}</td>
                      <td style={{ color: remaining > 0 ? 'var(--color-expense)' : 'var(--color-income)', fontWeight: 600 }}>{formatPKR(remaining)}</td>
                      <td><Badge status={share.status} label={share.status} /></td>
                      <td><div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setNoteModal({ open: true, shareId: share._id, expenseTitle: exp.title })} title="Add Note"><MessageSquare size={15} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleNotes(share._id)} title="View Notes">{expanded === share._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal isOpen={noteModal.open} onClose={() => { setNoteModal({ open: false, shareId: null, expenseTitle: '' }); setNoteText(''); }} title={`Add Note — ${noteModal.expenseTitle}`}
        footer={<><button className="btn btn-outline" onClick={() => { setNoteModal({ open: false, shareId: null, expenseTitle: '' }); setNoteText(''); }}>Cancel</button><button className="btn btn-primary" onClick={submitNote} disabled={noteLoading}>{noteLoading ? 'Submitting...' : 'Submit Note'}</button></>}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>This note is visible to the admin. It does not affect your payment status.</p>
        <div className="form-group"><label className="form-label">Note</label><textarea className="form-input form-textarea" placeholder="e.g. I will pay tomorrow..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} /></div>
      </Modal>
    </div>
  );
};

export default MyExpenses;

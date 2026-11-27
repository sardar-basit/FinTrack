import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatPKR, formatDate } from '../utils/format';
import { SkeletonTable } from '../components/Skeleton';
import { Banknote } from 'lucide-react';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/payments').then(r => setPayments(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header"><div className="page-header-left"><h1>My Payments</h1><p>Your payment history</p></div></div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <SkeletonTable rows={5} /> : payments.length === 0 ? (
          <div className="empty-state"><Banknote size={40} /><h3>No payments yet</h3><p>Your payment history will appear here.</p></div>
        ) : (
          <div className="responsive-table">
            <table className="table">
              <thead><tr><th>Date</th><th>Expense</th><th>Amount Paid</th><th>Recorded By</th><th>Note</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{formatDate(p.paymentDate)}</td>
                    <td style={{ fontWeight: 500 }}>{p.expense?.title || '—'}</td>
                    <td style={{ color: 'var(--color-income)', fontWeight: 700 }}>{formatPKR(p.amount)}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{p.recordedBy?.name || 'Admin'}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPayments;

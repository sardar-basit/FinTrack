import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatPKR } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Badge from '../components/Badge';
import { Download, BarChart3 } from 'lucide-react';

const COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Reports = () => {
  const [data, setData] = useState(null);
  const [paymentData, setPaymentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const [overviewRes, payRes] = await Promise.all([
        axiosInstance.get(`/reports/overview?${params}`),
        axiosInstance.get(`/reports/payments${statusFilter ? `?status=${statusFilter}` : ''}`)
      ]);
      setData(overviewRes.data.data);
      setPaymentData(payRes.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    const rows = [['Member','Expense','Restaurant','Category','Share','Paid','Outstanding','Status']];
    paymentData.forEach(sh => {
      rows.push([sh.user?.name || '', sh.expense?.title || '', sh.expense?.restaurantName || '', sh.expense?.category || '', sh.shareAmount, sh.paidAmount, sh.shareAmount - sh.paidAmount, sh.status]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fintrack-report-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  if (loading && !data) return <div className="page-header"><div className="page-header-left"><h1>Reports</h1><p>Loading...</p></div></div>;

  return (
    <div>
      <div className="page-header"><div className="page-header-left"><h1>Reports</h1><p>Financial reports and analytics</p></div><button className="btn btn-outline" onClick={exportCSV}><Download size={16} />Export CSV</button></div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filters-row">
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}><label className="form-label">Start Date</label><input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}><label className="form-label">End Date</label><input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}><label className="form-label">Status</label><select className="form-input form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All</option><option value="pending">Pending</option><option value="partial">Partial</option><option value="cleared">Cleared</option></select></div>
          <div style={{ alignSelf: 'flex-end' }}><button className="btn btn-primary" onClick={load}><BarChart3 size={16} />Apply</button></div>
        </div>
      </div>

      {data && (<>
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card"><span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Total Expenses</span><p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.totalExpenses?.count || 0}</p></div>
          <div className="stat-card"><span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Total Spending</span><p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatPKR(data.totalExpenses?.total || 0)}</p></div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <p className="card-title">Monthly Spending</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(data.monthly || []).map(m => ({ name: MONTHS[m._id.month-1], amount: m.total }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatPKR(v)} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }} />
                <Bar dataKey="amount" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <p className="card-title">By Category</p>
            {(data.byCategory || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.byCategory.map(c => ({ name: c._id, value: c.total }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatPKR(v)} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No data</p></div>}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem', padding: 0 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}><p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Member Balances</p></div>
          <div className="responsive-table">
            <table className="table">
              <thead><tr><th>Member</th><th>Total Owed</th><th>Total Paid</th><th>Outstanding</th><th>Progress</th></tr></thead>
              <tbody>
                {(data.memberBalances || []).map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td style={{ fontWeight: 600 }}>{formatPKR(m.totalOwed)}</td>
                    <td style={{ color: 'var(--color-income)' }}>{formatPKR(m.totalPaid)}</td>
                    <td style={{ color: m.outstanding > 0 ? 'var(--color-expense)' : 'var(--color-income)', fontWeight: 600 }}>{formatPKR(m.outstanding)}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(100, m.totalOwed > 0 ? (m.totalPaid / m.totalOwed) * 100 : 0)}%`, background: 'var(--color-income)' }} /></div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.totalOwed > 0 ? Math.round((m.totalPaid / m.totalOwed) * 100) : 0}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>)}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}><p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Payment Records ({paymentData.length})</p></div>
        <div className="responsive-table">
          <table className="table">
            <thead><tr><th>Member</th><th>Expense</th><th>Category</th><th>Share</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead>
            <tbody>
              {paymentData.slice(0, 50).map(sh => (
                <tr key={sh._id}>
                  <td style={{ fontWeight: 500 }}>{sh.user?.name}</td>
                  <td>{sh.expense?.title}</td>
                  <td><span className="badge badge-user" style={{ fontSize: '0.7rem' }}>{sh.expense?.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{formatPKR(sh.shareAmount)}</td>
                  <td style={{ color: 'var(--color-income)' }}>{formatPKR(sh.paidAmount)}</td>
                  <td style={{ color: (sh.shareAmount - sh.paidAmount) > 0 ? 'var(--color-expense)' : 'var(--color-income)', fontWeight: 600 }}>{formatPKR(sh.shareAmount - sh.paidAmount)}</td>
                  <td><Badge status={sh.status} label={sh.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

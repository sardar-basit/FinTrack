import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatPKR, formatDate, getInitials } from '../utils/format';
import { SkeletonCard } from '../components/Skeleton';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Receipt, Banknote, Calendar, Plus, UserPlus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, expensesRes, usersRes, reportRes] = await Promise.all([
          axiosInstance.get('/team-expenses/summary'),
          axiosInstance.get('/team-expenses?limit=5'),
          axiosInstance.get('/users'),
          axiosInstance.get('/reports/overview').catch(() => ({ data: { data: { monthly: [], byCategory: [] } } })),
        ]);
        setSummary(summaryRes.data.data);
        setRecentExpenses(expensesRes.data.data);
        setMembers(usersRes.data.data);
        setChartData((reportRes.data.data.monthly || []).map(m => ({ name: MONTHS[m._id.month - 1], amount: m.total })));
        setCategoryData((reportRes.data.data.byCategory || []).map(c => ({ name: c._id, value: c.total })));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}><div className="skeleton" style={{ height: '28px', width: '200px', marginBottom: '8px' }} /><div className="skeleton" style={{ height: '16px', width: '300px' }} /></div>
      <div className="stats-grid">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
    </div>
  );

  const stats = [
    { label: 'Total Team Spending', value: summary?.totalSpending || 0, icon: Receipt, color: '#1e293b', iconBg: '#f1f5f9' },
    { label: 'Total Received', value: summary?.totalReceived || 0, icon: TrendingUp, color: '#10b981', iconBg: '#ecfdf5' },
    { label: 'Outstanding', value: summary?.totalOutstanding || 0, icon: TrendingDown, color: '#ef4444', iconBg: '#fef2f2' },
    { label: 'This Month', value: summary?.monthlySpending || 0, icon: Calendar, color: '#3b82f6', iconBg: '#eff6ff' },
    { label: "Today's Spending", value: summary?.todaySpending || 0, icon: Banknote, color: '#f59e0b', iconBg: '#fffbeb' },
    { label: 'Active Members', value: members.filter(m => m.isActive).length, icon: Users, color: '#8b5cf6', iconBg: '#ede9fe', isCurrency: false },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Admin Dashboard</h1><p>Team expense overview and financial summary</p></div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/users')}><UserPlus size={16} />Add User</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/team-expenses')}><Plus size={16} />New Expense</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.label}</span>
              <div style={{ width: 36, height: 36, background: s.iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={18} color={s.color} /></div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.isCurrency === false ? s.value : formatPKR(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <p className="card-title">Monthly Spending</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatPKR(v)} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }} />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <p className="card-title">By Category</p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatPKR(v)} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No expense data yet</p></div>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <p className="card-title" style={{ marginBottom: 0 }}>Recent Expenses</p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/team-expenses')} style={{ gap: 4 }}>View all <ArrowRight size={14} /></button>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="empty-state"><Receipt size={36} /><h3>No expenses yet</h3><p>Create your first team expense</p></div>
        ) : (
          <div className="responsive-table">
            <table className="table">
              <thead><tr><th>Date</th><th>Title</th><th>Restaurant</th><th>Participants</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {recentExpenses.map(exp => (
                  <tr key={exp._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/team-expenses')}>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
                    <td style={{ fontWeight: 500 }}>{exp.title}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{exp.restaurantName || '—'}</td>
                    <td><span className="badge badge-user">{exp.participants?.length || 0} members</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-expense)' }}>{formatPKR(exp.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <p className="card-title" style={{ marginBottom: 0 }}>Member Balances</p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payments')}>Manage payments <ArrowRight size={14} /></button>
        </div>
        {members.filter(m => m.role !== 'admin').length === 0 ? (
          <div className="empty-state"><Users size={36} /><h3>No members yet</h3></div>
        ) : (
          <div className="responsive-table">
            <table className="table">
              <thead><tr><th>Member</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {members.filter(m => m.role !== 'admin').map(m => (
                  <tr key={m._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', background: '#10b981' }}>{getInitials(m.name)}</div>
                        <div><p style={{ fontWeight: 500 }}>{m.name}</p><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.email}</p></div>
                      </div>
                    </td>
                    <td><Badge status={m.isActive ? 'active' : 'inactive'} label={m.isActive ? 'Active' : 'Inactive'} /></td>
                    <td style={{ textAlign: 'right' }}><button className="btn btn-outline btn-sm" onClick={() => navigate('/payments')}>View balance</button></td>
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

export default AdminDashboard;

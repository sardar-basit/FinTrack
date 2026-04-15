import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Activity } from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [subSummary, setSubSummary] = useState({ totalActive: 0, monthlyTotal: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [sumRes, subRes, monthRes] = await Promise.all([
          axiosInstance.get('/transactions/summary'),
          axiosInstance.get('/subscriptions/summary'),
          axiosInstance.get('/transactions/monthly')
        ]);
        
        setSummary(sumRes.data.data);
        setSubSummary(subRes.data.data);
        
        // Map months from number to names for chart
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mappedData = monthRes.data.data.map(d => ({
          name: monthNames[d.month - 1],
          income: d.income,
          expense: d.expense
        }));
        
        setMonthlyData(mappedData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ marginBottom: 'var(--spacing-1)' }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Welcome to your financial overview.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-6)'
      }}>
        <StatCard 
          title="Total Balance" 
          value={summary.balance} 
          icon={<DollarSign size={20} />} 
        />
        <StatCard 
          title="Total Income" 
          value={summary.income} 
          icon={<TrendingUp size={20} />} 
        />
        <StatCard 
          title="Total Expenses" 
          value={summary.expense} 
          icon={<TrendingDown size={20} />} 
        />
        <StatCard 
          title="Monthly Subscriptions" 
          value={subSummary.monthlyTotal} 
          icon={<CreditCard size={20} />} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-6)' }}>
        <Card title="Income vs Expense" style={{ minHeight: '400px' }}>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)' }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-md)'
                  }} 
                />
                <Area type="monotone" dataKey="income" stroke="var(--color-income)" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="var(--color-expense)" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

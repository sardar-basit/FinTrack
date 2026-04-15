import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Trash2, Edit2, Plus } from 'lucide-react';

// Inline Modal for simplicity, can be moved to components later
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ type: 'expense', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/transactions');
      setTransactions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenEdit = (t) => {
    setFormData({ 
      type: t.type, category: t.category, amount: t.amount, 
      description: t.description, date: new Date(t.date).toISOString().split('T')[0] 
    });
    setEditingId(t._id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await axiosInstance.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axiosInstance.put(`/transactions/${editingId}`, formData);
        setTransactions(prev => prev.map(t => t._id === editingId ? res.data.data : t));
      } else {
        const res = await axiosInstance.post('/transactions', formData);
        setTransactions(prev => [res.data.data, ...prev]);
      }
      setModalOpen(false);
      setEditingId(null);
      setFormData({ type: 'expense', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
      alert('Failed to save transaction');
    }
  };

  if (loading) return <div>Loading transactions...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--spacing-1)' }}>Transactions</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Manage your income and expenses.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={18} /> Add Transaction</Button>
      </div>

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Category</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Description</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No transactions found.</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: t.type === 'income' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'
                      }}>
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{t.category}</td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{t.description || '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>${t.amount.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button onClick={() => handleOpenEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginRight: '1rem' }}><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(t._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} title={editingId ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <Input label="Category" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          <Input label="Amount ($)" type="number" step="0.01" min="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
          <Input label="Date" type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          <Input label="Description (Optional)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transactions;

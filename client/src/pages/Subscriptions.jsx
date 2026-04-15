import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Trash2, Edit2, Plus, Calendar } from 'lucide-react';

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

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', amount: '', billingCycle: 'monthly', 
    nextPaymentDate: new Date().toISOString().split('T')[0], category: '', status: 'active' 
  });

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/subscriptions');
      setSubscriptions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleOpenEdit = (s) => {
    setFormData({ 
      name: s.name, amount: s.amount, billingCycle: s.billingCycle, 
      category: s.category, status: s.status,
      nextPaymentDate: new Date(s.nextPaymentDate).toISOString().split('T')[0] 
    });
    setEditingId(s._id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription?')) return;
    try {
      await axiosInstance.delete(`/subscriptions/${id}`);
      setSubscriptions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axiosInstance.put(`/subscriptions/${editingId}`, formData);
        setSubscriptions(prev => prev.map(s => s._id === editingId ? res.data.data : s));
      } else {
        const res = await axiosInstance.post('/subscriptions', formData);
        setSubscriptions(prev => [res.data.data, ...prev].sort((a,b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate)));
      }
      setModalOpen(false);
      setEditingId(null);
    } catch (err) {
      alert('Failed to save subscription');
    }
  };

  if (loading) return <div>Loading subscriptions...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--spacing-1)' }}>Subscriptions</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Track your recurring payments.</p>
        </div>
        <Button onClick={() => { 
          setFormData({ name: '', amount: '', billingCycle: 'monthly', nextPaymentDate: new Date().toISOString().split('T')[0], category: '', status: 'active' });
          setEditingId(null);
          setModalOpen(true); 
        }}>
          <Plus size={18} /> Add Subscription
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
        {subscriptions.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No subscriptions found.</p>
        ) : (
          subscriptions.map(s => {
            const isSoon = new Date(s.nextPaymentDate) < new Date(new Date().setDate(new Date().getDate() + 7));
            return (
              <Card key={s._id} style={{ borderLeft: `4px solid ${isSoon ? 'var(--color-warning)' : 'var(--color-primary)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{s.name}</h3>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: s.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                    color: s.status === 'active' ? 'var(--color-success)' : 'var(--color-text-secondary)'
                  }}>
                    {s.status.toUpperCase()}
                  </span>
                </div>
                
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                  ${s.amount.toFixed(2)} <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>/ {s.billingCycle}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <Calendar size={16} color={isSoon ? 'var(--color-warning)' : 'currentColor'} />
                  <span style={{ color: isSoon ? 'var(--color-warning)' : 'inherit', fontWeight: isSoon ? 600 : 400 }}>
                    Next payment: {new Date(s.nextPaymentDate).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <Button variant="secondary" onClick={() => handleOpenEdit(s)} style={{ padding: '0.4rem 0.8rem' }}><Edit2 size={16} /></Button>
                  <Button variant="secondary" onClick={() => handleDelete(s._id)} style={{ padding: '0.4rem 0.8rem', color: 'var(--color-error)' }}><Trash2 size={16} /></Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Subscription' : 'Add Subscription'}>
        <form onSubmit={handleSubmit}>
          <Input label="Service Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Amount ($)" type="number" step="0.01" min="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Cycle</label>
              <select value={formData.billingCycle} onChange={e => setFormData({ ...formData, billingCycle: e.target.value })} style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Category" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <Input label="Next Payment Date" type="date" required value={formData.nextPaymentDate} onChange={e => setFormData({ ...formData, nextPaymentDate: e.target.value })} />
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;

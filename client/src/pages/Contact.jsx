import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Send, MapPin, Mail, Phone } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ loading: false, success: false, error: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus({ loading: true, success: false, error: null });
      await axiosInstance.post('/contact', formData);
      setStatus({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus({ loading: false, success: false, error: 'Failed to send message. Please try again later.' });
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ marginBottom: 'var(--spacing-1)' }}>Get in Touch</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>We'd love to hear from you. Please fill out this form or use our contact information.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-8)' }}>
        
        {/* Contact Info */}
        <div>
          <Card title="Contact Information" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '100%', color: 'var(--color-primary)' }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Our Location</h4>
                  <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>123 Tech Avenue, San Francisco, CA 94107</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '100%', color: 'var(--color-primary)' }}>
                  <Mail size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Email Us</h4>
                  <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>support@fintrack.app</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-muted)', borderRadius: '100%', color: 'var(--color-primary)' }}>
                  <Phone size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Call Us</h4>
                  <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Contact Form */}
        <div>
          <Card title="Send a Message">
            {status.success && (
              <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                Message sent successfully! We will get back to you soon.
              </div>
            )}
            
            {status.error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                {status.error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input 
                label="Your Name" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <Input 
                label="Email Address" 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Message</label>
                <textarea 
                  required
                  rows="5"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontFamily: 'inherit', resize: 'vertical' }}
                ></textarea>
              </div>
              
              <Button type="submit" fullWidth loading={status.loading}>
                <Send size={18} style={{ marginRight: '8px' }}/> Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;

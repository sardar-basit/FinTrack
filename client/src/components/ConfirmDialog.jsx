import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, confirmLabel = 'Confirm', danger = false, loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}
    footer={<>
      <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>{loading ? 'Processing...' : confirmLabel}</button>
    </>}>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <AlertTriangle size={24} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{message}</p>
    </div>
  </Modal>
);

export default ConfirmDialog;

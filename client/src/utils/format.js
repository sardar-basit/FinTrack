export const formatPKR = (amount) => {
  if (amount == null || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getStatusClass = (status) => {
  const map = { pending: 'badge-pending', cleared: 'badge-cleared', partial: 'badge-partial', active: 'badge-active', paused: 'badge-pending', cancelled: 'badge-inactive' };
  return map[status] || 'badge-user';
};

export const calculateSplit = (totalAmount, participantCount) => {
  if (!participantCount || participantCount === 0) return { perPerson: 0, total: 0 };
  const totalPaisa = Math.round(totalAmount * 100);
  const basePaisa = Math.floor(totalPaisa / participantCount);
  return { perPerson: basePaisa / 100, total: totalAmount };
};

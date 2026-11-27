const Badge = ({ status, label, className = '' }) => {
  const classMap = {
    pending: 'badge-pending', cleared: 'badge-cleared', partial: 'badge-partial',
    admin: 'badge-admin', user: 'badge-user', active: 'badge-active', inactive: 'badge-inactive',
    paused: 'badge-pending', cancelled: 'badge-inactive',
  };
  return <span className={`badge ${classMap[status] || 'badge-user'} ${className}`}>{label || status}</span>;
};
export default Badge;

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';
import {
  LayoutDashboard, Users, Receipt, CreditCard, BarChart3,
  Wallet, Settings, LogOut, X, ChevronRight, Banknote
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const adminNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Team Expenses', path: '/team-expenses', icon: Receipt },
    { name: 'Payments', path: '/payments', icon: Banknote },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  const userNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Expenses', path: '/my-expenses', icon: Receipt },
    { name: 'My Payments', path: '/my-payments', icon: Banknote },
  ];

  const sharedNav = [
    { name: 'Transactions', path: '/transactions', icon: Wallet },
    { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
  ];

  const nav = isAdmin ? adminNav : userNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {isOpen && <div className="sidebar-overlay show" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="#fff" />
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>FinTrack</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ color: 'white', display: 'none' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar" style={{ background: isAdmin ? '#7c3aed' : '#10b981', width: 38, height: 38, fontSize: '0.875rem' }}>{getInitials(user?.name)}</div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`} style={{ fontSize: '0.7rem' }}>{isAdmin ? 'Admin' : 'Member'}</span>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.6)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>{isAdmin ? 'Team Management' : 'My Finance'}</p>
            {nav.map(item => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <item.icon size={18} /><span style={{ flex: 1 }}>{item.name}</span><ChevronRight size={14} style={{ opacity: 0.4 }} />
              </NavLink>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.6)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>Personal</p>
            {sharedNav.map(item => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <item.icon size={18} /><span style={{ flex: 1 }}>{item.name}</span><ChevronRight size={14} style={{ opacity: 0.4 }} />
              </NavLink>
            ))}
          </div>
        </nav>
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}><Settings size={18} /><span style={{ flex: 1 }}>Profile & Settings</span></NavLink>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#f87171' }}><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

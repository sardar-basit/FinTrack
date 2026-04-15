import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--spacing-6)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
        <button 
          onClick={toggleSidebar}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-text-secondary)'
          }}
        >
          {/* Menu icon replaces the default button shape */}
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--color-primary)' }}>
          FinTrack
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-text-secondary)' }}>
          <UserIcon size={20} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.name || 'User'}</span>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default React.memo(Navbar);

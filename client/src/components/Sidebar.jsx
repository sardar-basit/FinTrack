import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard, User, Mail } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Transactions', path: '/transactions', icon: <Wallet size={20} /> },
    { name: 'Subscriptions', path: '/subscriptions', icon: <CreditCard size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Contact', path: '/contact', icon: <Mail size={20} /> },
  ];

  return (
    <aside style={{
      width: isOpen ? '250px' : '0',
      overflow: 'hidden',
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      transition: 'width 0.3s ease',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: 'var(--spacing-6) var(--spacing-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)'
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-3)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              backgroundColor: isActive ? 'var(--color-surface-muted)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap'
            })}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);

import React from 'react';

const Card = ({ children, title, action, style, noPadding = false }) => {
  return (
    <div 
      className="glass"
      style={{
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      ...style,
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    }}
    >
      {(title || action) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 1.75rem',
          borderBottom: noPadding ? 'none' : '1px solid rgba(0,0,0,0.03)',
        }}>
          {title && <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : '1.5rem', flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default Card;

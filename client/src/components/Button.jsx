import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  fullWidth = false, 
  loading = false, 
  ...props 
}) => {
  const baseStyle = {
    padding: '0.75rem 1.75rem',
    borderRadius: 'var(--radius-xl)',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    opacity: loading ? 0.7 : 1,
    pointerEvents: loading ? 'none' : 'auto',
    letterSpacing: '0.02em',
  };

  const variants = {
    primary: {
      background: 'var(--gradient-primary)',
      color: '#fff',
      boxShadow: 'var(--shadow-md)',
    },
    secondary: {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    },
    danger: {
      background: 'var(--gradient-danger)',
      color: '#fff',
      boxShadow: 'var(--shadow-md)',
    },
  };

  return (
    <button 
      type={type} 
      style={{ ...baseStyle, ...variants[variant], ...props.style }} 
      onMouseOver={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          if (variant === 'primary') e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
        }
      }}
      onMouseOut={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = variants[variant].boxShadow;
        }
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      {...props}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
};

export default Button;

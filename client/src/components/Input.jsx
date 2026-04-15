import React from 'react';

const Input = React.forwardRef(({ label, error, ...props }, ref) => {
  return (
    <div style={{ marginBottom: 'var(--spacing-4)', width: '100%' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: 'var(--spacing-1)', 
          fontSize: '0.875rem', 
          fontWeight: '500',
          color: 'var(--color-text-primary)'
        }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        style={{
          width: '100%',
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        {...props}
      />
      {error && (
        <span style={{ 
          display: 'block', 
          marginTop: 'var(--spacing-1)', 
          fontSize: '0.75rem', 
          color: 'var(--color-error)' 
        }}>
          {error}
        </span>
      )}
    </div>
  );
});

export default Input;

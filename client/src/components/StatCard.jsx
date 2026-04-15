import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, icon, trend, isCurrency = true }) => {
  const formattedValue = isCurrency && typeof value === 'number'
    ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : value;

  return (
    <Card noPadding style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ 
            fontSize: '0.875rem', 
            fontWeight: 500, 
            color: 'var(--color-text-secondary)',
            marginBottom: '0.25rem' 
          }}>
            {title}
          </p>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            color: 'var(--color-text-primary)' 
          }}>
            {formattedValue}
          </h3>
          
          {trend && (
            <p style={{ 
              fontSize: '0.75rem', 
              marginTop: '0.5rem',
              color: trend.isPositive ? 'var(--color-success)' : 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% from last month</span>
            </p>
          )}
        </div>
        
        {icon && (
          <div style={{ 
            padding: '0.5rem', 
            backgroundColor: 'var(--color-surface-muted)', 
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-primary)'
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default React.memo(StatCard);

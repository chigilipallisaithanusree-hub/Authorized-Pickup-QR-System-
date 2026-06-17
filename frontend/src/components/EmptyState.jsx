import React from 'react';
import { Shield } from 'lucide-react';

const EmptyState = ({ title, description, actionText, onAction, icon: Icon = Shield }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      backgroundColor: '#FFFFFF',
      border: '1px dashed var(--border-gray)',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#FFFCEF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <Icon size={28} color="var(--brand-primary)" />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-primary)', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--ink-secondary)', maxWidth: '320px', marginBottom: '24px', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

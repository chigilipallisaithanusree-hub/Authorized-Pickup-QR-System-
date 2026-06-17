import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const Alert = ({ message, type = 'error' }) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={20} color="var(--status-success)" />,
          bg: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid var(--status-success)'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} color="var(--status-warning)" />,
          bg: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid var(--status-warning)'
        };
      case 'error':
      default:
        return {
          icon: <AlertTriangle size={20} color="var(--status-error)" />,
          bg: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid var(--status-error)'
        };
    }
  };

  const { icon, bg, border } = getStyles();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: bg,
      border,
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {icon}
      <div style={{ fontSize: '14px', color: 'var(--ink-primary)', fontWeight: 500 }}>
        {message}
      </div>
    </div>
  );
};

export default Alert;

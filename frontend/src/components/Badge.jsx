import React from 'react';

const Badge = ({ children, status }) => {
  const getBadgeColors = () => {
    switch (status) {
      case 'APPROVED':
      case 'Active':
      case 'Used':
        return {
          bg: 'rgba(34, 197, 94, 0.1)',
          text: 'var(--status-success)'
        };
      case 'REJECTED':
      case 'Expired':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          text: 'var(--status-error)'
        };
      case 'PENDING':
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          text: 'var(--status-warning)'
        };
    }
  };

  const { bg, text } = getBadgeColors();

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: bg,
      color: text,
      textTransform: 'uppercase',
      letterSpacing: '0.02em'
    }}>
      {children}
    </span>
  );
};

export default Badge;

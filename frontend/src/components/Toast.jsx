import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={20} color="var(--status-success)" />,
          border: '1px solid var(--status-success)'
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} color="var(--status-error)" />,
          border: '1px solid var(--status-error)'
        };
      default:
        return {
          icon: <Info size={20} color="var(--brand-primary)" />,
          border: '1px solid var(--border-gray)'
        };
    }
  };

  const { icon, border } = getStyles();

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: '#FFFFFF',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: 'var(--shadow-lg)',
      border,
      zIndex: 200,
      minWidth: '300px',
      maxWidth: '400px',
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {icon}
      <div style={{ flex: 1, fontSize: '14px', color: 'var(--ink-primary)', fontWeight: 500 }}>
        {message}
      </div>
      <button 
        onClick={onClose} 
        style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}
      >
        <X size={16} />
      </button>

      {/* Auto-Dismiss progress bar indicator */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        backgroundColor: type === 'success' ? 'var(--status-success)' : type === 'error' ? 'var(--status-error)' : 'var(--brand-primary)',
        animation: 'shrink 4s linear forwards',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px'
      }} />

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;

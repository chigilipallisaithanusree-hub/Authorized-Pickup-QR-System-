import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle, XCircle, Users, ShieldAlert } from 'lucide-react';
import Toast from '../components/Toast';
import Alert from '../components/Alert';

const PickupVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  
  if (!state || !state.student || !state.guardian || !state.token) {
    return <Navigate to="/teacher/scanner" replace />;
  }

  const { student, guardian, token } = state;

  const handleDecision = async (status, reason = null) => {
    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/api/pickups/confirm', {
        studentId: student.id,
        guardianId: guardian.id,
        status,
        token,
        rejectionReason: reason
      });
      
      setToast(status === 'APPROVED' ? 'Pickup successfully approved!' : 'Pickup rejected and logged.');
      
      // Redirect to Teacher Dashboard after 2 seconds
      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 1500);
      
    } catch (err) {
      setError(err.message || 'Failed to submit decision.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '8px' }}>
        Pickup Approval Desk
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Verify that the physical details of the guardian match the authorized records below.
      </p>

      {error && <Alert message={error} type="error" />}

      {/* Renders dynamic green overlay/card block representing APPROVED verification */}
      <div className="card-elevation" style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid var(--status-success)',
        padding: '32px',
        position: 'relative'
      }}>
        {/* Verification indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--status-success)',
          marginBottom: '24px'
        }}>
          <CheckCircle size={32} />
          <span style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700 }}>
            VERIFICATION: APPROVED
          </span>
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Student details */}
          <div style={{
            backgroundColor: 'var(--bg-canvas)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--border-gray)'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Student Information
            </h4>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-primary)', marginBottom: '4px' }}>
              {student.fullName}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
              Class: <b>{student.gradeClass}</b>
            </div>
          </div>

          {/* Guardian Details */}
          <div style={{
            backgroundColor: 'var(--bg-canvas)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--border-gray)'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Guardian Details
            </h4>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-primary)', marginBottom: '4px' }}>
              {guardian.fullName}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '4px' }}>
              Relation: <b>{guardian.relationship}</b>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
              Phone: {guardian.phoneNumber}
            </div>
          </div>
        </div>

        {/* Action decision buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleDecision('APPROVED')}
            disabled={submitting}
            className="btn-primary"
            style={{
              flex: 1.5,
              height: '48px',
              backgroundColor: 'var(--status-success)',
              color: '#FFFFFF'
            }}
          >
            <CheckCircle size={18} />
            <span>Approve & Release Child</span>
          </button>
          
          <button
            onClick={() => {
              const reason = window.prompt('Specify rejection reason:');
              if (reason !== null) handleDecision('REJECTED', reason || 'Identity mismatch');
            }}
            disabled={submitting}
            className="btn-secondary"
            style={{
              flex: 1,
              height: '48px',
              color: 'var(--status-error)',
              borderColor: 'var(--status-error)'
            }}
          >
            <XCircle size={18} />
            <span>Reject Pickup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickupVerification;

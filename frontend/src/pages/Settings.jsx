import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, Lock, Bell } from 'lucide-react';
import Toast from '../components/Toast';
import Alert from '../components/Alert';

const Settings = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    setSubmitting(true);
    // Simulate updating password to backend (returns 200)
    setTimeout(() => {
      setToast('Security settings updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSubmitting(false);
    }, 1000);
  };

  return (
    <div>
      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
        System Preferences
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Manage your user account credentials and notification variables.
      </p>

      {error && <Alert message={error} type="error" />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Profile Card */}
        <div className="card-elevation" style={{ backgroundColor: '#FFFFFF', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--ink-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={18} color="var(--brand-primary)" />
            <span>Profile Details</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase' }}>
                Full Name
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-primary)', marginTop: '4px' }}>
                {user?.fullName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase' }}>
                Email Address
              </div>
              <div style={{ fontSize: '15px', color: 'var(--ink-primary)', marginTop: '4px' }}>
                {user?.email}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase' }}>
                System Access Role
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '4px' }}>
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Form */}
        <div className="card-elevation" style={{ backgroundColor: '#FFFFFF', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--ink-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--brand-primary)" />
            <span>Update Password</span>
          </h3>

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%' }}>
              {submitting ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;

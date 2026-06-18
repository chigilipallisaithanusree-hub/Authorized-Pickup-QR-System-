import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail } from 'lucide-react';
import Alert from '../components/Alert';

const Login = () => {
  const [role, setRole] = useState('Parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [view, setView] = useState('login'); // login, register, forgot_password
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, login, register, resetPassword } = useAuth();

  useEffect(() => {
    if (user) {
      const userRole = user.role.toLowerCase();
      if (userRole === 'parent') navigate('/parent/dashboard');
      else if (userRole === 'teacher') navigate('/teacher/dashboard');
      else if (userRole === 'admin') navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (view === 'login') {
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }
      setSubmitting(true);
      const result = await login(email, password, role);
      if (!result.success) {
        setError(result.error);
        setSubmitting(false);
      }
    } else if (view === 'register') {
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Please fill in all fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setSubmitting(true);
      const result = await register(email, password, fullName, role);
      if (!result.success) {
        setError(result.error);
        setSubmitting(false);
      } else {
        setSuccessMessage('Account created and activated successfully! Redirecting...');
      }
    } else if (view === 'forgot_password') {
      if (!email) {
        setError('Please enter your email address.');
        return;
      }
      setSubmitting(true);
      const result = await resetPassword(email);
      setSubmitting(false);
      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        setError(result.error);
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#FFFCEF'
    }}>
      {/* Left graphic split - Hidden on mobile */}
      <div style={{
        flex: 1.5,
        backgroundColor: '#2D5288',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        padding: '48px',
        position: 'relative'
      }} className="login-graphic">
        <Shield size={120} color="#FFFFFF" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
          FirstCry Intelliots Portal
        </h1>
        <p style={{
          fontFamily: 'Inter',
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.8)',
          textAlign: 'center',
          maxWidth: '460px',
          lineHeight: 1.6
        }}>
          Welcome to the FirstCry Intelliots Portal. Improving child safety, eliminating unauthorized releases, and establishing digital audit trails for educational institutions.
        </p>
      </div>

      {/* Right form split */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }} className="login-form-pane">
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Logo Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Shield size={36} color="var(--brand-primary)" />
            <span style={{ fontFamily: 'Outfit', fontSize: '24px', fontWeight: 700, color: 'var(--brand-primary)' }}>
              FirstCry Intelliots
            </span>
          </div>

          <div className="card-elevation" style={{ padding: '32px', backgroundColor: '#FFFFFF' }}>

            <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--ink-primary)' }}>
              {view === 'login' && 'FirstCry Intelliots Portal'}
              {view === 'register' && `Create ${role} Account`}
              {view === 'forgot_password' && 'Reset Password'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-secondary)', marginBottom: '24px' }}>
              {view === 'login' && 'Select your system role to log in.'}
              {view === 'register' && 'Enter your details below to activate your pre-authorized account.'}
              {view === 'forgot_password' && 'Enter your email address to receive a password reset link.'}
            </p>

            {error && <Alert message={error} type="error" />}
            {successMessage && <Alert message={successMessage} type="success" />}

            <form onSubmit={handleSubmit}>
              {/* Segmented Tab Controller */}
              {view === 'login' && (
                <div style={{
                  display: 'flex',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: '8px',
                  padding: '4px',
                  marginBottom: '24px',
                  border: '1px solid var(--border-gray)'
                }}>
                  {['Parent', 'Teacher', 'Admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        setError('');
                      }}
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: role === r ? '#FFFFFF' : 'transparent',
                        color: role === r ? 'var(--brand-primary)' : 'var(--ink-secondary)',
                        boxShadow: role === r ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.15s ease-in-out'
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {/* Full Name */}
              {view === 'register' && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="form-control"
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--ink-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              {view !== 'forgot_password' && (
                <div className="form-group">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--ink-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              {view === 'register' && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--ink-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {submitting ? 'Processing...' : (
                  view === 'login' ? 'Sign In' : (view === 'register' ? 'Create Account' : 'Send Reset Link')
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
              {view === 'login' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span 
                    onClick={() => { setView('forgot_password'); setError(''); setSuccessMessage(''); }}
                    style={{ color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Forgot Password?
                  </span>
                  {(role === 'Parent' || role === 'Teacher') && (
                    <span style={{ color: 'var(--ink-secondary)' }}>
                      Don't have an account?{' '}
                      <span 
                        onClick={() => { setView('register'); setError(''); setSuccessMessage(''); }}
                        style={{ color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Create Account
                      </span>
                    </span>
                  )}
                </div>
              )}
              {view === 'register' && (
                <span style={{ color: 'var(--ink-secondary)' }}>
                  Already have an account?{' '}
                  <span 
                    onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                    style={{ color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Sign In
                  </span>
                </span>
              )}
              {view === 'forgot_password' && (
                <span 
                  onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                  style={{ color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Back to Sign In
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .login-graphic {
            display: none !important;
          }
          .login-form-pane {
            flex: 1 !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;

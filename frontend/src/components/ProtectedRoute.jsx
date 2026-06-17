import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#FFFCEF'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #E2E8F0',
          borderTopColor: '#2D5288',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user.role || !allowedRoles.map(r => r.toLowerCase()).includes(user.role.toLowerCase()))) {
    // Redirect unauthorized to login or safe fallback
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFCEF' }}>
      {/* Mobile Header */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#2D5288',
        color: '#FFFFFF',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 50,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }} className="mobile-header">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span style={{ marginLeft: '16px', fontFamily: 'Outfit', fontWeight: 600, fontSize: '18px' }}>
          FirstCry Intelliots
        </span>
      </div>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <div style={{
        width: '260px',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: '#2D5288',
        zIndex: 40,
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out'
      }} className="sidebar-container">
        <Sidebar closeMobileMenu={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Pane */}
      <div style={{
        flex: 1,
        padding: '32px',
        marginLeft: '260px',
        marginTop: 0,
        minWidth: 0
      }} className="main-content-pane">
        <Outlet />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-container {
            transform: none !important;
          }
        }
        @media (max-width: 767px) {
          .mobile-header {
            display: flex !important;
          }
          .main-content-pane {
            margin-left: 0 !important;
            padding: 16px !important;
            margin-top: 60px !important;
          }
          .sidebar-container {
            width: 260px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProtectedRoute;

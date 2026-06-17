import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield,
  Home, 
  QrCode, 
  Settings, 
  LogOut, 
  Users, 
  FolderSync, 
  FileText, 
  Bell, 
  History,
  ScanLine,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ closeMobileMenu }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const getParentLinks = () => [
    { to: '/parent/dashboard', label: 'Dashboard', icon: Home },
    { to: '/parent/qr', label: 'Generate QR', icon: QrCode },
    { to: '/parent/settings', label: 'Settings', icon: Settings }
  ];

  const getTeacherLinks = () => [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: Home },
    { to: '/teacher/scanner', label: 'QR Scanner', icon: ScanLine },
    { to: '/teacher/logs', label: 'Verification Logs', icon: History },
    { to: '/teacher/settings', label: 'Settings', icon: Settings }
  ];

  const getAdminLinks = () => [
    { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/guardians', label: 'Guardians', icon: FolderSync },
    { to: '/admin/logs', label: 'Pickup Logs', icon: History },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  const getLinks = () => {
    const role = user.role ? user.role.toLowerCase() : '';
    if (role === 'parent') return getParentLinks();
    if (role === 'teacher') return getTeacherLinks();
    if (role === 'admin') return getAdminLinks();
    return [];
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      color: '#FFFFFF'
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <Shield size={28} color="#FFFFFF" />
        <span style={{
          fontFamily: 'Outfit',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.02em'
        }}>
          FirstCry Intelliots
        </span>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        {getLinks().map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMobileMenu}
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
            >
              <Icon size={20} color="#FFFFFF" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Logout Footer Profile Block */}
      <div style={{
        padding: '24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            {user.fullName}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '0.05em',
            marginTop: '2px'
          }}>
            {user.role}
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            height: '40px',
            background: 'none',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

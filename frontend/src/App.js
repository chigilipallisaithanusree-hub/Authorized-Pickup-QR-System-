import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import Login from './pages/Login';
import ParentDashboard from './pages/ParentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentManagement from './pages/StudentManagement';
import GuardianManagement from './pages/GuardianManagement';
import GenerateQR from './pages/GenerateQR';
import QRScanner from './pages/QRScanner';
import PickupVerification from './pages/PickupVerification';
import PickupLogs from './pages/PickupLogs';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Parent Protected Routes */}
          <Route path="/parent" element={<ProtectedRoute allowedRoles={['Parent']} />}>
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="qr" element={<GenerateQR />} />
            <Route path="settings" element={<Settings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Teacher Protected Routes */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['Teacher']} />}>
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="scanner" element={<QRScanner />} />
            <Route path="verification" element={<PickupVerification />} />
            <Route path="logs" element={<PickupLogs />} />
            <Route path="settings" element={<Settings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="guardians" element={<GuardianManagement />} />
            <Route path="logs" element={<PickupLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

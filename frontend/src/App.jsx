import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import CheckinPage from './pages/CheckinPage';
import RegisterPasskey from './pages/RegisterPasskey';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import AttendanceHistory from './pages/admin/AttendanceHistory';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/register-passkey" element={<RegisterPasskey />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin/employees"
            element={<ProtectedRoute><EmployeeManagement /></ProtectedRoute>}
          />
          <Route
            path="/admin/attendance"
            element={<ProtectedRoute><AttendanceHistory /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import {
  PatientDashboard,
  CityAdminDashboard,
  StateAdminDashboard,
  SuperAdminDashboard,
} from "./pages/Dashboards";

function RootRedirect() {
  const { user, loading, homeRouteForRole } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeRouteForRole(user.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Forced password change (patients, first login) */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Role-based dashboards */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/city/dashboard"
            element={
              <ProtectedRoute allowedRoles={["CITY_ADMIN"]}>
                <CityAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/state/dashboard"
            element={
              <ProtectedRoute allowedRoles={["STATE_ADMIN"]}>
                <StateAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/super/dashboard"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root + fallback */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

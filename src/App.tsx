import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SuperAdminAuthProvider } from "./context/SuperAdminAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SuperAdminProtectedRoute } from "./components/SuperAdminProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { SuperAdminLayout } from "./components/layout/SuperAdminLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardHome from "./pages/DashboardHome";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ChangeInformationPage from "./pages/ChangeInformationPage";
import StudentsUploadPage from "./pages/StudentsUploadPage";
import RosterPage from "./pages/RosterPage";
import VerifyCertificatePage from "./pages/VerifyCertificatePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminInstitutionsPage from "./pages/AdminInstitutionsPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminStudentsUploadPage from "./pages/AdminStudentsUploadPage";
import AdminStudentStatsPage from "./pages/AdminStudentStatsPage";
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import SuperAdminRegisterPage from "./pages/SuperAdminRegisterPage";
import SuperAdminVerifyOtpPage from "./pages/SuperAdminVerifyOtpPage";
import SuperAdminForgotPasswordPage from "./pages/SuperAdminForgotPasswordPage";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboardPage";
import SuperAdminInstitutionsPage from "./pages/SuperAdminInstitutionsPage";
import SuperAdminAdminsPage from "./pages/SuperAdminAdminsPage";
import SuperAdminStudentsPage from "./pages/SuperAdminStudentsPage";
import SuperAdminStudentsUploadPage from "./pages/SuperAdminStudentsUploadPage";
import SuperAdminStudentStatsPage from "./pages/SuperAdminStudentStatsPage";
import SuperAdminProfilePage from "./pages/SuperAdminProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function AppRoutes() {
  return (
    <Routes>
      {/* Public: default route is the certificate verification lookup */}
      <Route path="/" element={<VerifyCertificatePage />} />

      {/* Institution auth (mandatory, wired to existing endpoints) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Admin: same institution/student capabilities as super admin, minus admin management */}
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/institutions"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminInstitutionsPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminStudentsPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/students/upload"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminStudentsUploadPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/students/stats"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminStudentStatsPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      {/* Super admin */}
      <Route path="/superadmin-login" element={<SuperAdminLoginPage />} />
      <Route path="/superadmin-register" element={<SuperAdminRegisterPage />} />
      <Route path="/superadmin-verify-otp" element={<SuperAdminVerifyOtpPage />} />
      <Route path="/superadmin-forgot-password" element={<SuperAdminForgotPasswordPage />} />
      <Route
        path="/superadmin/dashboard"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminLayout>
              <SuperAdminDashboardPage />
            </SuperAdminLayout>
          </SuperAdminProtectedRoute>
        }
      />
      <Route
        path="/superadmin/profile"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminLayout>
              <SuperAdminProfilePage />
            </SuperAdminLayout>
          </SuperAdminProtectedRoute>
        }
      />
      <Route
        path="/superadmin/institutions"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminLayout>
              <SuperAdminInstitutionsPage />
            </SuperAdminLayout>
          </SuperAdminProtectedRoute>
        }
      />
      <Route
        path="/superadmin/admins"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminLayout>
              <SuperAdminAdminsPage />
            </SuperAdminLayout>
          </SuperAdminProtectedRoute>
        }
      />
      <Route
        path="/superadmin/students"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminLayout>
              <SuperAdminStudentsPage />
            </SuperAdminLayout>
          </SuperAdminProtectedRoute>
        }
      />
      <Route
        path="/superadmin/students/upload"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminLayout>
              <SuperAdminStudentsUploadPage />
            </SuperAdminLayout>
          </SuperAdminProtectedRoute>
        }
      />
      <Route
        path="/superadmin/students/stats"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminLayout>
              <SuperAdminStudentStatsPage />
            </SuperAdminLayout>
          </SuperAdminProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/change-password"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ChangePasswordPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/change-information"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ChangeInformationPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/previous-data"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RosterPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/add-students"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <StudentsUploadPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SuperAdminAuthProvider>
        <AdminAuthProvider>
          <AppRoutes />
        </AdminAuthProvider>
      </SuperAdminAuthProvider>
    </AuthProvider>
  );
}

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAdminAuth();

  if (!token) return <Navigate to="/admin-login" replace />;

  return <>{children}</>;
}

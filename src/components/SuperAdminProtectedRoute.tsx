import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSuperAdminAuth } from "../context/SuperAdminAuthContext";

export function SuperAdminProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useSuperAdminAuth();

  if (!token) return <Navigate to="/superadmin-login" replace />;

  return <>{children}</>;
}

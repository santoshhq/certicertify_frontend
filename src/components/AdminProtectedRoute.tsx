import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { PageSpinner } from "./ui/Spinner";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { token, permissionsLoading } = useAdminAuth();

  if (!token) return <Navigate to="/admin-login" replace />;
  if (permissionsLoading) return <PageSpinner />;

  return <>{children}</>;
}

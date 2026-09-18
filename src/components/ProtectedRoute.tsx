import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageSpinner } from "./ui/Spinner";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

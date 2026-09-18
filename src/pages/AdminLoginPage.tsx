import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Field } from "../components/ui/Field";
import { PasswordField } from "../components/ui/PasswordField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { useAdminAuth } from "../context/AdminAuthContext";
import { loginAdmin } from "../lib/admin";
import { extractErrorMessage } from "../lib/api";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [adminLoginId, setAdminLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const authResponse = await loginAdmin(adminLoginId, password);
      const decodedToken = jwtDecode<{ admin_name?: string; name?: string }>(authResponse.access_token);
      const resolvedAdminName =
        authResponse.admin_name ??
        decodedToken.admin_name ??
        decodedToken.name ??
        adminLoginId;

      login(authResponse.access_token, adminLoginId, resolvedAdminName);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't sign in. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Admin sign in"
      subtitle="Restricted to CertiCertify administrators."
      footer={
        <p>
          Not an admin?{" "}
          <Link to="/login" className="font-medium text-pine-800 hover:underline">
            Institution login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="mb-1 flex items-center gap-2 text-pine-800">
          <ShieldCheck size={18} />
          <span className="text-sm font-semibold">Admin portal</span>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <Field
          label="Admin login ID"
          name="admin_loginId"
          autoComplete="username"
          required
          value={adminLoginId}
          onChange={(e) => setAdminLoginId(e.target.value)}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

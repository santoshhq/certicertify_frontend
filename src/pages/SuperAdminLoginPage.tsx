import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Field } from "../components/ui/Field";
import { PasswordField } from "../components/ui/PasswordField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { useSuperAdminAuth } from "../context/SuperAdminAuthContext";
import { loginSuperAdmin } from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";

export default function SuperAdminLoginPage() {
  const { login } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const resetSuccess = (location.state as { resetSuccess?: boolean })?.resetSuccess;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setSubmitting(true);
    try {
      const { access_token } = await loginSuperAdmin(email, password);
      login(access_token, email);
      navigate("/superadmin/dashboard", { replace: true });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setNeedsVerification(true);
      }
      setError(extractErrorMessage(err, "Couldn't sign in. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Super admin sign in"
      subtitle="This portal is not linked anywhere in the app. Restricted access only."
      footer={
        <>
          <p>
            <Link to="/superadmin-forgot-password" className="font-medium text-pine-800 hover:underline">
              Forgot password?
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="mb-1 flex items-center gap-2 text-rose-600">
          <ShieldAlert size={18} />
          <span className="text-sm font-semibold">Super admin portal</span>
        </div>
        {resetSuccess && !error && (
          <Alert tone="success">Password reset. Sign in with your new password.</Alert>
        )}
        {error && (
          <Alert tone="error">
            {error}
            {needsVerification && (
              <>
                {" "}
                <Link
                  to="/superadmin-verify-otp"
                  state={{ email }}
                  className="font-medium underline"
                >
                  Verify your email
                </Link>
              </>
            )}
          </Alert>
        )}
        <Field
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

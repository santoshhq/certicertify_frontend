import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";
import { loginInstitution } from "../lib/institutions";
import { extractErrorMessage } from "../lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const { access_token } = await loginInstitution(email, password);
      await login(access_token);
      const redirectTo = (location.state as { from?: string })?.from || "/dashboard";
      navigate(redirectTo, { replace: true });
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
      title="Sign in to your registry"
      subtitle="Enter the credentials your institution registered with."
      footer={
        <>
          <p>
            New to CertiCertify?{" "}
            <Link to="/register" className="font-medium text-pine-800 hover:underline">
              Register your institution
            </Link>
          </p>
          <p className="mt-2">
            Verifying a certificate?{" "}
            <Link to="/" className="font-medium text-pine-800 hover:underline">
              Look it up
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  to="/verify-otp"
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
        <Field
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-ink-400 hover:text-pine-800"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-pine-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

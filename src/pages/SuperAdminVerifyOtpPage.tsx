import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { verifySuperAdminOtp } from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";

export default function SuperAdminVerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = (location.state as { email?: string })?.email ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifySuperAdminOtp(email, otp);
      setSuccess(true);
      setTimeout(() => navigate("/superadmin-login", { replace: true }), 1200);
    } catch (err) {
      setError(extractErrorMessage(err, "Verification failed. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we emailed to you. It expires after five minutes."
      footer={
        <>
          Already verified?{" "}
          <Link to="/superadmin-login" className="font-medium text-pine-800 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        {success && (
          <Alert tone="success">Email verified. Taking you to sign in&hellip;</Alert>
        )}
        <Field
          label="Email address"
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="One-time code"
          name="otp"
          inputMode="numeric"
          maxLength={6}
          pattern="\d{6}"
          placeholder="000000"
          className="font-mono tracking-[0.3em]"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Verify email
        </Button>
      </form>
    </AuthLayout>
  );
}

import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Field } from "../components/ui/Field";
import { PasswordField } from "../components/ui/PasswordField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { requestPasswordReset, confirmPasswordReset } from "../lib/institutions";
import { extractErrorMessage } from "../lib/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setInfo("We've emailed a reset code. It expires in 5 minutes.");
      setStep("confirm");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't send reset code."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(email, otp, newPassword);
      navigate("/login", {
        replace: true,
        state: { resetSuccess: true },
      });
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't reset password."));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "request") {
    return (
      <AuthLayout
        title="Reset your password"
        subtitle="Tell us your institution's registered email and we'll send a reset code."
        footer={
          <Link to="/login" className="font-medium text-pine-800 hover:underline">
            Back to sign in
          </Link>
        }
      >
        <form onSubmit={handleRequest} className="flex flex-col gap-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Field
            label="Email address"
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={submitting} className="mt-2 w-full">
            Send reset code
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Enter your reset code"
      subtitle={`We sent a 6-digit code to ${email}.`}
      footer={
        <button
          onClick={() => setStep("request")}
          className="font-medium text-pine-800 hover:underline"
        >
          Use a different email
        </button>
      }
    >
      <form onSubmit={handleConfirm} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        {info && <Alert tone="success">{info}</Alert>}
        <Field
          label="Reset code"
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
        <PasswordField
          label="New password"
          name="new_password"
          hint="Minimum 8 characters"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <PasswordField
          label="Confirm new password"
          name="confirm_new_password"
          required
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}

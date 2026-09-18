import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Field } from "../components/ui/Field";
import { PasswordField } from "../components/ui/PasswordField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { registerSuperAdmin } from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";
import type { SuperAdminRegisterPayload } from "../types";

const emptyForm: SuperAdminRegisterPayload = {
  fullname: "",
  email: "",
  mobilenumber: "",
  password: "",
};

export default function SuperAdminRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SuperAdminRegisterPayload>(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof SuperAdminRegisterPayload>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await registerSuperAdmin(form);
      navigate("/superadmin-verify-otp", { state: { email: form.email }, replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Registration failed. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Register a super admin"
      subtitle="We'll send a one-time code to verify your email before you can sign in."
      footer={
        <>
          Already registered?{" "}
          <Link to="/superadmin-login" className="font-medium text-pine-800 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="mb-1 flex items-center gap-2 text-rose-600">
          <ShieldAlert size={18} />
          <span className="text-sm font-semibold">Super admin portal</span>
        </div>
        {error && <Alert tone="error">{error}</Alert>}

        <Field
          label="Full name"
          name="fullname"
          required
          value={form.fullname}
          onChange={(e) => update("fullname", e.target.value)}
        />
        <Field
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <Field
          label="Mobile number"
          name="mobilenumber"
          required
          value={form.mobilenumber}
          onChange={(e) => update("mobilenumber", e.target.value)}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          hint="Minimum 8 characters"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />
        <PasswordField
          label="Confirm password"
          name="confirm_password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Create super admin account
        </Button>
      </form>
    </AuthLayout>
  );
}

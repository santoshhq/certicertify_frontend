import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Field } from "../components/ui/Field";
import { PhoneField } from "../components/ui/PhoneField";
import { PasswordField } from "../components/ui/PasswordField";
import { SelectField } from "../components/ui/SelectField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { registerInstitution } from "../lib/institutions";
import { extractErrorMessage } from "../lib/api";
import { COUNTRIES, dialCodeFor, statesFor } from "../lib/locations";
import type { RegisterPayload } from "../types";

const emptyForm: RegisterPayload = {
  name: "",
  email_id: "",
  institution_name: "",
  postal_code: "",
  city: "",
  state: "",
  country: "",
  mobile_no: "",
  password: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterPayload>(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof RegisterPayload>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Changing the country invalidates any previously picked state.
  function updateCountry(country: string) {
    setForm((f) => ({ ...f, country, state: "" }));
  }

  const states = statesFor(form.country);

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
    if (form.mobile_no && form.mobile_no.length !== 10) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    setSubmitting(true);
    try {
      await registerInstitution({
        ...form,
        postal_code: form.postal_code || null,
        state: form.state || null,
        mobile_no: form.mobile_no ? `${dialCodeFor(form.country)}${form.mobile_no}` : null,
      });
      navigate("/verify-otp", { state: { email: form.email_id }, replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Registration failed. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Register your institution"
      subtitle="We'll send a one-time code to verify your email before you can sign in."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-pine-800 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <Field
          label="Institution name"
          name="institution_name"
          required
          value={form.institution_name}
          onChange={(e) => update("institution_name", e.target.value)}
        />
        <Field
          label="Your name"
          name="name"
          hint="The person registering this account"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <Field
          label="Email address"
          type="email"
          name="email_id"
          autoComplete="email"
          required
          value={form.email_id}
          onChange={(e) => update("email_id", e.target.value)}
        />
        <PhoneField
          label="Mobile number"
          name="mobile_no"
          country={form.country}
          value={form.mobile_no ?? ""}
          onChange={(value) => update("mobile_no", value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Country"
            name="country"
            required
            placeholder="Select country"
            options={COUNTRIES}
            value={form.country}
            onChange={(e) => updateCountry(e.target.value)}
          />
          <SelectField
            label="State"
            name="state"
            placeholder={form.country ? "Select state" : "Select country first"}
            options={states}
            disabled={!form.country}
            value={form.state ?? ""}
            onChange={(e) => update("state", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="City"
            name="city"
            required
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
          <Field
            label="Postal code"
            name="postal_code"
            value={form.postal_code ?? ""}
            onChange={(e) => update("postal_code", e.target.value)}
          />
        </div>
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
          Create institution account
        </Button>
      </form>
    </AuthLayout>
  );
}

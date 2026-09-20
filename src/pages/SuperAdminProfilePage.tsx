import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Check, Copy, Eye, EyeOff, Pencil, RefreshCw } from "lucide-react";
import { useSuperAdminAuth } from "../context/SuperAdminAuthContext";
import {
  confirmSuperAdminPasswordReset,
  requestSuperAdminPasswordReset,
  updateSuperAdminProfile,
} from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Field } from "../components/ui/Field";
import { PhoneField } from "../components/ui/PhoneField";
import { PasswordField } from "../components/ui/PasswordField";
import { PageSpinner } from "../components/ui/Spinner";

const PASSWORD_REVEAL_SECONDS = 30;

function localMobileNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
}

export default function SuperAdminProfilePage() {
  const { profile, profileLoading, refreshProfile } = useSuperAdminAuth();

  // Details editing
  const [editing, setEditing] = useState(false);
  const [fullname, setFullname] = useState("");
  const [mobile, setMobile] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Password reveal
  const [showPassword, setShowPassword] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PASSWORD_REVEAL_SECONDS);

  function togglePassword() {
    setSecondsLeft(PASSWORD_REVEAL_SECONDS);
    setShowPassword((v) => !v);
  }

  useEffect(() => {
    if (!showPassword) return;
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setShowPassword(false);
          return PASSWORD_REVEAL_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [showPassword]);

  function startEdit() {
    if (!profile) return;
    setFullname(profile.fullname);
    setMobile(localMobileNumber(profile.mobilenumber ?? ""));
    setSaveError(null);
    setSaveSuccess(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const payload: { fullname?: string; mobilenumber?: string } = {};
    const nextName = fullname.trim();
    if (nextName && nextName !== profile.fullname) payload.fullname = nextName;
    const currentMobile = localMobileNumber(profile.mobilenumber ?? "");
    if (mobile !== currentMobile) {
      if (mobile.length !== 10) {
        setSaveError("Mobile number must contain exactly 10 digits.");
        return;
      }
      payload.mobilenumber = mobile;
    }
    if (Object.keys(payload).length === 0) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await updateSuperAdminProfile(payload);
      await refreshProfile();
      setEditing(false);
      setSaveSuccess("Details saved.");
    } catch (err) {
      setSaveError(extractErrorMessage(err, "Couldn't save your details."));
    } finally {
      setSaving(false);
    }
  }

  if (profileLoading && !profile) return <PageSpinner />;

  if (!profile) {
    return (
      <div className="max-w-2xl">
        <Alert tone="error">
          Couldn't load your account details. Check your connection and try again.
        </Alert>
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={refreshProfile} loading={profileLoading}>
            <RefreshCw size={15} /> Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <header className="border-b border-line pb-6">
        <p className="text-sm text-ink-400">Profile</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="font-display text-4xl font-bold leading-tight text-pine-950">
            {profile.fullname}
          </h1>
          <span className="rounded-md border border-rose-600/40 bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
            Super admin
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-700">
          Signed in as <span className="font-medium text-ink-900">{profile.email}</span>
        </p>
      </header>

      <Section
        title="Details"
        description="Your name and the mobile number on this account. Email is your sign-in identity and can't be changed here."
        action={
          !editing && (
            <Button type="button" variant="ghost" onClick={startEdit}>
              <Pencil size={14} /> Edit
            </Button>
          )
        }
      >
        {saveSuccess && !editing && (
          <div className="border-b border-line px-4 py-3">
            <Alert tone="success">{saveSuccess}</Alert>
          </div>
        )}
        {editing ? (
          <form onSubmit={saveDetails} className="flex flex-col gap-4 px-4 py-4">
            {saveError && <Alert tone="error">{saveError}</Alert>}
            <Field
              label="Full name"
              name="fullname"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              autoFocus
            />
            <PhoneField
              label="Mobile number"
              name="mobilenumber"
              country="India"
              value={mobile}
              onChange={setMobile}
            />
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <Row label="Full name">{profile.fullname}</Row>
            <Row label="Mobile">{profile.mobilenumber || "Not provided"}</Row>
            <Row label="Email">
              <span className="flex items-center gap-2">
                <span className="break-all">{profile.email}</span>
                <CopyButton value={profile.email} label="Copy email" />
              </span>
            </Row>
            <Row label="Unique ID">
              <span className="flex items-center gap-2">
                <code className="rounded bg-mint-50 px-1.5 py-0.5 font-mono text-xs text-pine-900">
                  {profile.unique_id}
                </code>
                <CopyButton value={profile.unique_id} label="Copy unique ID" />
              </span>
            </Row>
          </>
        )}
      </Section>

      <Section
        title="Password"
        description="Your current password is hidden by default. Changing it requires a one-time code sent to your email."
      >
        <Row label="Current password">
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm tracking-widest text-ink-900">
              {profile.password
                ? showPassword
                  ? profile.password
                  : "•".repeat(Math.min(profile.password.length, 14))
                : "Not available"}
            </span>
            {profile.password && (
              <button
                type="button"
                onClick={togglePassword}
                aria-pressed={showPassword}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-pine-600 hover:text-pine-900 focus:outline-none focus:ring-2 focus:ring-pine-600/30"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPassword ? `Hide (${secondsLeft}s)` : "Show"}
              </button>
            )}
          </span>
        </Row>
        <div className="px-4 py-4">
          <ChangePasswordFlow email={profile.email} onChanged={refreshProfile} />
        </div>
      </Section>

    </div>
  );
}

type PasswordStep = "idle" | "sending" | "verify" | "done";

function ChangePasswordFlow({ email, onChanged }: { email: string; onChanged: () => Promise<void> }) {
  const [step, setStep] = useState<PasswordStep>("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setStep("sending");
    try {
      await requestSuperAdminPasswordReset(email);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("verify");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't send the code. Try again."));
      setStep("idle");
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmSuperAdminPasswordReset(email, otp, newPassword);
      await onChanged();
      setStep("done");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't update the password."));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <div className="flex flex-col gap-3">
        <Alert tone="success">Password updated. Use the new password next time you sign in.</Alert>
        <div>
          <Button type="button" variant="ghost" onClick={() => setStep("idle")}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={confirm} className="flex flex-col gap-4">
        <Alert tone="success">
          A 6-digit code was sent to <span className="font-medium">{email}</span>. It expires in
          5 minutes.
        </Alert>
        {error && <Alert tone="error">{error}</Alert>}
        <Field
          label="One-time code"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="font-mono tracking-[0.3em]"
          autoFocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            label="New password"
            name="new_password"
            autoComplete="new-password"
            hint="Minimum 8 characters"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordField
            label="Confirm new password"
            name="confirm_password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" loading={submitting}>
            Update password
          </Button>
          <Button type="button" variant="ghost" onClick={sendCode} disabled={submitting}>
            Resend code
          </Button>
          <Button type="button" variant="ghost" onClick={() => setStep("idle")} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-700">
          We'll email a code to <span className="font-medium text-ink-900">{email}</span>. Enter
          it with your new password to finish.
        </p>
        <Button type="button" variant="secondary" onClick={sendCode} loading={step === "sending"}>
          Change password
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-b border-line py-8 last:border-0 md:grid-cols-[13rem_1fr] md:gap-8">
      <div>
        <div className="flex items-start justify-between gap-2 md:block">
          <h2 className="text-base font-semibold text-pine-950">{title}</h2>
          {action && <div className="md:mt-3">{action}</div>}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-400">{description}</p>
      </div>
      <div className="rounded-lg border border-line bg-white">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line px-4 py-3 last:border-0 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-4">
      <div className="text-sm text-ink-400">{label}</div>
      <div className="min-w-0 text-sm text-ink-900">{children}</div>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context) — nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className="rounded p-1 text-ink-400 transition-colors hover:text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-600/30"
    >
      {copied ? <Check size={14} className="text-pine-700" /> : <Copy size={14} />}
    </button>
  );
}

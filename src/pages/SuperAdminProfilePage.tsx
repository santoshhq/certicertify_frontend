import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import clsx from "clsx";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  MailCheck,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
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

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SA";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
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

  const passwordMask = profile.password
    ? "•".repeat(Math.min(profile.password.length, 14))
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-wider text-rose-600">Account</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">Profile</h1>
      <p className="mt-1 text-sm text-ink-400">
        Your identity on CertiCertify and the credentials that protect it.
      </p>

      {/* Identity card */}
      <section className="relative mt-6 overflow-hidden rounded-2xl bg-pine-950 text-white shadow-[0_24px_48px_-28px_rgba(4,51,46,0.7)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-40 h-[360px] w-[360px] rounded-full border-[14px] border-pine-900/70">
            <div className="absolute inset-[44px] rounded-full border-[10px] border-pine-500/10" />
          </div>
        </div>

        <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center">
          <div className="relative shrink-0 self-start md:self-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pine-600 to-pine-500 font-display text-2xl font-bold text-white shadow-[0_0_0_4px_rgba(255,255,255,0.08)] sm:h-24 sm:w-24 sm:text-3xl">
              {initialsOf(profile.fullname)}
            </span>
            <span
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-pine-950 bg-rose-600 text-white"
              title="Super admin"
            >
              <ShieldCheck size={15} strokeWidth={2.5} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="truncate font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                {profile.fullname}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-200">
                <ShieldCheck size={12} /> Super admin
              </span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-sage-300">
              <Mail size={14} className="shrink-0" />
              <span className="truncate">{profile.email}</span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-3 pr-1.5 text-xs">
                <Fingerprint size={13} className="text-sage-300" />
                <span className="text-sage-300">ID</span>
                <code className="font-mono text-[13px] text-white">{profile.unique_id}</code>
                <CopyButton value={profile.unique_id} label="Copy unique ID" dark />
              </span>
              {profile.mobilenumber && (
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white">
                  <Phone size={13} className="text-sage-300" />
                  {profile.mobilenumber}
                </span>
              )}
            </div>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine-500 md:self-center"
            >
              <Pencil size={14} /> Edit details
            </button>
          )}
        </div>
      </section>

      {saveSuccess && !editing && (
        <div className="mt-4">
          <Alert tone="success">{saveSuccess}</Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Account details */}
        <Card
          icon={UserRound}
          title="Account details"
          description="Your name and mobile number. Email is your sign-in identity and can't be changed here."
          action={
            editing ? (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                aria-label="Cancel editing"
                className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-mint-50 hover:text-pine-900 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            ) : (
              <Button type="button" variant="ghost" onClick={startEdit} className="-my-1">
                <Pencil size={14} /> Edit
              </Button>
            )
          }
        >
          {editing ? (
            <form onSubmit={saveDetails} className="flex flex-col gap-4 p-5">
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
              <Field
                label="Email address"
                name="email"
                value={profile.email}
                readOnly
                disabled
                className="disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-400"
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
            <dl>
              <InfoRow icon={UserRound} label="Full name">
                {profile.fullname}
              </InfoRow>
              <InfoRow icon={Phone} label="Mobile">
                {profile.mobilenumber || <span className="text-ink-400">Not provided</span>}
              </InfoRow>
              <InfoRow icon={Mail} label="Email">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{profile.email}</span>
                  <CopyButton value={profile.email} label="Copy email" />
                </span>
              </InfoRow>
              <InfoRow icon={Fingerprint} label="Unique ID">
                <span className="flex items-center gap-2">
                  <code className="rounded-md bg-mint-50 px-2 py-0.5 font-mono text-xs text-pine-900 ring-1 ring-line">
                    {profile.unique_id}
                  </code>
                  <CopyButton value={profile.unique_id} label="Copy unique ID" />
                </span>
              </InfoRow>
            </dl>
          )}
        </Card>

        {/* Security */}
        <Card
          icon={Lock}
          title="Security"
          description="Your password is hidden by default. Changing it requires a one-time code sent to your email."
        >
          <div className="border-b border-line p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink-900">Current password</p>
              {profile.password && (
                <button
                  type="button"
                  onClick={togglePassword}
                  aria-pressed={showPassword}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-pine-600 hover:text-pine-900 focus:outline-none focus:ring-2 focus:ring-pine-600/30"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showPassword ? `Hide · ${secondsLeft}s` : "Reveal"}
                </button>
              )}
            </div>
            <div
              className={clsx(
                "mt-3 flex items-center gap-3 rounded-lg border px-3.5 py-2.5 font-mono text-sm transition-colors",
                showPassword
                  ? "border-pine-600/40 bg-mint-50 text-pine-950"
                  : "border-line bg-paper text-ink-700"
              )}
            >
              <KeyRound size={15} className="shrink-0 text-ink-400" />
              <span className={clsx("truncate", !showPassword && "tracking-[0.3em]")}>
                {passwordMask
                  ? showPassword
                    ? profile.password
                    : passwordMask
                  : "Not available"}
              </span>
            </div>
            {showPassword && (
              <>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-mint-100" aria-hidden>
                  <div
                    className="h-full rounded-full bg-pine-600 transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(secondsLeft / PASSWORD_REVEAL_SECONDS) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-400">Hides automatically in {secondsLeft}s.</p>
              </>
            )}
          </div>
          <div className="p-5">
            <ChangePasswordFlow email={profile.email} onChanged={refreshProfile} />
          </div>
        </Card>
      </div>
    </div>
  );
}

type PasswordStep = "idle" | "sending" | "verify" | "done";

function StepDots({ step }: { step: PasswordStep }) {
  const index = step === "idle" || step === "sending" ? 0 : step === "verify" ? 1 : 2;
  const labels = ["Request code", "Verify & set", "Done"];
  return (
    <ol className="flex items-center gap-2 text-[11px] font-medium">
      {labels.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={clsx(
              "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
              i < index && "bg-pine-600 text-white",
              i === index && "bg-pine-950 text-white",
              i > index && "bg-mint-100 text-ink-400"
            )}
          >
            {i < index ? <Check size={11} strokeWidth={3} /> : i + 1}
          </span>
          <span
            className={clsx(
              "whitespace-nowrap",
              i === index ? "text-pine-950" : "hidden text-ink-400 sm:inline"
            )}
          >
            {label}
          </span>
          {i < labels.length - 1 && <span className="h-px w-3 bg-line sm:w-5" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-900">Change password</p>
        <StepDots step={step} />
      </div>

      {step === "done" && (
        <>
          <Alert tone="success">Password updated. Use the new password next time you sign in.</Alert>
          <div>
            <Button type="button" variant="ghost" onClick={() => setStep("idle")}>
              Done
            </Button>
          </div>
        </>
      )}

      {step === "verify" && (
        <form onSubmit={confirm} className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-pine-600/30 bg-mint-50 px-4 py-3 text-sm text-ink-700">
            <MailCheck size={18} className="mt-0.5 shrink-0 text-pine-700" />
            <p>
              A 6-digit code was sent to <span className="font-medium text-ink-900">{email}</span>.
              It expires in 5 minutes.
            </p>
          </div>
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
      )}

      {(step === "idle" || step === "sending") && (
        <>
          {error && <Alert tone="error">{error}</Alert>}
          <p className="text-sm text-ink-700">
            We'll email a code to <span className="font-medium text-ink-900">{email}</span>. Enter
            it with your new password to finish.
          </p>
          <div>
            <Button type="button" variant="secondary" onClick={sendCode} loading={step === "sending"}>
              <KeyRound size={15} /> Send code &amp; change password
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

type IconType = typeof UserRound;

function Card({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: IconType;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,34,29,0.04)]">
      <header className="flex items-start gap-3 border-b border-line bg-paper px-5 py-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint-100 text-pine-800">
          <Icon size={17} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-pine-950">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: IconType;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-line px-5 py-3.5 last:border-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-ink-400 ring-1 ring-line">
        <Icon size={14} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-400">{label}</dt>
        <dd className="mt-0.5 min-w-0 text-sm font-medium text-ink-900">{children}</dd>
      </div>
    </div>
  );
}

function CopyButton({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
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
      className={clsx(
        "rounded p-1 transition-colors focus:outline-none focus:ring-2",
        dark
          ? "text-sage-300 hover:bg-white/10 hover:text-white focus:ring-white/30"
          : "text-ink-400 hover:text-pine-800 focus:ring-pine-600/30"
      )}
    >
      {copied ? (
        <Check size={14} className={dark ? "text-pine-500" : "text-pine-700"} />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
}

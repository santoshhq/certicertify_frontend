import { useState } from "react";
import type { FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { PasswordField } from "../components/ui/PasswordField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { PageSpinner } from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";
import { updateInstitution } from "../lib/institutions";
import { extractErrorMessage } from "../lib/api";

export default function ChangePasswordPage() {
  const { institution, institutionId } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!institution) return <PageSpinner />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!institutionId) return;
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      await updateInstitution(institutionId, { password: newPassword });
      setSuccess("Password updated.");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't update password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="font-mono text-xs uppercase tracking-wider text-pine-600">
        Account security
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Change Password
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Update the password used to sign in to your institution account.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4 rounded-xl border border-line bg-white p-6"
      >
        <div className="mb-1 flex items-center gap-2 text-pine-800">
          <KeyRound size={18} />
          <span className="text-sm font-semibold">New password</span>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}
        <PasswordField
          label="New password"
          name="new_password"
          hint="Minimum 8 characters"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <PasswordField
          label="Confirm new password"
          name="confirm_new_password"
          autoComplete="new-password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!newPassword}>
            Update password
          </Button>
        </div>
      </form>
    </div>
  );
}

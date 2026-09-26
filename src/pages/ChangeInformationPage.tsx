import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { VerifiedBadge } from "../components/ui/Badge";
import { PageSpinner } from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";
import { updateInstitution, deleteInstitution } from "../lib/institutions";
import { extractErrorMessage } from "../lib/api";
import type { RegisterPayload } from "../types";

type EditableFields = Omit<RegisterPayload, "password">;

export default function ChangeInformationPage() {
  const { institution, institutionId, logout, refreshInstitution } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<EditableFields | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (institution) {
      setForm({
        name: institution.name,
        email_id: institution.email_id,
        institution_name: institution.institution_name,
        institutional_code: institution.institutional_code ?? "",
        gst_number: institution.gst_number ?? "",
        postal_code: institution.postal_code ?? "",
        city: institution.city,
        state: institution.state ?? "",
        country: institution.country,
        mobile_no: institution.mobile_no ?? "",
      });
    }
  }, [institution]);

  if (!institution || !form) return <PageSpinner />;

  function update<K extends keyof EditableFields>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!institutionId || !form) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await updateInstitution(institutionId, {
        name: form.name,
        city: form.city,
        country: form.country,
        postal_code: form.postal_code || null,
        state: form.state || null,
      });
      await refreshInstitution();
      setSuccess("Institution information updated.");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't save changes."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!institutionId) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteInstitution(institutionId);
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(extractErrorMessage(err, "Couldn't delete institution."));
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-pine-600">
            Institution profile
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
            Profile
          </h1>
        </div>
        <VerifiedBadge verified={institution.otp_verified} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4 rounded-xl border border-line bg-white p-6"
      >
        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <div className="flex flex-col gap-4 rounded-lg border border-line bg-mint-50/60 p-4">
          <p className="flex items-center gap-2 text-xs text-ink-700">
            <Lock size={13} className="shrink-0 text-pine-700" />
            These details are locked. To change them, contact your Super Admin or Admin.
          </p>
          <Field
            label="Institution name"
            name="institution_name"
            value={form.institution_name}
            locked
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Institutional code"
              name="institutional_code"
              value={form.institutional_code}
              locked
            />
            <Field
              label="GST number"
              name="gst_number"
              value={form.gst_number}
              locked
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Email address"
              type="email"
              name="email_id"
              value={form.email_id}
              locked
            />
            <Field
              label="Mobile number"
              name="mobile_no"
              value={form.mobile_no ?? ""}
              locked
            />
          </div>
        </div>

        <Field
          label="Contact name"
          name="name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="City"
            name="city"
            required
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
          <Field
            label="State"
            name="state"
            value={form.state ?? ""}
            onChange={(e) => update("state", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Country"
            name="country"
            required
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
          />
          <Field
            label="Postal code"
            name="postal_code"
            value={form.postal_code ?? ""}
            onChange={(e) => update("postal_code", e.target.value)}
          />
        </div>

        <div className="mt-2 flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      <div className="mt-8 rounded-xl border border-rose-600/30 bg-rose-100/40 p-6">
        <p className="font-semibold text-ink-900">Delete institution</p>
        <p className="mt-1 text-sm text-ink-700">
          This permanently removes your institution account. This can't be undone.
        </p>
        {deleteError && (
          <div className="mt-3">
            <Alert tone="error">{deleteError}</Alert>
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          {!confirmingDelete ? (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              Delete institution
            </Button>
          ) : (
            <>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>
                Confirm delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

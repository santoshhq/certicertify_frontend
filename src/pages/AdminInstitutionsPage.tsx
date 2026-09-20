import { Fragment, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Search, Pencil, Trash2, X } from "lucide-react";
import {
  getAllInstitutionsAsAdmin,
  updateInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
} from "../lib/admin";
import { extractErrorMessage } from "../lib/api";
import { useAdminAuth } from "../context/AdminAuthContext";
import { FrozenControl } from "../components/FrozenControl";
import { Alert } from "../components/ui/Alert";
import { PageSpinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { PasswordField } from "../components/ui/PasswordField";
import { SelectField } from "../components/ui/SelectField";
import { VerifiedBadge } from "../components/ui/Badge";
import { ApprovalStatusControl } from "../components/ApprovalStatusControl";
import { COUNTRIES, statesFor } from "../lib/locations";
import type { AdminInstitutionUpdatePayload, Institution, InstitutionApprovalStatus } from "../types";

type EditForm = {
  name: string;
  email_id: string;
  institution_name: string;
  institutional_code: string;
  gst_number: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  mobile_no: string;
  password: string;
};

function toEditForm(institution: Institution): EditForm {
  return {
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
    password: "",
  };
}

export default function AdminInstitutionsPage() {
  const { can, me } = useAdminAuth();
  const canUpdate = can("institutions_update");
  const canDelete = can("institutions_delete");
  // Approving / suspending an institution needs full control, not just update permission.
  const canChangeStatus = me?.access_level === "full";
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setInstitutions(await getAllInstitutionsAsAdmin());
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't load institutions."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return institutions;
    return institutions.filter((inst) =>
      [inst.institution_name, inst.name, inst.email_id, inst.city]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [institutions, query]);

  function startEdit(institution: Institution) {
    setRowError(null);
    setConfirmingDeleteId(null);
    setEditingId(institution.institution_id);
    setEditForm(toEditForm(institution));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setRowError(null);
  }

  function updateField<K extends keyof EditForm>(key: K, value: string) {
    setEditForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function updateCountry(country: string) {
    setEditForm((f) => (f ? { ...f, country, state: "" } : f));
  }

  async function saveEdit(institution: Institution) {
    if (!editForm) return;
    const original = toEditForm(institution);
    const payload: AdminInstitutionUpdatePayload = {};
    (Object.keys(editForm) as (keyof EditForm)[]).forEach((key) => {
      if (key === "password") {
        if (editForm.password) payload.password = editForm.password;
        return;
      }
      if (editForm[key] !== original[key]) {
        (payload as Record<string, string | null>)[key] = editForm[key] || null;
      }
    });
    if (Object.keys(payload).length === 0) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setRowError(null);
    try {
      const updated = await updateInstitutionAsAdmin(institution.institution_id, payload);
      setInstitutions((prev) =>
        prev.map((i) => (i.institution_id === institution.institution_id ? updated : i))
      );
      cancelEdit();
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't save changes."));
    } finally {
      setSaving(false);
    }
  }

  async function changeApprovalStatus(
    institution: Institution,
    superadmin_status: InstitutionApprovalStatus
  ) {
    if (superadmin_status === institution.superadmin_status) return;
    setChangingStatusId(institution.institution_id);
    setRowError(null);
    try {
      const updated = await updateInstitutionAsAdmin(institution.institution_id, {
        superadmin_status,
      });
      setInstitutions((prev) =>
        prev.map((i) => (i.institution_id === institution.institution_id ? updated : i))
      );
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't change the account status."));
    } finally {
      setChangingStatusId(null);
    }
  }

  async function handleDelete(institution: Institution) {
    setDeletingId(institution.institution_id);
    setRowError(null);
    try {
      await deleteInstitutionAsAdmin(institution.institution_id);
      setInstitutions((prev) =>
        prev.filter((i) => i.institution_id !== institution.institution_id)
      );
      setConfirmingDeleteId(null);
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't delete this institution."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-amber-600">
        {institutions.length} registered
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Institutions
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Edit contact details or remove an institution from the registry.
      </p>

      <div className="mt-6">
        <label className="relative inline-block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="search"
            placeholder="Search by name, email, or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-72 rounded-md border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15"
          />
        </label>
      </div>

      <div className="mt-4">
        {error && <Alert tone="error">{error}</Alert>}
        {rowError && (
          <div className="mb-4">
            <Alert tone="error">{rowError}</Alert>
          </div>
        )}
        {loading && <PageSpinner />}
        {!loading && !error && (
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="ledger-row bg-mint-50 text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3 font-medium">Institution</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Mobile</th>
                    <th className="px-4 py-3 font-medium">OTP</th>
                    <th className="px-4 py-3 font-medium">Account status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((institution) => {
                    const isEditing = editingId === institution.institution_id;
                    const isConfirmingDelete = confirmingDeleteId === institution.institution_id;
                    return (
                      <Fragment key={institution.institution_id}>
                        <tr className="ledger-row last:border-0">
                          <td className="px-4 py-3 font-medium text-ink-900">
                            {institution.institution_name}
                          </td>
                          <td className="px-4 py-3 text-ink-700">{institution.name}</td>
                          <td className="px-4 py-3 text-ink-700">{institution.email_id}</td>
                          <td className="px-4 py-3 text-ink-700">
                            {[institution.city, institution.state, institution.country]
                              .filter(Boolean)
                              .join(", ")}
                          </td>
                          <td className="px-4 py-3 text-ink-700">
                            {institution.mobile_no || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <VerifiedBadge verified={institution.otp_verified} />
                          </td>
                          <td className="px-4 py-3">
                            <ApprovalStatusControl
                              status={institution.superadmin_status}
                              institutionName={institution.institution_name}
                              canChange={canChangeStatus}
                              changing={changingStatusId === institution.institution_id}
                              onChange={(next) => changeApprovalStatus(institution, next)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(institution)}
                                  disabled={deletingId === institution.institution_id}
                                  className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeleteId(null)}
                                  className="text-xs text-ink-400 hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <FrozenControl allowed={canUpdate} label="Edit institution">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      isEditing ? cancelEdit() : startEdit(institution)
                                    }
                                    aria-label="Edit institution"
                                    className="text-ink-400 hover:text-pine-800"
                                  >
                                    {isEditing ? <X size={15} /> : <Pencil size={15} />}
                                  </button>
                                </FrozenControl>
                                <FrozenControl allowed={canDelete} label="Delete institution">
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingDeleteId(institution.institution_id)}
                                    aria-label="Delete institution"
                                    className="text-ink-400 hover:text-rose-600"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </FrozenControl>
                              </div>
                            )}
                          </td>
                        </tr>
                        {isEditing && editForm && (
                          <tr className="border-b border-line bg-mint-50/60">
                            <td colSpan={8} className="px-4 py-5">
                              <EditInstitutionForm
                                form={editForm}
                                saving={saving}
                                onChange={updateField}
                                onChangeCountry={updateCountry}
                                onCancel={cancelEdit}
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  saveEdit(institution);
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-ink-400">
                        {query ? "No institutions match your search." : "No institutions yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditInstitutionForm({
  form,
  saving,
  onChange,
  onChangeCountry,
  onCancel,
  onSubmit,
}: {
  form: EditForm;
  saving: boolean;
  onChange: <K extends keyof EditForm>(key: K, value: string) => void;
  onChangeCountry: (country: string) => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const states = statesFor(form.country);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-3xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Institution name"
          name="institution_name"
          required
          value={form.institution_name}
          onChange={(e) => onChange("institution_name", e.target.value)}
        />
        <Field
          label="Contact name"
          name="name"
          required
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Institutional code"
          name="institutional_code"
          required
          value={form.institutional_code}
          onChange={(e) => onChange("institutional_code", e.target.value)}
        />
        <Field
          label="GST number"
          name="gst_number"
          required
          value={form.gst_number}
          onChange={(e) => onChange("gst_number", e.target.value.toUpperCase())}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Email address"
          type="email"
          name="email_id"
          required
          value={form.email_id}
          onChange={(e) => onChange("email_id", e.target.value)}
        />
        <Field
          label="Mobile number"
          name="mobile_no"
          value={form.mobile_no}
          onChange={(e) => onChange("mobile_no", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Country"
          name="country"
          required
          placeholder="Select country"
          options={COUNTRIES}
          value={form.country}
          onChange={(e) => onChangeCountry(e.target.value)}
        />
        <SelectField
          label="State"
          name="state"
          placeholder={form.country ? "Select state" : "Select country first"}
          options={states}
          disabled={!form.country}
          value={form.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="City"
          name="city"
          required
          value={form.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
        <Field
          label="Postal code"
          name="postal_code"
          value={form.postal_code}
          onChange={(e) => onChange("postal_code", e.target.value)}
        />
      </div>
      <PasswordField
        label="Reset password"
        name="password"
        hint="Leave blank to keep the current password"
        autoComplete="new-password"
        value={form.password}
        onChange={(e) => onChange("password", e.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

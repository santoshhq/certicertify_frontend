import { Fragment, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Search, Pencil, Trash2, X, Plus, ShieldAlert } from "lucide-react";
import {
  getAllInstitutionsAsSuperAdmin,
  addInstitutionAsSuperAdmin,
  updateInstitutionAsSuperAdmin,
  deleteInstitutionAsSuperAdmin,
} from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";
import { Alert } from "../components/ui/Alert";
import { PageSpinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PhoneField } from "../components/ui/PhoneField";
import { PasswordField } from "../components/ui/PasswordField";
import { SelectField } from "../components/ui/SelectField";
import { VerifiedBadge } from "../components/ui/Badge";
import { ApprovalStatusControl } from "../components/ApprovalStatusControl";
import { COUNTRIES, dialCodeFor, statesFor } from "../lib/locations";
import type {
  Institution,
  InstitutionApprovalStatus,
  RegisterPayload,
  SuperAdminInstitutionUpdatePayload,
} from "../types";


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

const emptyAddForm: RegisterPayload = {
  name: "",
  email_id: "",
  institution_name: "",
  institutional_code: "",
  gst_number: "",
  postal_code: "",
  city: "",
  state: "",
  country: "",
  mobile_no: "",
  password: "",
};

function localMobileNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
}

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
    mobile_no: localMobileNumber(institution.mobile_no ?? ""),
    password: "",
  };
}

export default function SuperAdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<RegisterPayload>(emptyAddForm);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [pendingEmailChange, setPendingEmailChange] = useState<{
    institution: Institution;
    payload: SuperAdminInstitutionUpdatePayload;
    oldEmail: string;
    newEmail: string;
  } | null>(null);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setInstitutions(await getAllInstitutionsAsSuperAdmin());
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't load institutions."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pendingDelete =
    institutions.find((i) => i.institution_id === confirmingDeleteId) ?? null;

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

  function updateAddField<K extends keyof RegisterPayload>(key: K, value: string) {
    setAddForm((form) => ({ ...form, [key]: value }));
  }

  function updateAddCountry(country: string) {
    setAddForm((form) => ({ ...form, country, state: "" }));
  }

  function closeAdd() {
    if (adding) return;
    setAddOpen(false);
    setAddError(null);
    setAddForm(emptyAddForm);
  }

  async function addInstitution(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (addForm.password.length < 8) {
      setAddError("Password must be at least 8 characters.");
      return;
    }
    if (addForm.mobile_no && addForm.mobile_no.length !== 10) {
      setAddError("Mobile number must contain exactly 10 digits.");
      return;
    }
    setAdding(true);
    try {
      const created = await addInstitutionAsSuperAdmin({
        ...addForm,
        postal_code: addForm.postal_code || null,
        state: addForm.state || null,
        mobile_no: addForm.mobile_no
          ? `${dialCodeFor(addForm.country)}${addForm.mobile_no}`
          : null,
      });
      setInstitutions((prev) => [{ ...created, otp_verified: true }, ...prev]);
      setAddOpen(false);
      setAddError(null);
      setAddForm(emptyAddForm);
    } catch (err) {
      setAddError(extractErrorMessage(err, "Couldn't add institution."));
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(institution: Institution) {
    if (!editForm) return;
    const original = toEditForm(institution);
    const payload: SuperAdminInstitutionUpdatePayload = {};
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
    if (payload.mobile_no && editForm.mobile_no.length !== 10) {
      setRowError("Mobile number must contain exactly 10 digits.");
      return;
    }
    if (payload.mobile_no) {
      payload.mobile_no = `+91${editForm.mobile_no}`;
    }
    // Changing the login email is a security-sensitive action: the previous address
    // is alerted before the account switches over, so ask the super admin first.
    if (payload.email_id) {
      setRowError(null);
      setPendingEmailChange({
        institution,
        payload,
        oldEmail: institution.email_id,
        newEmail: payload.email_id,
      });
      return;
    }

    await commitEdit(institution, payload);
  }

  async function commitEdit(
    institution: Institution,
    payload: SuperAdminInstitutionUpdatePayload
  ) {
    setSaving(true);
    setRowError(null);
    try {
      const updated = await updateInstitutionAsSuperAdmin(institution.institution_id, payload);
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

  async function confirmEmailChange() {
    if (!pendingEmailChange) return;
    const { institution, payload } = pendingEmailChange;
    setPendingEmailChange(null);
    await commitEdit(institution, payload);
  }

  async function changeApprovalStatus(
    institution: Institution,
    superadmin_status: InstitutionApprovalStatus
  ) {
    if (superadmin_status === institution.superadmin_status) return;
    setChangingStatusId(institution.institution_id);
    setRowError(null);
    try {
      const updated = await updateInstitutionAsSuperAdmin(institution.institution_id, {
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
      await deleteInstitutionAsSuperAdmin(institution.institution_id);
      setInstitutions((prev) =>
        prev.filter((i) => i.institution_id !== institution.institution_id)
      );
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't delete this institution."));
    } finally {
      setDeletingId(null);
      // Always close the dialog so a failure surfaces in the row error banner.
      setConfirmingDeleteId(null);
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-rose-600">
        {institutions.length} registered
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Institutions
      </h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-400">
          Approve, suspend, edit, or remove institutions. Only Approved accounts can use their dashboard.
        </p>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add institution
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this institution?"
        description="This action will permanently remove the institution and all its associated data from the system."
        details={[
          { label: "Institution", value: pendingDelete?.institution_name },
          { label: "Contact", value: pendingDelete?.name },
          { label: "Email", value: pendingDelete?.email_id },
        ]}
        warning={{
          title: "This cannot be undone.",
          description:
            "Once deleted, the institution and all related records, including students, certificates, and settings, will be permanently lost.",
        }}
        confirmLabel="Yes, delete"
        loading={deletingId !== null}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        onCancel={() => setConfirmingDeleteId(null)}
      />

      {pendingEmailChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-pine-950/45 px-4 py-8">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <ShieldAlert size={18} />
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-rose-600">
                  Security confirmation
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-pine-950">
                  Are you willing to change this email address?
                </h2>
                <p className="mt-2 text-sm text-ink-400">
                  This is the login email for{" "}
                  <strong className="text-ink-700">
                    {pendingEmailChange.institution.institution_name}
                  </strong>
                  . A security alert will be sent to the current address first, then the
                  account will switch over to the new one.
                </p>
              </div>
            </div>

            <dl className="mt-5 rounded-lg border border-line bg-mint-50/60 px-4 py-3 text-sm">
              <div className="flex items-baseline justify-between gap-4 border-b border-line py-2">
                <dt className="font-mono text-xs uppercase tracking-wider text-ink-400">
                  Current
                </dt>
                <dd className="break-all text-right text-ink-400 line-through">
                  {pendingEmailChange.oldEmail}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="font-mono text-xs uppercase tracking-wider text-ink-400">
                  New
                </dt>
                <dd className="break-all text-right font-medium text-pine-800">
                  {pendingEmailChange.newEmail}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-ink-400">
              The alert goes to <strong>{pendingEmailChange.oldEmail}</strong> — not to the
              new address. After this change the old address stops receiving account mail.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingEmailChange(null)}
                disabled={saving}
              >
                No, keep current email
              </Button>
              <Button type="button" onClick={confirmEmailChange} disabled={saving}>
                Yes, change email
              </Button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pine-950/45 px-4 py-8">
          <div className="w-full max-w-3xl rounded-xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-rose-600">
                  Super admin action
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-pine-950">
                  Add institution
                </h2>
                <p className="mt-1 text-sm text-ink-400">
                  This institution is created directly without email OTP verification.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAdd}
                disabled={adding}
                aria-label="Close add institution form"
                className="text-ink-400 hover:text-pine-900 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            {addError && <div className="mt-5"><Alert tone="error">{addError}</Alert></div>}
            <AddInstitutionForm
              form={addForm}
              adding={adding}
              onChange={updateAddField}
              onChangeCountry={updateAddCountry}
              onCancel={closeAdd}
              onSubmit={addInstitution}
            />
          </div>
        </div>
      )}

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
              <table className="w-full min-w-[1100px] text-left text-sm">
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
                              canChange
                              changing={changingStatusId === institution.institution_id}
                              onChange={(next) => changeApprovalStatus(institution, next)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
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
                              <button
                                type="button"
                                onClick={() => setConfirmingDeleteId(institution.institution_id)}
                                aria-label="Delete institution"
                                className="text-ink-400 hover:text-rose-600"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
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

function AddInstitutionForm({
  form,
  adding,
  onChange,
  onChangeCountry,
  onCancel,
  onSubmit,
}: {
  form: RegisterPayload;
  adding: boolean;
  onChange: <K extends keyof RegisterPayload>(key: K, value: string) => void;
  onChangeCountry: (country: string) => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const states = statesFor(form.country);
  return (
    <form onSubmit={onSubmit} className="mt-6 flex max-h-[calc(100vh-220px)] flex-col gap-4 overflow-y-auto pr-1">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Institution name" name="institution_name" required value={form.institution_name} onChange={(e) => onChange("institution_name", e.target.value)} />
        <Field label="Contact name" name="name" required value={form.name} onChange={(e) => onChange("name", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Institutional code" name="institutional_code" required value={form.institutional_code} onChange={(e) => onChange("institutional_code", e.target.value)} />
        <Field label="GST number" name="gst_number" required value={form.gst_number} onChange={(e) => onChange("gst_number", e.target.value.toUpperCase())} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email address" type="email" name="email_id" required value={form.email_id} onChange={(e) => onChange("email_id", e.target.value)} />
        <PhoneField
          label="Mobile number"
          name="mobile_no"
          country={form.country}
          value={form.mobile_no ?? ""}
          onChange={(value) => onChange("mobile_no", value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Country" name="country" required placeholder="Select country" options={COUNTRIES} value={form.country} onChange={(e) => onChangeCountry(e.target.value)} />
        <SelectField label="State" name="state" placeholder={form.country ? "Select state" : "Select country first"} options={states} disabled={!form.country} value={form.state ?? ""} onChange={(e) => onChange("state", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" required value={form.city} onChange={(e) => onChange("city", e.target.value)} />
        <Field label="Postal code" name="postal_code" value={form.postal_code ?? ""} onChange={(e) => onChange("postal_code", e.target.value)} />
      </div>
      <PasswordField label="Password" name="password" autoComplete="new-password" hint="Minimum 8 characters" required value={form.password} onChange={(e) => onChange("password", e.target.value)} />
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={adding}>Cancel</Button>
        <Button type="submit" loading={adding}>Add institution</Button>
      </div>
    </form>
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
        <PhoneField
          label="Mobile number"
          name="mobile_no"
          country="India"
          value={form.mobile_no}
          onChange={(value) => onChange("mobile_no", value)}
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

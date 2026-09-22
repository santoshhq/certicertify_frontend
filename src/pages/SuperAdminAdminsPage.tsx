import { Fragment, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Search, ShieldCheck, Trash2, X, UserPlus, Wand2 } from "lucide-react";
import { createAdmin, getAdmins, updateAdmin, deleteAdmin } from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";
import { Alert } from "../components/ui/Alert";
import { PageSpinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { PhoneField } from "../components/ui/PhoneField";
import { PasswordField } from "../components/ui/PasswordField";
import { ToggleSwitch } from "../components/ui/ToggleSwitch";
import {
  AdminPermissionsEditor,
  EMPTY_PERMISSIONS,
  VISIBLE_PERMISSION_COUNT,
  countPermissions,
  normalizePermissions,
} from "../components/AdminPermissionsEditor";
import type {
  Admin,
  AdminAccessLevel,
  AdminCreatePayload,
  AdminPermissions,
  AdminUpdatePayload,
} from "../types";

const emptyCreateForm: AdminCreatePayload = {
  admin_name: "",
  email: "",
  mobilenumber: "",
  admin_userId: "",
  password: "",
  access_level: "custom",
  permissions: EMPTY_PERMISSIONS,
  status: true,
};

type EditForm = {
  admin_name: string;
  email: string;
  mobilenumber: string;
  admin_userId: string;
  password: string;
  access_level: AdminAccessLevel;
  permissions: AdminPermissions;
  status: boolean;
};

function samePermissions(a: AdminPermissions, b: AdminPermissions) {
  return (Object.keys(a) as (keyof AdminPermissions)[]).every((k) => a[k] === b[k]);
}

const LOGIN_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 8-character letters+digits login ID, e.g. "aB3dE9kQ". */
function generateLoginId() {
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += LOGIN_ID_CHARS[Math.floor(Math.random() * LOGIN_ID_CHARS.length)];
  }
  return id;
}

function pillClass(tone: "ok" | "bad") {
  return tone === "ok"
    ? "inline-flex items-center gap-1.5 rounded-full border border-pine-600 bg-mint-100 px-2.5 py-1 text-xs font-medium text-pine-800"
    : "inline-flex items-center gap-1.5 rounded-full border border-rose-600/40 bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-600";
}

function localMobileNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
}

function toEditForm(admin: Admin): EditForm {
  return {
    admin_name: admin.admin_name,
    email: admin.email,
    mobilenumber: localMobileNumber(admin.mobilenumber),
    admin_userId: admin.admin_loginId,
    password: "",
    access_level: admin.access_level ?? "custom",
    permissions: normalizePermissions(admin.permissions),
    status: admin.status ?? true,
  };
}

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Client-side filter by email or login ID (name too, as a convenience).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        a.admin_loginId.toLowerCase().includes(q) ||
        a.admin_name.toLowerCase().includes(q)
    );
  }, [admins, query]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AdminCreatePayload>(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setAdmins(await getAdmins());
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't load admins."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateCreateField<K extends keyof AdminCreatePayload>(
    key: K,
    value: AdminCreatePayload[K]
  ) {
    setCreateForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (createForm.admin_userId.length !== 8) {
      setCreateError("Login ID must contain exactly 8 characters.");
      return;
    }
    if (createForm.password.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }
    if (createForm.mobilenumber.length !== 10) {
      setCreateError("Mobile number must contain exactly 10 digits.");
      return;
    }

    setCreating(true);
    try {
      await createAdmin({
        ...createForm,
        mobilenumber: `+91${createForm.mobilenumber}`,
      });
      setCreateSuccess("Admin created. Login details were emailed to them.");
      setCreateForm(emptyCreateForm);
      setCreateOpen(false);
      load();
    } catch (err) {
      setCreateError(extractErrorMessage(err, "Couldn't create admin."));
    } finally {
      setCreating(false);
    }
  }

  function startEdit(admin: Admin) {
    setRowError(null);
    setConfirmingDeleteId(null);
    setEditingId(admin.admin_id);
    setEditForm(toEditForm(admin));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setRowError(null);
  }

  function updateEditField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function saveEdit(admin: Admin) {
    if (!editForm) return;
    const original = toEditForm(admin);
    const payload: AdminUpdatePayload = {};
    if (editForm.admin_name !== original.admin_name) payload.admin_name = editForm.admin_name;
    if (editForm.email !== original.email) payload.email = editForm.email;
    if (editForm.mobilenumber !== original.mobilenumber) payload.mobilenumber = editForm.mobilenumber;
    if (editForm.admin_userId !== original.admin_userId) payload.admin_userId = editForm.admin_userId;
    if (editForm.password) payload.password = editForm.password;
    if (editForm.access_level !== original.access_level) payload.access_level = editForm.access_level;
    if (!samePermissions(editForm.permissions, original.permissions)) {
      payload.permissions = editForm.permissions;
    }
    if (editForm.status !== original.status) payload.status = editForm.status;

    if (Object.keys(payload).length === 0) {
      cancelEdit();
      return;
    }
    if (payload.admin_userId && payload.admin_userId.length !== 8) {
      setRowError("Login ID must contain exactly 8 characters.");
      return;
    }
    if (payload.mobilenumber && editForm.mobilenumber.length !== 10) {
      setRowError("Mobile number must contain exactly 10 digits.");
      return;
    }
    if (payload.password && payload.password.length < 8) {
      setRowError("Password must be at least 8 characters.");
      return;
    }

    if (payload.mobilenumber) {
      payload.mobilenumber = `+91${editForm.mobilenumber}`;
    }

    setSaving(true);
    setRowError(null);
    try {
      const updated = await updateAdmin(admin.admin_id, payload);
      setAdmins((prev) => prev.map((a) => (a.admin_id === admin.admin_id ? updated : a)));
      cancelEdit();
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't save changes."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(admin: Admin, active: boolean) {
    setTogglingStatusId(admin.admin_id);
    setRowError(null);
    try {
      const updated = await updateAdmin(admin.admin_id, { status: active });
      setAdmins((prev) => prev.map((a) => (a.admin_id === admin.admin_id ? updated : a)));
      setEditForm((f) => (f && editingId === admin.admin_id ? { ...f, status: active } : f));
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't change the admin's status."));
    } finally {
      setTogglingStatusId(null);
    }
  }

  async function handleDelete(admin: Admin) {
    setDeletingId(admin.admin_id);
    setRowError(null);
    try {
      await deleteAdmin(admin.admin_id);
      setAdmins((prev) => prev.filter((a) => a.admin_id !== admin.admin_id));
      setConfirmingDeleteId(null);
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't delete this admin."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-pine-950">Admins</h1>
        <Button
          type="button"
          variant={createOpen ? "secondary" : "primary"}
          onClick={() => setCreateOpen((o) => !o)}
        >
          <UserPlus size={16} />
          {createOpen ? "Close" : "Create admin"}
        </Button>
      </div>

      {createSuccess && !createOpen && (
        <div className="mt-4">
          <Alert tone="success">{createSuccess}</Alert>
        </div>
      )}

      {createOpen && (
        <form
          onSubmit={handleCreate}
          className="mt-6 flex flex-col gap-4 rounded-lg border border-pine-600/30 bg-mint-50/60 p-5"
        >
          {createError && <Alert tone="error">{createError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Admin name"
              name="admin_name"
              required
              value={createForm.admin_name}
              onChange={(e) => updateCreateField("admin_name", e.target.value)}
            />
            <Field
              label="Email address"
              type="email"
              name="email"
              required
              value={createForm.email}
              onChange={(e) => updateCreateField("email", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PhoneField
              label="Mobile number"
              name="mobilenumber"
              country="India"
              required
              value={createForm.mobilenumber}
              onChange={(value) => updateCreateField("mobilenumber", value)}
            />
            <Field
              label="Login ID"
              name="admin_userId"
              hint="Exactly 8 characters"
              maxLength={8}
              required
              value={createForm.admin_userId}
              onChange={(e) => updateCreateField("admin_userId", e.target.value)}
              suffix={
                <button
                  type="button"
                  onClick={() => updateCreateField("admin_userId", generateLoginId())}
                  aria-label="Generate login ID"
                  title="Generate login ID"
                  className="rounded p-0.5 text-ink-400 transition-colors hover:text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-600/30"
                >
                  <Wand2 size={16} />
                </button>
              }
            />
          </div>
          <PasswordField
            label="Password"
            name="password"
            hint="Minimum 8 characters"
            autoComplete="new-password"
            required
            value={createForm.password}
            onChange={(e) => updateCreateField("password", e.target.value)}
          />
          <AdminPermissionsEditor
            accessLevel={createForm.access_level}
            permissions={createForm.permissions}
            status={createForm.status}
            disabled={creating}
            onAccessLevelChange={(level) => updateCreateField("access_level", level)}
            onPermissionsChange={(next) => updateCreateField("permissions", next)}
            onStatusChange={(active) => updateCreateField("status", active)}
          />
          <div>
            <Button type="submit" loading={creating}>
              Create admin
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full sm:w-80">
          <span className="sr-only">Search admins</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="search"
            placeholder="Search by email or login ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15"
          />
        </label>
        {!loading && !error && query && (
          <p className="text-xs text-ink-400">
            {filtered.length} of {admins.length} admin{admins.length === 1 ? "" : "s"}
          </p>
        )}
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
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="ledger-row bg-mint-50 text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3 font-medium">Login ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Mobile</th>
                    <th className="px-4 py-3 font-medium">Access</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((admin) => {
                    const isEditing = editingId === admin.admin_id;
                    const isConfirmingDelete = confirmingDeleteId === admin.admin_id;
                    return (
                      <Fragment key={admin.admin_id}>
                        <tr className="ledger-row last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-ink-700">
                            {admin.admin_loginId}
                          </td>
                          <td className="px-4 py-3 text-ink-900">{admin.admin_name}</td>
                          <td className="px-4 py-3 text-ink-700">{admin.email}</td>
                          <td className="px-4 py-3 text-ink-700">{admin.mobilenumber}</td>
                          <td className="px-4 py-3">
                            {admin.access_level === "full" ? (
                              <span className={pillClass("ok")}>
                                <ShieldCheck size={12} /> Full access
                              </span>
                            ) : (
                              <span className="text-xs text-ink-700">
                                Custom: {countPermissions(admin.permissions)} of {VISIBLE_PERMISSION_COUNT}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ToggleSwitch
                                checked={admin.status !== false}
                                disabled={togglingStatusId === admin.admin_id}
                                onChange={(active) => toggleStatus(admin, active)}
                                label={`${admin.status === false ? "Activate" : "Deactivate"} ${admin.admin_name}`}
                              />
                              <span className={pillClass(admin.status === false ? "bad" : "ok")}>
                                {admin.status === false ? "Inactive" : "Active"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(admin)}
                                  disabled={deletingId === admin.admin_id}
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
                                <button
                                  type="button"
                                  onClick={() => (isEditing ? cancelEdit() : startEdit(admin))}
                                  aria-label="Edit admin"
                                  className="text-ink-400 hover:text-pine-800"
                                >
                                  {isEditing ? <X size={15} /> : <Pencil size={15} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeleteId(admin.admin_id)}
                                  aria-label="Delete admin"
                                  className="text-ink-400 hover:text-rose-600"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {isEditing && editForm && (
                          <tr className="border-b border-line bg-mint-50/60">
                            <td colSpan={7} className="px-4 py-5">
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  saveEdit(admin);
                                }}
                                className="flex max-w-3xl flex-col gap-4"
                              >
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <Field
                                    label="Admin name"
                                    name="admin_name"
                                    required
                                    value={editForm.admin_name}
                                    onChange={(e) => updateEditField("admin_name", e.target.value)}
                                  />
                                  <Field
                                    label="Email address"
                                    type="email"
                                    name="email"
                                    required
                                    value={editForm.email}
                                    onChange={(e) => updateEditField("email", e.target.value)}
                                  />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <PhoneField
                                    label="Mobile number"
                                    name="mobilenumber"
                                    country="India"
                                    required
                                    value={editForm.mobilenumber}
                                    onChange={(value) => updateEditField("mobilenumber", value)}
                                  />
                                  <Field
                                    label="Login ID"
                                    name="admin_userId"
                                    hint="Exactly 8 characters"
                                    maxLength={8}
                                    required
                                    value={editForm.admin_userId}
                                    onChange={(e) => updateEditField("admin_userId", e.target.value)}
                                  />
                                </div>
                                <PasswordField
                                  label="Reset password"
                                  name="password"
                                  hint="Leave blank to keep the current password"
                                  autoComplete="new-password"
                                  value={editForm.password}
                                  onChange={(e) => updateEditField("password", e.target.value)}
                                />
                                <AdminPermissionsEditor
                                  accessLevel={editForm.access_level}
                                  permissions={editForm.permissions}
                                  status={editForm.status}
                                  disabled={saving}
                                  onAccessLevelChange={(level) => updateEditField("access_level", level)}
                                  onPermissionsChange={(next) => updateEditField("permissions", next)}
                                  onStatusChange={(active) => updateEditField("status", active)}
                                />
                                <div className="flex items-center gap-3">
                                  <Button type="submit" loading={saving}>
                                    Save changes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={cancelEdit}
                                    disabled={saving}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-ink-400">
                        {query ? "No admins match your search." : "No admins created yet."}
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

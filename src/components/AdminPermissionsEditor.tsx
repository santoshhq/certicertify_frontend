import clsx from "clsx";
import { ShieldCheck, SlidersHorizontal } from "lucide-react";
import { ToggleSwitch } from "./ui/ToggleSwitch";
import type { AdminAccessLevel, AdminPermissionKey, AdminPermissions } from "../types";

export const EMPTY_PERMISSIONS: AdminPermissions = {
  students_view: false,
  students_create: false,
  students_update: false,
  students_delete: false,
  institutions_view: false,
  institutions_create: false,
  institutions_update: false,
  institutions_delete: false,
};

export function normalizePermissions(value?: Partial<AdminPermissions>): AdminPermissions {
  return { ...EMPTY_PERMISSIONS, ...(value ?? {}) };
}

// institutions_create has no admin route yet, so it is never shown or counted.
export const VISIBLE_PERMISSION_COUNT = 7;

export function countPermissions(value?: Partial<AdminPermissions>) {
  const { institutions_create: _hidden, ...visible } = normalizePermissions(value);
  return Object.values(visible).filter(Boolean).length;
}

// "View" is the gate for each group: without it the other actions are unusable,
// so they stay disabled until View is ticked and are cleared when View is unticked.
const GROUPS: {
  title: string;
  view: AdminPermissionKey;
  actions: { key: AdminPermissionKey; label: string }[];
}[] = [
  {
    title: "Students",
    view: "students_view",
    actions: [
      { key: "students_create", label: "Upload / create" },
      { key: "students_update", label: "Edit & replace certificates" },
      { key: "students_delete", label: "Delete" },
    ],
  },
  {
    title: "Institutions",
    view: "institutions_view",
    actions: [
      { key: "institutions_update", label: "Edit" },
      { key: "institutions_delete", label: "Delete" },
    ],
  },
];

const checkboxClass = "mt-0.5 h-4 w-4 rounded border-line text-pine-700 focus:ring-pine-600/30";

export function AdminPermissionsEditor({
  accessLevel,
  permissions,
  status,
  disabled,
  onAccessLevelChange,
  onPermissionsChange,
  onStatusChange,
}: {
  accessLevel: AdminAccessLevel;
  permissions: AdminPermissions;
  status: boolean;
  disabled?: boolean;
  onAccessLevelChange: (level: AdminAccessLevel) => void;
  onPermissionsChange: (next: AdminPermissions) => void;
  onStatusChange: (active: boolean) => void;
}) {
  const isFull = accessLevel === "full";

  function toggleAction(key: AdminPermissionKey) {
    onPermissionsChange({ ...permissions, [key]: !permissions[key] });
  }

  function toggleView(group: (typeof GROUPS)[number]) {
    const next = { ...permissions, [group.view]: !permissions[group.view] };
    if (!next[group.view]) group.actions.forEach(({ key }) => (next[key] = false));
    onPermissionsChange(next);
  }

  function setGroup(group: (typeof GROUPS)[number], value: boolean) {
    const next = { ...permissions, [group.view]: value };
    group.actions.forEach(({ key }) => (next[key] = value));
    onPermissionsChange(next);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-white p-4">
      <div>
        <p className="text-sm font-medium text-ink-700">Access level</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <AccessOption
            active={isFull}
            disabled={disabled}
            icon={ShieldCheck}
            title="Full access"
            body="Bypasses every permission check — complete control over institutions and students."
            onClick={() => onAccessLevelChange("full")}
          />
          <AccessOption
            active={!isFull}
            disabled={disabled}
            icon={SlidersHorizontal}
            title="Custom"
            body="Only the permissions ticked below are allowed."
            onClick={() => onAccessLevelChange("custom")}
          />
        </div>
      </div>

      <div className={clsx("grid gap-4 sm:grid-cols-2", isFull && "opacity-40")}>
        {GROUPS.map((group) => {
          const canView = permissions[group.view];
          const allOn = canView && group.actions.every(({ key }) => permissions[key]);
          return (
            <fieldset key={group.title} disabled={disabled || isFull} className="min-w-0">
              <div className="flex items-center justify-between">
                <legend className="text-sm font-medium text-ink-700">{group.title}</legend>
                <button
                  type="button"
                  onClick={() => setGroup(group, !allOn)}
                  className="text-xs text-pine-800 hover:underline disabled:cursor-not-allowed disabled:no-underline"
                >
                  {allOn ? "Clear all" : "Select all"}
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-900 has-[:disabled]:cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={canView}
                    onChange={() => toggleView(group)}
                    className={checkboxClass}
                  />
                  <span>
                    View
                    {!canView && (
                      <span className="ml-1 text-xs text-ink-400">(required for the actions below)</span>
                    )}
                  </span>
                </label>
                <div className={clsx("ml-6 flex flex-col gap-1.5", !canView && "opacity-50")}>
                  {group.actions.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-2 text-sm text-ink-900 has-[:disabled]:cursor-not-allowed"
                    >
                      <input
                        type="checkbox"
                        checked={permissions[key]}
                        disabled={!canView}
                        onChange={() => toggleAction(key)}
                        className={checkboxClass}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="text-sm font-medium text-ink-900">Account {status ? "active" : "inactive"}</p>
          <p className="text-xs text-ink-400">Inactive admins can't sign in.</p>
        </div>
        <ToggleSwitch
          checked={status}
          disabled={disabled}
          onChange={onStatusChange}
          label="Account active"
        />
      </div>
    </div>
  );
}

function AccessOption({
  active,
  disabled,
  icon: Icon,
  title,
  body,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={clsx(
        "flex items-start gap-3 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed",
        active
          ? "border-pine-600 bg-mint-50 ring-1 ring-pine-600/30"
          : "border-line bg-white hover:bg-mint-50/60"
      )}
    >
      <Icon size={18} className={clsx("mt-0.5 shrink-0", active ? "text-pine-800" : "text-ink-400")} />
      <span>
        <span className="block text-sm font-medium text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-400">{body}</span>
      </span>
    </button>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ShieldCheck, UploadCloud, BarChart3 } from "lucide-react";
import { useSuperAdminAuth } from "../context/SuperAdminAuthContext";
import { Alert } from "../components/ui/Alert";
import { StatTile } from "../components/ui/Stats";
import { getAllInstitutionsAsSuperAdmin, getAdmins } from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";

export default function SuperAdminDashboardPage() {
  const { email } = useSuperAdminAuth();

  const [institutionCount, setInstitutionCount] = useState<number | null>(null);
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllInstitutionsAsSuperAdmin(), getAdmins()])
      .then(([institutions, admins]) => {
        if (cancelled) return;
        setInstitutionCount(institutions.length);
        setAdminCount(admins.length);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, "Couldn't load dashboard counts."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-wider text-rose-600">
        Super admin dashboard
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Welcome back{email ? `, ${email}` : ""}
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Manage institutions, admins, and student records across CertiCertify.
      </p>

      {error && (
        <div className="mt-8">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatTile icon={Building2} label="Institutions" value={institutionCount} />
        <StatTile icon={ShieldCheck} label="Admins created" value={adminCount} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <QuickLink
          to="/superadmin/institutions"
          icon={Building2}
          title="Manage institutions"
          description="Edit contact details or remove an institution."
        />
        <QuickLink
          to="/superadmin/admins"
          icon={ShieldCheck}
          title="Manage admins"
          description="Create, edit, or remove admin accounts."
        />
        <QuickLink
          to="/superadmin/students/upload"
          icon={UploadCloud}
          title="Upload students"
          description="Add a roster and certificates for an institution."
        />
        <QuickLink
          to="/superadmin/students/stats"
          icon={BarChart3}
          title="Student statistics"
          description="View counts by year, department, and grade."
        />
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-4 rounded-xl border border-line bg-white p-5 transition-colors hover:border-pine-600/40 hover:bg-mint-50/60"
    >
      <Icon size={20} className="mt-0.5 shrink-0 text-pine-700" strokeWidth={1.75} />
      <div>
        <p className="font-medium text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-400">{description}</p>
      </div>
    </Link>
  );
}

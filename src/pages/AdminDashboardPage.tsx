import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, UploadCloud, BarChart3, CalendarClock } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Alert } from "../components/ui/Alert";
import { StatTile } from "../components/ui/Stats";
import { getAllInstitutionsAsAdmin } from "../lib/admin";
import { extractErrorMessage } from "../lib/api";

export default function AdminDashboardPage() {
  const { adminName, adminLoginId } = useAdminAuth();

  const [institutionCount, setInstitutionCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllInstitutionsAsAdmin()
      .then((institutions) => {
        if (!cancelled) setInstitutionCount(institutions.length);
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
      <p className="font-mono text-xs uppercase tracking-wider text-amber-600">
        Admin dashboard
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Welcome back{adminName ? `, ${adminName}` : adminLoginId ? `, ${adminLoginId}` : ""}
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Manage institutions and student records across CertiCertify.
      </p>

      {error && (
        <div className="mt-8">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:max-w-xs">
        <StatTile icon={Building2} label="Institutions" value={institutionCount} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <QuickLink
          to="/admin/institutions"
          icon={Building2}
          title="Manage institutions"
          description="Edit contact details or remove an institution."
        />
        <QuickLink
          to="/admin/students/upload"
          icon={UploadCloud}
          title="Upload students"
          description="Add a roster and certificates for an institution."
        />
        <QuickLink
          to="/admin/students"
          icon={CalendarClock}
          title="Previous data Year Wise"
          description="Browse, edit, or add to a roster by batch year."
        />
        <QuickLink
          to="/admin/students/stats"
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

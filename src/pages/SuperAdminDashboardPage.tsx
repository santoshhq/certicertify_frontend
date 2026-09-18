import { useEffect, useState } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { Alert } from "../components/ui/Alert";
import { StatTile } from "../components/ui/Stats";
import {
  getAllInstitutionsAsSuperAdmin,
  getAdmins,
  getStudentStatsAsSuperAdmin,
} from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";
import { StudentStatsPanel } from "../components/StudentStatsPanel";

export default function SuperAdminDashboardPage() {
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
        if (!cancelled) {
          setError(extractErrorMessage(err, "Couldn't load dashboard counts."));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-6xl">
      {error && (
        <div className="mb-8">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile icon={Building2} label="Institutions" value={institutionCount} />
        <StatTile icon={ShieldCheck} label="Admins created" value={adminCount} />
      </div>

      <section className="mt-10">
        <p className="font-mono text-xs uppercase tracking-wider text-rose-600">
          Student statistics
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-pine-950">
          Student records overview
        </h2>
        <p className="mt-2 text-sm text-ink-400">
          Choose an institution to see how its student records break down.
        </p>
        <StudentStatsPanel
          loadInstitutions={getAllInstitutionsAsSuperAdmin}
          loadStats={getStudentStatsAsSuperAdmin}
        />
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Users, Layers, GraduationCap, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { VerifiedBadge } from "../components/ui/Badge";
import { Alert } from "../components/ui/Alert";
import { StatTile, BreakdownCard, countKeys } from "../components/ui/Stats";
import { getStudentStats } from "../lib/students";
import { extractErrorMessage } from "../lib/api";
import type { StudentStats } from "../types";

export default function DashboardHome() {
  const { institution } = useAuth();
  const institutionId = institution?.institution_id ?? "";

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    getStudentStats(institutionId)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setStatsError(extractErrorMessage(err, "Couldn't load student counts."));
      });
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-wider text-pine-600">
        Institution dashboard
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Welcome back{institution ? `, ${institution.institution_name}` : ""}
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Manage your institution's certificate records from one place.
      </p>

      {institution && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white p-6">
          <div>
            <p className="text-sm text-ink-400">Signed in as</p>
            <p className="mt-1 font-display text-xl font-semibold text-pine-950">
              {institution.institution_name}
            </p>
            <p className="text-sm text-ink-700">{institution.email_id}</p>
          </div>
          <VerifiedBadge verified={institution.otp_verified} />
        </div>
      )}

      {statsError && (
        <div className="mt-8">
          <Alert tone="error">{statsError}</Alert>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Users}
          label="Total students"
          value={stats ? stats.total_students : null}
        />
        <StatTile
          icon={Layers}
          label="Batch years"
          value={stats ? countKeys(stats.by_batch_year) : null}
        />
        <StatTile
          icon={GraduationCap}
          label="Pass-out years"
          value={stats ? countKeys(stats.by_year) : null}
        />
        <StatTile
          icon={BookOpen}
          label="Courses"
          value={stats ? countKeys(stats.by_department) : null}
        />
      </div>

      {stats && stats.total_students > 0 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <BreakdownCard
            title="Students by batch year"
            counts={stats.by_batch_year}
            total={stats.total_students}
            sort="label"
          />
          <BreakdownCard
            title="Students by pass-out year"
            counts={stats.by_year}
            total={stats.total_students}
            sort="label"
          />
          <BreakdownCard
            title="Students by course"
            counts={stats.by_department}
            total={stats.total_students}
            sort="count"
          />
        </div>
      )}
    </div>
  );
}

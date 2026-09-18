import { useEffect, useState } from "react";
import { Users, Layers, GraduationCap, BookOpen } from "lucide-react";
import { SelectField } from "../components/ui/SelectField";
import { Alert } from "../components/ui/Alert";
import { StatTile, BreakdownCard, countKeys } from "../components/ui/Stats";
import { getAllInstitutionsAsSuperAdmin, getStudentStatsAsSuperAdmin } from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";
import type { Institution, StudentStats } from "../types";

export default function SuperAdminStudentStatsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState("");

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    getAllInstitutionsAsSuperAdmin()
      .then((data) => {
        setInstitutions(data);
        if (data.length > 0) setInstitutionId(data[0].institution_id);
      })
      .catch((err) =>
        setInstitutionsError(extractErrorMessage(err, "Couldn't load institutions."))
      );
  }, []);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    setStats(null);
    setStatsError(null);
    getStudentStatsAsSuperAdmin(institutionId)
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

  const selectedInstitution = institutions.find((i) => i.institution_id === institutionId);

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-wider text-rose-600">
        Student statistics
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        {selectedInstitution ? selectedInstitution.institution_name : "Student statistics"}
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Pick an institution to see how its student records break down.
      </p>

      {institutionsError && (
        <div className="mt-4">
          <Alert tone="error">{institutionsError}</Alert>
        </div>
      )}

      <div className="mt-6 max-w-sm">
        <SelectField
          label="Institution"
          name="institution"
          placeholder={institutions.length ? undefined : "No institutions yet"}
          options={institutions.map((i) => ({
            value: i.institution_id,
            label: i.institution_name,
          }))}
          value={institutionId}
          onChange={(e) => setInstitutionId(e.target.value)}
          disabled={institutions.length === 0}
        />
      </div>

      {statsError && (
        <div className="mt-8">
          <Alert tone="error">{statsError}</Alert>
        </div>
      )}

      {institutionId && (
        <>
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
        </>
      )}
    </div>
  );
}

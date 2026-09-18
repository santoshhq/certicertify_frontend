import { useEffect, useState } from "react";
import { Users, Layers, GraduationCap, BookOpen } from "lucide-react";
import { SelectField } from "./ui/SelectField";
import { Alert } from "./ui/Alert";
import { StatTile, BreakdownCard, countKeys } from "./ui/Stats";
import { extractErrorMessage } from "../lib/api";
import type { Institution, StudentStats } from "../types";

type StudentStatsPanelProps = {
  loadInstitutions: () => Promise<Institution[]>;
  loadStats: (institutionId: string) => Promise<StudentStats>;
};

export function StudentStatsPanel({
  loadInstitutions,
  loadStats,
}: StudentStatsPanelProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState("");
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    loadInstitutions()
      .then((data) => {
        setInstitutions(data);
        if (data.length > 0) setInstitutionId(data[0].institution_id);
      })
      .catch((error) =>
        setInstitutionsError(extractErrorMessage(error, "Couldn't load institutions."))
      );
  }, [loadInstitutions]);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    setStats(null);
    setStatsError(null);
    loadStats(institutionId)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setStatsError(extractErrorMessage(error, "Couldn't load student counts."));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [institutionId, loadStats]);

  return (
    <div>
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
          options={institutions.map((institution) => ({
            value: institution.institution_id,
            label: institution.institution_name,
          }))}
          value={institutionId}
          onChange={(event) => setInstitutionId(event.target.value)}
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

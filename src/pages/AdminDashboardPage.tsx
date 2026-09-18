import { getAllInstitutionsAsAdmin, getStudentStatsAsAdmin } from "../lib/admin";
import { StudentStatsPanel } from "../components/StudentStatsPanel";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl">
      <section>
        <p className="font-mono text-xs uppercase tracking-wider text-amber-600">
          Student statistics
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-pine-950">
          Student records overview
        </h2>
        <p className="mt-2 text-sm text-ink-400">
          Choose an institution to see how its student records break down.
        </p>
        <StudentStatsPanel
          loadInstitutions={getAllInstitutionsAsAdmin}
          loadStats={getStudentStatsAsAdmin}
        />
      </section>
    </div>
  );
}

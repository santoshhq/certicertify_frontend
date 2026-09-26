import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Users } from "lucide-react";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { currentIndianYear } from "./BatchYearField";
import { batchYearError, maxPassOut, passOutError, toStoredPassOut } from "../lib/passOut";
import type { PassOutPrecision } from "../lib/passOut";
import type { StudentUpdatePayload } from "../lib/students";
import type { Student } from "../types";

export const rowCheckboxClass =
  "h-4 w-4 rounded border-line text-pine-700 focus:ring-pine-600/30";

type UpdateFn = (rollNoCertificateNo: string, payload: StudentUpdatePayload) => Promise<Student>;

/**
 * Selection + bulk-apply state for updating batch year, pass-out year and
 * course on many students at once. Only those three fields are bulk-editable.
 */
export function useBulkStudentUpdate(
  students: Student[],
  setStudents: Dispatch<SetStateAction<Student[]>>,
  updateFn: UpdateFn
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchYear, setBatchYear] = useState("");
  const [passYear, setPassYear] = useState("");
  const [passOutPrecision, setPassOutPrecision] = useState<PassOutPrecision>("month");
  const [course, setCourse] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggle(studentId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function toggleAll(visible: Student[]) {
    setSelectedIds((prev) => {
      const ids = visible.map((s) => s.student_id);
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function allVisibleSelected(visible: Student[]) {
    return visible.length > 0 && visible.every((s) => selectedIds.has(s.student_id));
  }

  function togglePassOutPrecision() {
    setPassOutPrecision((p) => (p === "month" ? "date" : "month"));
    setPassYear("");
  }

  function clear() {
    setSelectedIds(new Set());
    setBatchYear("");
    setPassYear("");
    setCourse("");
    setError(null);
    setSuccess(null);
  }

  async function apply() {
    const nextBatch = batchYear.trim();
    const nextPass = passYear.trim();
    const nextCourse = course.trim();
    if (!nextBatch && !nextPass && !nextCourse) {
      setError("Enter a batch year, pass-out year, and/or course to apply.");
      return;
    }
    const invalid =
      (nextBatch && batchYearError(nextBatch)) || (nextPass && passOutError(nextPass));
    if (invalid) {
      setError(invalid);
      return;
    }
    const payload: StudentUpdatePayload = {};
    if (nextBatch) payload.batch_year = nextBatch;
    if (nextPass) payload.month_year_pass = toStoredPassOut(nextPass, passOutPrecision);
    if (nextCourse) payload.course_or_Acadamic = nextCourse;

    const targets = students.filter((s) => selectedIds.has(s.student_id));
    setSaving(true);
    setError(null);
    setSuccess(null);
    const results = await Promise.allSettled(
      targets.map((s) => updateFn(s.roll_no, payload))
    );

    const updatedById = new Map<string, Student>();
    let failed = 0;
    results.forEach((result, i) => {
      if (result.status === "fulfilled") updatedById.set(targets[i].student_id, result.value);
      else failed += 1;
    });
    setStudents((prev) => prev.map((s) => updatedById.get(s.student_id) ?? s));
    setSaving(false);

    if (failed > 0) {
      setError(
        `Updated ${updatedById.size} of ${targets.length}. ${failed} failed — check permissions and try again.`
      );
      return;
    }
    const count = updatedById.size;
    setSelectedIds(new Set());
    setBatchYear("");
    setPassYear("");
    setCourse("");
    setSuccess(`Updated ${count} student${count === 1 ? "" : "s"}.`);
  }

  return {
    selectedIds,
    isSelected: (studentId: string) => selectedIds.has(studentId),
    toggle,
    toggleAll,
    allVisibleSelected,
    clear,
    apply,
    batchYear,
    setBatchYear,
    passYear,
    setPassYear,
    passOutPrecision,
    togglePassOutPrecision,
    course,
    setCourse,
    saving,
    error,
    success,
  };
}

export function BulkUpdateBar({
  bulk,
}: {
  bulk: ReturnType<typeof useBulkStudentUpdate>;
}) {
  const count = bulk.selectedIds.size;
  if (count === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-pine-600/30 bg-mint-50/60 p-4">
      <div className="flex items-center gap-2 pr-2 text-sm font-medium text-ink-900">
        <Users size={16} className="text-pine-700" />
        {count} selected
      </div>
      <div className="w-36">
        <Field
          label="Set batch year"
          name="bulk_batch_year"
          placeholder={`e.g. ${currentIndianYear()}`}
          inputMode="numeric"
          maxLength={4}
          value={bulk.batchYear}
          onChange={(e) => bulk.setBatchYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </div>
      <div className="w-56">
        <Field
          label={bulk.passOutPrecision === "month" ? "Set pass-out month & year" : "Set pass-out date"}
          name="bulk_pass_year"
          type={bulk.passOutPrecision === "month" ? "month" : "date"}
          max={maxPassOut(bulk.passOutPrecision)}
          value={bulk.passYear}
          onChange={(e) => bulk.setPassYear(e.target.value)}
        />
        <button
          type="button"
          onClick={bulk.togglePassOutPrecision}
          className="mt-1.5 text-xs font-medium text-pine-800 underline-offset-2 hover:underline"
        >
          {bulk.passOutPrecision === "month" ? "Use exact date instead" : "Use month & year instead"}
        </button>
      </div>
      <div className="w-56">
        <Field
          label="Set course"
          name="bulk_course"
          placeholder="e.g. B.Tech CSE"
          value={bulk.course}
          onChange={(e) => bulk.setCourse(e.target.value)}
        />
      </div>
      <Button type="button" onClick={bulk.apply} loading={bulk.saving}>
        Apply to {count} student{count === 1 ? "" : "s"}
      </Button>
      <Button type="button" variant="ghost" onClick={bulk.clear} disabled={bulk.saving}>
        Clear selection
      </Button>
    </div>
  );
}

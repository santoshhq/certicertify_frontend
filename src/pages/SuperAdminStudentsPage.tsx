import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  UserPlus,
  FileSpreadsheet,
  FileText,
  FileArchive,
  UploadCloud,
  ChevronDown,
} from "lucide-react";
import {
  getAllInstitutionsAsSuperAdmin,
  listStudentsByInstitutionAsSuperAdmin,
  updateStudentAsSuperAdmin,
  replaceStudentCertificateAsSuperAdmin,
  deleteStudentAsSuperAdmin,
  uploadStudentsAsSuperAdmin,
} from "../lib/superadmin";
import type { StudentUpdatePayload } from "../lib/students";
import { extractErrorMessage } from "../lib/api";
import { UploadResults } from "../components/UploadResults";
import { CertificateCell, useCertificateReplace } from "../components/CertificateCell";
import {
  BulkUpdateBar,
  rowCheckboxClass,
  useBulkStudentUpdate,
} from "../components/BulkStudentUpdate";
import { Alert } from "../components/ui/Alert";
import { PageSpinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { SelectField } from "../components/ui/SelectField";
import { Field } from "../components/ui/Field";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DropZone, isCertificateFile, isZipFile } from "../components/ui/DropZone";
import { TablePager } from "../components/ui/TablePager";
import type { PageSize } from "../components/ui/TablePager";
import type { Institution, Student, StudentUploadResponse } from "../types";

type EditableField =
  | "certificate_no"
  | "roll_no"
  | "student_name"
  | "surname_lastName"
  | "course_or_Acadamic"
  | "month_year_pass"
  | "batch_year"
  | "grade";

const EDITABLE_FIELDS: EditableField[] = [
  "certificate_no",
  "roll_no",
  "student_name",
  "surname_lastName",
  "course_or_Acadamic",
  "month_year_pass",
  "batch_year",
  "grade",
];

const CUSTOM_BATCH = "__custom__";

function cellInputClass() {
  return "w-full rounded border border-line bg-white px-2 py-1 text-sm outline-none focus:border-pine-600 focus:ring-1 focus:ring-pine-600/20";
}

/** Pulls the 4-digit year out of free-text like "May 2024" or "06/2024". */
function passOutYear(monthYearPass: string) {
  return monthYearPass.match(/\d{4}/)?.[0] ?? "";
}

function sortYearsDesc(values: Iterable<string>) {
  return Array.from(new Set(values))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

export default function SuperAdminStudentsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters — all applied client-side against the full roster.
  const [query, setQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [passYearFilter, setPassYearFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<EditableField, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const bulk = useBulkStudentUpdate(students, setStudents, updateStudentAsSuperAdmin);
  const certificate = useCertificateReplace(setStudents, replaceStudentCertificateAsSuperAdmin);

  const selectedInstitution = institutions.find((i) => i.institution_id === institutionId);

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

  async function load(institutionName: string) {
    setLoading(true);
    setError(null);
    try {
      setStudents(await listStudentsByInstitutionAsSuperAdmin(institutionName));
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't load the student roster."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedInstitution) {
      setStudents([]);
      return;
    }
    setQuery("");
    setBatchFilter("");
    setPassYearFilter("");
    setPage(1);
    setAddOpen(false);
    bulk.clear();
    load(selectedInstitution.institution_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstitution?.institution_id]);

  const batchYears = useMemo(
    () => sortYearsDesc(students.map((s) => s.batch_year ?? "")),
    [students]
  );
  const passYears = useMemo(
    () => sortYearsDesc(students.map((s) => passOutYear(s.month_year_pass))),
    [students]
  );

  const pendingDelete =
    students.find((s) => s.student_id === confirmingDeleteId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (batchFilter && (s.batch_year ?? "") !== batchFilter) return false;
      if (passYearFilter && passOutYear(s.month_year_pass) !== passYearFilter) return false;
      if (!q) return true;
      return (
        (s.roll_no ?? "").toLowerCase().includes(q) ||
        (s.certificate_no ?? "").toLowerCase().includes(q) ||
        `${s.student_name} ${s.surname_lastName}`.toLowerCase().includes(q)
      );
    });
  }, [students, query, batchFilter, passYearFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasFilters = Boolean(query || batchFilter || passYearFilter);

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setBatchFilter("");
    setPassYearFilter("");
    resetPage();
  }

  function startEdit(student: Student) {
    setRowError(null);
    setEditingId(student.student_id);
    setEditForm({
      certificate_no: student.certificate_no ?? "",
      roll_no: student.roll_no,
      student_name: student.student_name,
      surname_lastName: student.surname_lastName,
      course_or_Acadamic: student.course_or_Acadamic,
      month_year_pass: student.month_year_pass,
      batch_year: student.batch_year ?? "",
      grade: student.grade,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setRowError(null);
  }

  function updateEditField(field: EditableField, value: string) {
    setEditForm((f) => (f ? { ...f, [field]: value } : f));
  }

  async function saveEdit(student: Student) {
    if (!editForm) return;
    if (!editForm.roll_no.trim()) {
      setRowError("Roll no. can't be empty.");
      return;
    }
    const payload: StudentUpdatePayload = {};
    for (const field of EDITABLE_FIELDS) {
      if (editForm[field] !== (student[field] ?? "")) {
        payload[field] = editForm[field];
      }
    }
    if (Object.keys(payload).length === 0) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setRowError(null);
    try {
      const updated = await updateStudentAsSuperAdmin(student.roll_no, payload);
      setStudents((prev) =>
        prev.map((s) => (s.student_id === student.student_id ? updated : s))
      );
      cancelEdit();
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't save changes."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(student: Student) {
    setDeletingId(student.student_id);
    setRowError(null);
    try {
      await deleteStudentAsSuperAdmin(student.roll_no);
      setStudents((prev) => prev.filter((s) => s.student_id !== student.student_id));
    } catch (err) {
      setRowError(extractErrorMessage(err, "Couldn't delete this student."));
    } finally {
      setDeletingId(null);
      // Always close the dialog so a failure surfaces in the row error banner.
      setConfirmingDeleteId(null);
    }
  }

  function handleAdded(batchYear: string) {
    if (selectedInstitution) load(selectedInstitution.institution_name);
    // Jump straight to the batch that was just added to.
    setBatchFilter(batchYear);
    setPassYearFilter("");
    setQuery("");
    resetPage();
  }

  const filterInputClass =
    "rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15";

  return (
    <div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this student record?"
        description="This action will permanently remove the student record and its certificate from the system."
        details={[
          { label: "Student", value: pendingDelete?.student_name },
          { label: "Roll no", value: pendingDelete?.roll_no },
          { label: "Certificate no", value: pendingDelete?.certificate_no },
        ]}
        warning={{
          title: "This cannot be undone.",
          description:
            "Once deleted, the student record and its issued certificate will be permanently lost and can no longer be verified.",
        }}
        confirmLabel="Yes, delete"
        loading={deletingId !== null}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        onCancel={() => setConfirmingDeleteId(null)}
      />

      <p className="font-mono text-xs uppercase tracking-wider text-rose-600">
        {students.length} on record
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Student Records
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Pick an institution to browse, edit, or add to its student roster.
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

      {selectedInstitution && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="search"
                  placeholder="Roll no., certificate no., or name"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPage();
                  }}
                  className={`${filterInputClass} w-64 pl-9`}
                />
              </label>
              <select
                value={batchFilter}
                onChange={(e) => {
                  setBatchFilter(e.target.value);
                  resetPage();
                }}
                className={filterInputClass}
                aria-label="Filter by batch year"
              >
                <option value="">All batch years</option>
                {batchYears.map((y) => (
                  <option key={y} value={y}>
                    Batch {y}
                  </option>
                ))}
              </select>
              <select
                value={passYearFilter}
                onChange={(e) => {
                  setPassYearFilter(e.target.value);
                  resetPage();
                }}
                className={filterInputClass}
                aria-label="Filter by pass-out year"
              >
                <option value="">All pass-out years</option>
                {passYears.map((y) => (
                  <option key={y} value={y}>
                    Passed {y}
                  </option>
                ))}
              </select>
              {hasFilters && (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
              {hasFilters && !loading && (
                <span className="text-xs text-ink-400">
                  {filtered.length} of {students.length} shown
                </span>
              )}
            </div>
            <Button
              type="button"
              variant={addOpen ? "secondary" : "primary"}
              onClick={() => setAddOpen((o) => !o)}
            >
              <UserPlus size={16} />
              Add students to a batch
              <ChevronDown
                size={14}
                className={`transition-transform ${addOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {addOpen && (
            <AddToBatchPanel
              institutionId={selectedInstitution.institution_id}
              batchYears={batchYears}
              onClose={() => setAddOpen(false)}
              onAdded={handleAdded}
            />
          )}

          <BulkUpdateBar bulk={bulk} />

          <div className="mt-4">
            {error && <Alert tone="error">{error}</Alert>}
            {rowError && (
              <div className="mb-4">
                <Alert tone="error">{rowError}</Alert>
              </div>
            )}
            {certificate.error && (
              <div className="mb-4">
                <Alert tone="error">{certificate.error}</Alert>
              </div>
            )}
            {certificate.success && (
              <div className="mb-4">
                <Alert tone="success">{certificate.success}</Alert>
              </div>
            )}
            {bulk.error && (
              <div className="mb-4">
                <Alert tone="error">{bulk.error}</Alert>
              </div>
            )}
            {bulk.success && (
              <div className="mb-4">
                <Alert tone="success">{bulk.success}</Alert>
              </div>
            )}
            {loading && <PageSpinner />}
            {!loading && !error && (
              <div className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-left text-sm">
                    <thead>
                      <tr className="ledger-row bg-mint-50 text-xs uppercase tracking-wide text-ink-400">
                        <th className="w-10 px-4 py-3 font-medium">
                          <input
                            type="checkbox"
                            aria-label="Select all on this page"
                            checked={bulk.allVisibleSelected(visible)}
                            onChange={() => bulk.toggleAll(visible)}
                            className={rowCheckboxClass}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">Certificate no.</th>
                        <th className="px-4 py-3 font-medium">Roll no.</th>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Surname</th>
                        <th className="px-4 py-3 font-medium">Course</th>
                        <th className="px-4 py-3 font-medium">Batch year</th>
                        <th className="px-4 py-3 font-medium">Pass month/year</th>
                        <th className="px-4 py-3 font-medium">Grade</th>
                        <th className="px-4 py-3 font-medium">Certificate</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((student) => {
                        const isEditing = editingId === student.student_id;
                        return (
                          <tr key={student.student_id} className="ledger-row last:border-0 align-top">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                aria-label={`Select ${student.student_name}`}
                                checked={bulk.isSelected(student.student_id)}
                                onChange={() => bulk.toggle(student.student_id)}
                                className={rowCheckboxClass}
                              />
                            </td>
                            {isEditing && editForm ? (
                              <>
                                <td className="px-4 py-2">
                                  <input
                                    className={cellInputClass() + " font-mono"}
                                    value={editForm.certificate_no}
                                    onChange={(e) => updateEditField("certificate_no", e.target.value)}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    className={cellInputClass() + " font-mono"}
                                    value={editForm.roll_no}
                                    onChange={(e) =>
                                      updateEditField("roll_no", e.target.value)
                                    }
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    className={cellInputClass()}
                                    value={editForm.student_name}
                                    onChange={(e) => updateEditField("student_name", e.target.value)}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    className={cellInputClass()}
                                    value={editForm.surname_lastName}
                                    onChange={(e) =>
                                      updateEditField("surname_lastName", e.target.value)
                                    }
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    className={cellInputClass()}
                                    value={editForm.course_or_Acadamic}
                                    onChange={(e) =>
                                      updateEditField("course_or_Acadamic", e.target.value)
                                    }
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    className={cellInputClass()}
                                    value={editForm.batch_year}
                                    onChange={(e) => updateEditField("batch_year", e.target.value)}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    className={cellInputClass()}
                                    value={editForm.month_year_pass}
                                    onChange={(e) =>
                                      updateEditField("month_year_pass", e.target.value)
                                    }
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    className={cellInputClass()}
                                    value={editForm.grade}
                                    onChange={(e) => updateEditField("grade", e.target.value)}
                                  />
                                </td>
                                <td className="px-4 py-3 text-ink-400">
                                  <CertificateCell
                                    editing
                                    student={student}
                                    uploading={certificate.uploadingId === student.student_id}
                                    onReplace={certificate.replace}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => saveEdit(student)}
                                      disabled={saving}
                                      aria-label="Save changes"
                                      className="text-pine-700 hover:text-pine-900 disabled:opacity-50"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      disabled={saving}
                                      aria-label="Cancel editing"
                                      className="text-ink-400 hover:text-rose-600 disabled:opacity-50"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 font-mono text-xs text-ink-700">
                                  {student.certificate_no || "—"}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-ink-700">
                                  {student.roll_no}
                                </td>
                                <td className="px-4 py-3 text-ink-900">{student.student_name}</td>
                                <td className="px-4 py-3 text-ink-700">
                                  {student.surname_lastName || "—"}
                                </td>
                                <td className="px-4 py-3 text-ink-700">
                                  {student.course_or_Acadamic}
                                </td>
                                <td className="px-4 py-3 text-ink-700">{student.batch_year || "—"}</td>
                                <td className="px-4 py-3 text-ink-700">{student.month_year_pass}</td>
                                <td className="px-4 py-3 text-ink-700">{student.grade || "—"}</td>
                                <td className="px-4 py-3">
                                  <CertificateCell
                                    student={student}
                                    uploading={certificate.uploadingId === student.student_id}
                                    onReplace={certificate.replace}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(student)}
                                      aria-label="Edit student"
                                      className="text-ink-400 hover:text-pine-800"
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmingDeleteId(student.student_id)}
                                      aria-label="Delete student"
                                      className="text-ink-400 hover:text-rose-600"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={11} className="px-5 py-10 text-center text-ink-400">
                            {hasFilters
                              ? "No students match the current filters."
                              : "No students uploaded yet."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 0 && (
                  <div className="border-t border-line">
                    <TablePager
                      page={currentPage}
                      pageSize={pageSize}
                      total={filtered.length}
                      onPageChange={setPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size);
                        resetPage();
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Upload a roster into a chosen batch year — e.g. a student from the 2025
 * batch who cleared their backlog in 2026 still belongs to batch 2025.
 */
function AddToBatchPanel({
  institutionId,
  batchYears,
  onClose,
  onAdded,
}: {
  institutionId: string;
  batchYears: string[];
  onClose: () => void;
  onAdded: (batchYear: string) => void;
}) {
  const [batchChoice, setBatchChoice] = useState(batchYears[0] ?? CUSTOM_BATCH);
  const [customBatch, setCustomBatch] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<StudentUploadResponse | null>(null);

  const isCustom = batchChoice === CUSTOM_BATCH;
  const batchYear = (isCustom ? customBatch : batchChoice).trim();

  function addCertificates(files: FileList) {
    const incoming = Array.from(files);
    const matched = incoming.filter(isCertificateFile);
    setSkippedCount(incoming.length - matched.length);
    setCertificates((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...matched.filter((f) => !existing.has(f.name))];
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!batchYear) {
      setError("Choose or enter a batch year.");
      return;
    }
    if (!excelFile) {
      setError("Choose an .xlsx file with the student details.");
      return;
    }
    if (certificates.length === 0) {
      setError("Attach the certificates (PDF/JPG files or a .zip) — the roster can't be uploaded without them.");
      return;
    }
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const data = await uploadStudentsAsSuperAdmin(excelFile, certificates, batchYear, institutionId);
      setResult(data);
      setExcelFile(null);
      setCertificates([]);
      if (data.inserted_count > 0) onAdded(batchYear);
    } catch (err) {
      setError(extractErrorMessage(err, "Upload failed. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-lg border border-pine-600/30 bg-mint-50/60 p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-ink-900">Add students to a batch</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-400">
            Use this for late additions — a student who cleared a backlog this
            year but belongs to an earlier batch. Pick their batch year, then
            upload an .xlsx with their details (one row per student) and
            optional certificates.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-400 hover:text-ink-700"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Batch year"
          name="batch_choice"
          value={batchChoice}
          onChange={(e) => setBatchChoice(e.target.value)}
          options={[
            ...batchYears.map((y) => ({ value: y, label: `Batch ${y}` })),
            { value: CUSTOM_BATCH, label: "Custom year…" },
          ]}
          hint={isCustom ? undefined : "Existing batches from this roster."}
        />
        {isCustom && (
          <Field
            label="Custom batch year"
            name="custom_batch_year"
            placeholder="e.g. 2025"
            value={customBatch}
            onChange={(e) => setCustomBatch(e.target.value)}
            autoFocus
            required
          />
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <DropZone
          label="Student details (.xlsx)"
          hint={excelFile ? excelFile.name : "Click or drop a file"}
          icon={FileSpreadsheet}
          accept=".xlsx"
          onFiles={(files) => setExcelFile(files[0])}
        />
        <DropZone
          label="Certificates"
          hint="Required — PDF, JPG, or a .zip of them"
          icon={FileText}
          accept=".pdf,.jpg,.jpeg,.zip"
          multiple
          onFiles={addCertificates}
        />
      </div>

      {skippedCount > 0 && (
        <p className="mt-2 text-xs text-amber-600">
          Skipped {skippedCount} file{skippedCount === 1 ? "" : "s"} that weren't
          PDF, JPG, or a zip.
        </p>
      )}

      {certificates.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {certificates.map((file) => (
            <li
              key={file.name}
              className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-1.5 text-xs text-ink-700"
            >
              {isZipFile(file) ? (
                <FileArchive size={13} className="text-pine-700" />
              ) : (
                <FileText size={13} className="text-pine-700" />
              )}
              {file.name}
              <button
                type="button"
                onClick={() =>
                  setCertificates((prev) => prev.filter((f) => f.name !== file.name))
                }
                className="text-ink-400 hover:text-rose-600"
                aria-label={`Remove ${file.name}`}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" loading={submitting}>
          <UploadCloud size={16} />
          Add to batch {batchYear || "…"}
        </Button>
        {result && (
          <span className="text-sm text-ink-700">
            <span className="font-medium text-pine-800">{result.inserted_count} added</span>
            {result.errors.length > 0 && (
              <>
                {" · "}
                <span className="text-amber-600">{result.errors.length} skipped</span>
              </>
            )}
            {result.unmatched_certificates.length > 0 && (
              <>
                {" · "}
                <span className="text-amber-600">
                  {result.unmatched_certificates.length} unmatched certificate
                  {result.unmatched_certificates.length === 1 ? "" : "s"}
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {result && (result.errors.length > 0 || result.unmatched_certificates.length > 0) && (

        <UploadResults result={{ ...result, students: [] }} compact />

      )}
    </form>
  );
}

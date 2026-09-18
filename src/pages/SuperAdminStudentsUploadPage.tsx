import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FileSpreadsheet, FileText, FileArchive, X, UploadCloud } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Field } from "../components/ui/Field";
import { SelectField } from "../components/ui/SelectField";
import { DropZone, isCertificateFile, isZipFile } from "../components/ui/DropZone";
import { TablePager } from "../components/ui/TablePager";
import type { PageSize } from "../components/ui/TablePager";
import { getAllInstitutionsAsSuperAdmin, uploadStudentsAsSuperAdmin } from "../lib/superadmin";
import { extractErrorMessage } from "../lib/api";
import type { Institution, StudentUploadResponse } from "../types";

/** Current calendar year in Indian Standard Time, regardless of the browser's timezone. */
function currentIndianYear() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).format(new Date());
}

export default function SuperAdminStudentsUploadPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState("");

  const [batchYear, setBatchYear] = useState(currentIndianYear());
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<StudentUploadResponse | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);

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

  function addCertificates(files: FileList) {
    const incoming = Array.from(files);
    const matched = incoming.filter(isCertificateFile);
    setSkippedCount(incoming.length - matched.length);
    setCertificates((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const deduped = matched.filter((f) => !existingNames.has(f.name));
      return [...prev, ...deduped];
    });
  }

  function removeCertificate(name: string) {
    setCertificates((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!institutionId) {
      setError("Choose the target institution.");
      return;
    }
    if (!batchYear.trim()) {
      setError("Enter a batch year.");
      return;
    }
    if (!excelFile) {
      setError("Choose an .xlsx roster to upload.");
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
    } catch (err) {
      setError(extractErrorMessage(err, "Upload failed. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-wider text-rose-600">
        Roster upload
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Upload students
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-400">
        Upload an .xlsx roster for any institution, and optionally attach
        certificates — PDF or JPG files named after each roll number, or a
        single .zip archive containing all of them.
      </p>

      {institutionsError && (
        <div className="mt-4">
          <Alert tone="error">{institutionsError}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2 sm:max-w-xl">
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
            required
          />
          <Field
            label="Batch year"
            name="batch_year"
            required
            value={batchYear}
            onChange={(e) => setBatchYear(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <DropZone
              label="Student roster (.xlsx)"
              hint={excelFile ? excelFile.name : "Click or drop a file"}
              icon={FileSpreadsheet}
              accept=".xlsx"
              onFiles={(files) => setExcelFile(files[0])}
            />
          </div>
          <div>
            <DropZone
              label="Certificates"
              hint="PDF, JPG, or a .zip of them"
              icon={FileText}
              accept=".pdf,.jpg,.jpeg,.zip"
              multiple
              onFiles={addCertificates}
            />
          </div>
        </div>

        {skippedCount > 0 && (
          <p className="-mt-2 text-xs text-amber-600">
            Skipped {skippedCount} file{skippedCount === 1 ? "" : "s"} that
            weren't PDF, JPG, or a zip.
          </p>
        )}

        {certificates.length > 0 && (
          <ul className="flex flex-wrap gap-2">
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
                  onClick={() => removeCertificate(file.name)}
                  className="text-ink-400 hover:text-rose-600"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div>
          <Button type="submit" loading={submitting} disabled={institutions.length === 0}>
            <UploadCloud size={16} />
            Upload roster
          </Button>
        </div>
      </form>

      {result && <UploadResults result={result} />}
    </div>
  );
}

function UploadResults({ result }: { result: StudentUploadResponse }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  const pageCount = Math.max(1, Math.ceil(result.students.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleStudents = useMemo(
    () => result.students.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [result.students, currentPage, pageSize]
  );

  function changePageSize(size: PageSize) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="mt-10 flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <StatCard label="Inserted" value={result.inserted_count} tone="success" />
        <StatCard label="Skipped rows" value={result.errors.length} tone={result.errors.length ? "warning" : "success"} />
        <StatCard
          label="Unmatched certificates"
          value={result.unmatched_certificates.length}
          tone={result.unmatched_certificates.length ? "warning" : "success"}
        />
      </div>

      {result.students.length > 0 && (
        <div>
          <h2 className="text-base font-medium text-ink-900">
            Inserted students{" "}
            <span className="font-normal text-ink-400">({result.students.length})</span>
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="ledger-row bg-mint-50 text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3 font-medium">Roll no.</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Pass month/year</th>
                    <th className="px-4 py-3 font-medium">Batch year</th>
                    <th className="px-4 py-3 font-medium">Grade</th>
                    <th className="px-4 py-3 font-medium">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.map((s) => (
                    <tr key={s.student_id} className="ledger-row last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-ink-700">
                        {s.roll_no_certificate_no}
                      </td>
                      <td className="px-4 py-3 text-ink-900">
                        {s.student_name} {s.surname_lastName}
                      </td>
                      <td className="px-4 py-3 text-ink-700">{s.course_or_Acadamic}</td>
                      <td className="px-4 py-3 text-ink-700">{s.month_year_pass}</td>
                      <td className="px-4 py-3 text-ink-700">{s.batch_year || "—"}</td>
                      <td className="px-4 py-3 text-ink-700">{s.grade || "—"}</td>
                      <td className="px-4 py-3">
                        {s.certificate_url ? (
                          <a
                            href={s.certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-pine-800 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line">
              <TablePager
                page={currentPage}
                pageSize={pageSize}
                total={result.students.length}
                onPageChange={setPage}
                onPageSizeChange={changePageSize}
              />
            </div>
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <div>
          <h2 className="text-base font-medium text-ink-900">Skipped rows</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
            <ul>
              {result.errors.map((err, i) => (
                <li
                  key={i}
                  className="ledger-row flex gap-3 px-4 py-3 text-sm last:border-0"
                >
                  <span className="font-mono text-xs text-ink-400">
                    Row {err.row}
                  </span>
                  <span className="text-ink-700">{err.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result.unmatched_certificates.length > 0 && (
        <div>
          <h2 className="text-base font-medium text-ink-900">
            Unmatched certificate files
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            No roster row matched these filenames — nothing was uploaded to S3.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.unmatched_certificates.map((name) => (
              <li
                key={name}
                className="rounded-md border border-amber-600/30 bg-amber-100 px-3 py-1.5 text-xs text-amber-600"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning";
}) {
  return (
    <div className="min-w-[140px] flex-1 rounded-lg border border-line bg-white px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p
        className={`mt-1 font-display text-3xl ${
          tone === "success" ? "text-pine-800" : "text-amber-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

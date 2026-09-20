import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FileSpreadsheet, FileText, FileArchive, X, UploadCloud, UserPlus } from "lucide-react";
import { SegmentedTab, SegmentedTabs } from "../components/ui/SegmentedTabs";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Field } from "../components/ui/Field";
import { SelectField } from "../components/ui/SelectField";
import { DropZone, isCertificateFile, isZipFile } from "../components/ui/DropZone";
import {
  addStudentAsSuperAdmin,
  getAllInstitutionsAsSuperAdmin,
  uploadStudentsAsSuperAdmin,
} from "../lib/superadmin";
import { AddSingleStudentForm } from "../components/AddSingleStudentForm";
import { extractErrorMessage } from "../lib/api";
import { UploadResults } from "../components/UploadResults";
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

  const [mode, setMode] = useState<"bulk" | "single">("bulk");
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
        {mode === "bulk"
          ? "Upload an .xlsx roster for any institution, and optionally attach certificates — PDF or JPG files named after each roll number, or a single .zip archive containing all of them."
          : "Enter one student's details and attach their certificate. The certificate file must be named after the roll number or certificate number."}
      </p>

      {institutionsError && (
        <div className="mt-4">
          <Alert tone="error">{institutionsError}</Alert>
        </div>
      )}

      <div className="mt-6">
        <SegmentedTabs>
          <SegmentedTab active={mode === "bulk"} onClick={() => setMode("bulk")} icon={FileSpreadsheet}>
            Upload roster
          </SegmentedTab>
          <SegmentedTab active={mode === "single"} onClick={() => setMode("single")} icon={UserPlus}>
            Add student
          </SegmentedTab>
        </SegmentedTabs>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:max-w-xl">
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

      {mode === "single" && (
        <div className="mt-6">
          <AddSingleStudentForm
            institutionId={institutionId}
            batchYear={batchYear}
            disabled={institutions.length === 0}
            onSubmit={addStudentAsSuperAdmin}
          />
        </div>
      )}

      {mode === "bulk" && (
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {error && <Alert tone="error">{error}</Alert>}

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
              hint="Required — PDF, JPG, or a .zip of them"
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
      )}

      {mode === "bulk" && result && <UploadResults result={result} />}
    </div>
  );
}

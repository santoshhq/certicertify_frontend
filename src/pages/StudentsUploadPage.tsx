import { useState } from "react";
import type { FormEvent } from "react";
import { FileSpreadsheet, FileText, FileArchive, X, UploadCloud, UserPlus } from "lucide-react";
import { SegmentedTab, SegmentedTabs } from "../components/ui/SegmentedTabs";
import { AddSingleStudentForm } from "../components/AddSingleStudentForm";
import { BatchYearField, currentIndianYear } from "../components/BatchYearField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { DropZone, isCertificateFile, isZipFile } from "../components/ui/DropZone";
import { addStudent, uploadStudents } from "../lib/students";
import { extractErrorMessage } from "../lib/api";
import { UploadResults } from "../components/UploadResults";
import type { StudentUploadResponse } from "../types";

export default function StudentsUploadPage() {
  const [mode, setMode] = useState<"bulk" | "single">("bulk");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  // Defaults to the current IST year; the pencil unlocks it for a custom year.
  const [batchYear, setBatchYear] = useState(currentIndianYear());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<StudentUploadResponse | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);

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
      const data = await uploadStudents(excelFile, certificates, batchYear);
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
      <p className="font-mono text-xs uppercase tracking-wider text-pine-600">
        Roster upload
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pine-950">
        Add Student Records
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-400">
        {mode === "bulk"
          ? 'Upload an .xlsx roster with your students, and optionally attach certificates — PDF or JPG files named after each roll number (e.g. "ABC101.pdf" matches roll number ABC101), or a single .zip archive containing all of them. Zips are unpacked on the server automatically.'
          : "Enter one student's details and attach their certificate. The certificate file must be named after the roll number or certificate number."}
      </p>

      <div className="mt-6">
        <SegmentedTabs>
          <SegmentedTab active={mode === "bulk"} onClick={() => {
            setMode("bulk");
            setBatchYear(currentIndianYear());
          }} icon={FileSpreadsheet}>
            Upload roster
          </SegmentedTab>
          <SegmentedTab active={mode === "single"} onClick={() => setMode("single")} icon={UserPlus}>
            Add student
          </SegmentedTab>
        </SegmentedTabs>
      </div>

      <div className="mt-6 max-w-xs">
        <BatchYearField
          value={batchYear}
          onChange={setBatchYear}
          editable={mode === "single"}
        />
      </div>

      {mode === "single" && (
        <div className="mt-6">
          <AddSingleStudentForm batchYear={batchYear} onSubmit={addStudent} />
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
          <Button type="submit" loading={submitting}>
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

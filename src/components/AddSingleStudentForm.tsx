import { useState } from "react";
import type { FormEvent } from "react";
import { FileText, UserPlus, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Field } from "./ui/Field";
import { DropZone, isCertificateFile } from "./ui/DropZone";
import { extractErrorMessage } from "../lib/api";
import { batchYearError, maxPassOut, toStoredPassOut } from "../lib/passOut";
import type { PassOutPrecision } from "../lib/passOut";
import type { SingleStudentPayload } from "../lib/students";
import type { Student } from "../types";

type Details = Omit<SingleStudentPayload, "institution_id" | "batch_year">;

const emptyDetails: Details = {
  certificate_no: "",
  roll_no: "",
  student_name: "",
  surname_lastName: "",
  course_or_Acadamic: "",
  month_year_pass: "",
  grade: "",
};

/** Same canonical form the backend uses for roll/certificate numbers. */
function normalizeKey(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

function fileStem(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

export function AddSingleStudentForm({
  institutionId,
  batchYear,
  disabled,
  onSubmit,
  onAdded,
}: {
  /** Omit for institution accounts — the backend scopes to their own institution. */
  institutionId?: string;
  batchYear: string;
  disabled?: boolean;
  onSubmit: (payload: SingleStudentPayload, certificate: File) => Promise<Student>;
  onAdded?: (student: Student) => void;
}) {
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [passOutPrecision, setPassOutPrecision] = useState<PassOutPrecision>("month");
  const [certificate, setCertificate] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState<Student | null>(null);

  function update<K extends keyof Details>(key: K, value: string) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  const rollKey = normalizeKey(details.roll_no);
  const certKey = normalizeKey(details.certificate_no);
  const certificateStem = certificate ? normalizeKey(fileStem(certificate.name)) : "";
  const certificateMatches =
    Boolean(certificate) && (certificateStem === rollKey || certificateStem === certKey);

  function pickCertificate(files: FileList) {
    const file = files[0];
    if (!file) return;
    if (!isCertificateFile(file)) {
      setError("Certificate must be a PDF or JPG file.");
      return;
    }
    setError(null);
    setCertificate(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAdded(null);
    if (institutionId === "") {
      setError("Choose the target institution.");
      return;
    }
    const batchInvalid = batchYear.trim() ? batchYearError(batchYear) : "Enter a batch year.";
    if (batchInvalid) {
      setError(batchInvalid);
      return;
    }
    if (details.month_year_pass && details.month_year_pass > maxPassOut(passOutPrecision)) {
      setError("Pass-out date can't be in the future.");
      return;
    }
    if (!certificate) {
      setError("Attach the student's certificate (PDF or JPG).");
      return;
    }
    if (!certificateMatches) {
      setError(
        `The certificate file must be named after the roll number (${rollKey || "…"}) or certificate number (${certKey || "…"}).`
      );
      return;
    }
    setSubmitting(true);
    try {
      const student = await onSubmit(
        {
          ...details,
          month_year_pass: toStoredPassOut(details.month_year_pass, passOutPrecision),
          ...(institutionId ? { institution_id: institutionId } : {}),
          batch_year: batchYear.trim(),
        },
        certificate
      );
      setAdded(student);
      setDetails(emptyDetails);
      setCertificate(null);
      onAdded?.(student);
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't add the student. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <Alert tone="error">{error}</Alert>}
      {added && (
        <Alert tone="success">
          Added {added.student_name} ({added.roll_no}) to batch {added.batch_year}. Certificate ID{" "}
          <span className="font-mono">{added.certificate_id}</span>.
        </Alert>
      )}

      <fieldset disabled={disabled || submitting} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Certificate number"
            name="certificate_no"
            required
            value={details.certificate_no}
            onChange={(e) => update("certificate_no", e.target.value)}
            className="font-mono"
          />
          <Field
            label="Roll number"
            name="roll_no"
            required
            value={details.roll_no}
            onChange={(e) => update("roll_no", e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Student name"
            name="student_name"
            required
            value={details.student_name}
            onChange={(e) => update("student_name", e.target.value)}
          />
          <Field
            label="Surname / last name"
            name="surname_lastName"
            required
            value={details.surname_lastName}
            onChange={(e) => update("surname_lastName", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Course / academic"
            name="course_or_Acadamic"
            required
            value={details.course_or_Acadamic}
            onChange={(e) => update("course_or_Acadamic", e.target.value)}
          />
          <div>
            <Field
              label={passOutPrecision === "month" ? "Pass-out month & year" : "Pass-out date"}
              name="month_year_pass"
              type={passOutPrecision === "month" ? "month" : "date"}
              max={maxPassOut(passOutPrecision)}
              required
              value={details.month_year_pass}
              onChange={(e) => update("month_year_pass", e.target.value)}
            />
            <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-400">
              <span>Saved as {passOutPrecision === "month" ? "MM-YYYY" : "DD-MM-YYYY"}</span>
              <button
                type="button"
                onClick={() => {
                  setPassOutPrecision((p) => (p === "month" ? "date" : "month"));
                  update("month_year_pass", "");
                }}
                className="font-medium text-pine-800 underline-offset-2 hover:underline"
              >
                {passOutPrecision === "month" ? "Use exact date instead" : "Use month & year instead"}
              </button>
            </div>
          </div>
          <Field
            label="Grade"
            name="grade"
            required
            value={details.grade}
            onChange={(e) => update("grade", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <DropZone
              label="Certificate (PDF or JPG)"
              hint={certificate ? certificate.name : "Click or drop one file"}
              icon={FileText}
              accept=".pdf,.jpg,.jpeg"
              onFiles={pickCertificate}
            />
            <p className="mt-1.5 text-xs text-ink-400">
              Name the file after the roll number or certificate number, e.g.{" "}
              <span className="font-mono">{rollKey || "22R21A0525"}.pdf</span>
            </p>
          </div>
          {certificate && (
            <div className="flex items-start gap-2 self-end rounded-md border border-line bg-white px-3 py-2 text-xs">
              <FileText size={14} className="mt-0.5 shrink-0 text-pine-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{certificate.name}</p>
                <p className={certificateMatches ? "text-pine-800" : "text-amber-600"}>
                  {certificateMatches
                    ? "Filename matches this student."
                    : "Filename doesn't match the roll number or certificate number yet."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCertificate(null)}
                aria-label="Remove certificate"
                className="text-ink-400 hover:text-rose-600"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      </fieldset>

      <div>
        <Button type="submit" loading={submitting} disabled={disabled}>
          <UserPlus size={16} />
          Add student
        </Button>
      </div>
    </form>
  );
}

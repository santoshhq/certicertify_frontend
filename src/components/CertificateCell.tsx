import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { extractErrorMessage } from "../lib/api";
import { FrozenControl } from "./FrozenControl";
import type { Student } from "../types";

const REPLACEABLE_EXTENSIONS = [".pdf", ".jpg", ".jpeg"];

/**
 * Shared "replace this student's certificate" state for the superadmin,
 * admin and institution rosters. `replaceFn` targets the student by
 * student_id, so a roll number shared across batches can't hit the wrong row.
 */
export function useCertificateReplace(
  setStudents: Dispatch<SetStateAction<Student[]>>,
  replaceFn: (studentId: string, file: File) => Promise<Student>
) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function replace(student: Student, file: File) {
    setSuccess(null);
    setError(null);

    const name = file.name.toLowerCase();
    if (!REPLACEABLE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setError("Certificate must be a PDF or JPG file.");
      return;
    }
    const fileNameWithoutExtension = file.name.replace(/\.[^.]+$/, "");
    if (
      fileNameWithoutExtension.trim().toLowerCase() !==
      student.roll_no.trim().toLowerCase()
    ) {
      setError(`Certificate filename must match roll number ${student.roll_no}.`);
      return;
    }

    setUploadingId(student.student_id);
    try {
      const updated = await replaceFn(student.student_id, file);
      setStudents((prev) =>
        prev.map((s) => (s.student_id === student.student_id ? updated : s))
      );
      setSuccess(`Certificate replaced successfully for ${student.roll_no}.`);
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't replace the certificate."));
    } finally {
      setUploadingId(null);
    }
  }

  return { uploadingId, error, success, replace };
}

/**
 * "View" link; while the row is being edited (pencil clicked) it also shows a
 * Replace/Upload file picker (or a lock when not allowed).
 */
export function CertificateCell({
  student,
  uploading,
  onReplace,
  editing = false,
  canReplace = true,
}: {
  student: Student;
  uploading: boolean;
  onReplace: (student: Student, file: File) => void;
  editing?: boolean;
  canReplace?: boolean;
}) {
  const inputId = `certificate-upload-${student.student_id}`;

  if (!editing) {
    return student.certificate_url ? (
      <a
        href={student.certificate_url}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-pine-800 hover:underline"
      >
        View
      </a>
    ) : (
      <span className="text-ink-400">—</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {student.certificate_url ? (
        <a
          href={student.certificate_url}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-pine-800 hover:underline"
        >
          View
        </a>
      ) : (
        !canReplace && <span className="text-ink-400">—</span>
      )}
      <FrozenControl allowed={canReplace} label="Replace certificate">
        <label
          htmlFor={inputId}
          title="Upload a new PDF/JPG named after the roll number. The old certificate is deleted."
          className={`cursor-pointer text-xs font-medium text-pine-800 hover:underline ${
            uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? "Uploading..." : student.certificate_url ? "Replace" : "Upload"}
          <input
            id={inputId}
            type="file"
            accept=".pdf,.jpg,.jpeg"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onReplace(student, file);
              event.target.value = "";
            }}
          />
        </label>
      </FrozenControl>
    </div>
  );
}

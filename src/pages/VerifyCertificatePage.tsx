import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FileX,
  ShieldX,
  ExternalLink,
  Check,
  Building2,
  GraduationCap,
  FileCheck,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { UserMenu } from "../components/UserMenu";
import { getStudent } from "../lib/students";
import { extractErrorMessage } from "../lib/api";
import type { Student } from "../types";

function certificateKind(url: string): "pdf" | "image" {
  return url.toLowerCase().split("?")[0].endsWith(".pdf") ? "pdf" : "image";
}

function Detail({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd
        className={`mt-1 text-[15px] font-semibold leading-snug text-ink-900 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

const INCLUDED = [
  { icon: Building2, text: "The institution that issued it" },
  { icon: GraduationCap, text: "Course, batch year, grade and year of passing" },
  { icon: FileCheck, text: "The original certificate file" },
];

export default function VerifyCertificatePage() {
  const [rollNo, setRollNo] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const query = rollNo.trim();
    if (!query) return;

    setError(null);
    setNotFound(false);
    setLoading(true);
    setSearched(true);
    setLastQuery(query);
    try {
      const data = await getStudent(query);
      setStudents(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setStudents([]);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setNotFound(true);
      } else {
        setError(extractErrorMessage(err, "The registry couldn't be reached. Try again in a moment."));
      }
    } finally {
      setLoading(false);
    }
  }

  const showResult = searched && !loading;

  return (
    <div className="flex min-h-svh flex-col bg-paper">
      <section className="relative overflow-hidden bg-pine-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-48 -top-64 h-[560px] w-[560px] rounded-full border-[18px] border-pine-900/70 sm:-right-28 lg:-right-16"
        >
          <div className="absolute inset-[64px] rounded-full border-[14px] border-pine-500/15" />
        </div>

        <header className="relative flex items-center justify-between px-4 py-4 sm:px-8">
          <UserMenu />
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={40} className="bg-white p-0.5" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-lg font-bold">CertiCertify</span>
              <span className="block text-[11px] text-sage-300">Verify the authentications</span>
            </span>
          </Link>
          <span className="w-10" aria-hidden />
        </header>

        <div className="relative mx-auto w-full max-w-3xl px-4 pb-14 pt-10 text-center sm:px-8 sm:pb-20 sm:pt-16">
          <h1 className="font-display text-[32px] font-bold leading-[1.1] text-white sm:text-5xl">
            Is this certificate genuine?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-sage-300">
            Type the roll number or certificate number printed on it. We check
            it against the record the institution published.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] sm:flex-row sm:rounded-full"
          >
            <label className="relative flex-1">
              <span className="sr-only">Roll number or certificate number</span>
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="Roll number or Certificate number"
                autoComplete="off"
                className="w-full rounded-xl bg-transparent py-3 pl-11 pr-4 font-mono text-base text-ink-900 outline-none placeholder:font-sans placeholder:text-ink-400 sm:rounded-full"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !rollNo.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#e35f00] px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-[#c85300] disabled:cursor-not-allowed disabled:bg-[#e35f00]/70 sm:rounded-full"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check size={18} strokeWidth={3} />
              )}
              Check
            </button>
          </form>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8 sm:py-12">
        {!searched && (
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-sm text-ink-400">A verified record shows</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {INCLUDED.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 text-sm text-ink-700 sm:flex-col sm:items-start sm:gap-2.5 sm:py-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint-100 text-pine-800">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-pine-700 border-t-transparent" />
            Checking the registry for {lastQuery}
          </div>
        )}

        {showResult && error && (
          <div className="mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-amber-600/40 bg-amber-100 px-5 py-4 text-sm text-ink-900">
            <ShieldX size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Couldn't check right now</p>
              <p className="mt-0.5 text-ink-700">{error}</p>
            </div>
          </div>
        )}

        {showResult && notFound && (
          <div className="mx-auto max-w-xl rounded-2xl border border-rose-600/30 bg-white p-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <ShieldX size={30} strokeWidth={1.75} />
            </span>
            <p className="mt-5 font-display text-2xl font-bold text-rose-600">
              Certificate is not found
            </p>
            <p className="mt-2 text-sm text-ink-700">
              No institution has published a record for{" "}
              <span className="font-mono font-semibold text-ink-900">{lastQuery}</span>.
            </p>
            <p className="mt-4 text-sm text-ink-400">
              Check the number for typos, or ask the institution whether the
              certificate has been registered.
            </p>
          </div>
        )}

        {showResult && students.length > 0 && (
          <div className="space-y-6">
            {students.length > 1 && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-bold text-pine-950">
                    {students.length} matching certificates
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    Select the verified record you want to inspect.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-pine-800">
                  {students.length} results
                </span>
              </div>
            )}

            {students.map((student, index) => {
              const certificateId = student.certificate_id || student.roll_no_certificate_no || "";

              return (
                <article key={`${student.student_id}-${certificateId}`} className="overflow-hidden rounded-2xl border border-line bg-white">
                  {students.length > 1 && (
                    <div className="border-b border-line bg-paper px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-400 sm:px-8">
                      Result {index + 1}
                    </div>
                  )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-mint-50 px-5 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                  <Logo size={48} className="border border-line bg-white p-0.5" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-mint-50 bg-pine-500 text-white">
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                </span>
                <div>
                  <p className="font-display text-lg font-bold leading-tight text-pine-950">
                    Verified by CertiCertify
                  </p>
                  <p className="text-xs text-ink-400">
                    Record published by {student.institution_name}
                  </p>
                </div>
              </div>
              <p className="text-xs text-ink-400">
                Certificate ID: <span className="font-mono font-semibold text-ink-700">{certificateId}</span>
              </p>
            </div>

            <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
              <div>
                <p className="text-xs text-ink-400">Issued to</p>
                <h2 className="mt-1 font-display text-3xl font-bold leading-tight text-pine-950">
                  {`${student.student_name} ${student.surname_lastName}`.trim()}
                </h2>

                <dl className="mt-8 grid gap-x-8 gap-y-6 border-t border-line pt-6 sm:grid-cols-2">
                  <Detail label="Institution" value={student.institution_name} wide />
                  <Detail label="Certificate ID" value={certificateId} mono />
                  <Detail label="Roll / certificate number" value={student.roll_no_certificate_no} mono />
                  <Detail label="Batch year" value={student.batch_year} />
                  <Detail label="Course" value={student.course_or_Acadamic} wide />
                  <Detail label="Passed out" value={student.month_year_pass} />
                  <Detail label="Grade" value={student.grade} />
                </dl>
              </div>

              <div className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-line bg-mint-50 lg:min-h-[480px]">
                {student.certificate_url ? (
                  <>
                    {certificateKind(student.certificate_url) === "pdf" ? (
                      <embed
                        src={student.certificate_url}
                        type="application/pdf"
                        className="h-full min-h-[360px] w-full flex-1 lg:min-h-[420px]"
                      />
                    ) : (
                      <img
                        src={student.certificate_url}
                        alt={`Certificate for ${student.roll_no_certificate_no}`}
                        className="h-full w-full flex-1 object-contain"
                      />
                    )}
                    <a
                      href={student.certificate_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 border-t border-line bg-white px-4 py-3 text-sm font-medium text-pine-800 hover:bg-mint-50"
                    >
                      Open certificate
                      <ExternalLink size={14} />
                    </a>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                    <FileX size={26} className="text-ink-400" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-ink-700">No certificate file attached</p>
                    <p className="text-xs text-ink-400">
                      The record is verified, but the institution didn't upload the document.
                    </p>
                  </div>
                )}
              </div>
            </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="flex flex-col items-center gap-3 px-4 py-8 text-center text-xs text-ink-400 sm:px-8">
        <Logo size={36} />
        <p>
          Records are published directly by the issuing institutions. CertiCertify
          does not create or alter them.
        </p>
      </footer>
    </div>
  );
}

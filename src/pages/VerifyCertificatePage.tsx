import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Search, FileX, ShieldX, Check } from "lucide-react";
import { Logo } from "../components/Logo";
import { CertificateViewer } from "../components/CertificateViewer";
import { UserMenu } from "../components/UserMenu";
import { getStudent } from "../lib/students";
import type { StudentSuggestion } from "../lib/students";
import {
  StudentSuggestionList,
  useStudentSuggestions,
} from "../components/StudentSearchSuggestions";
import { extractErrorMessage } from "../lib/api";
import type { Student } from "../types";

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

export default function VerifyCertificatePage() {
  const [rollNo, setRollNo] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Typeahead
  const [inputFocused, setInputFocused] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { items: suggestions, empty: noMatches } = useStudentSuggestions(
    rollNo,
    inputFocused && !suggestionsDismissed
  );
  const suggestionsOpen = inputFocused && !suggestionsDismissed;
  const showSuggestions = suggestionsOpen && suggestions.length > 0;
  const showNoMatches = suggestionsOpen && noMatches;
  const listboxOpen = showSuggestions || showNoMatches;

  function handleInputChange(value: string) {
    setRollNo(value);
    setSuggestionsDismissed(false);
    setActiveIndex(-1);
  }

  function pickSuggestion(item: StudentSuggestion) {
    const q = rollNo.trim().toUpperCase();
    const identifier =
      item.certificate_no?.toUpperCase().startsWith(q) && !item.roll_no.toUpperCase().startsWith(q)
        ? item.certificate_no
        : item.roll_no;
    setRollNo(identifier);
    setSuggestionsDismissed(true);
    setActiveIndex(-1);
    lookup(identifier);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (listboxOpen) {
        setSuggestionsDismissed(true);
        setActiveIndex(-1);
      }
      return;
    }
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeIndex]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const query = rollNo.trim();
    if (!query) return;
    setSuggestionsDismissed(true);
    await lookup(query);
  }

  async function lookup(query: string) {
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
      {/* Before a search the hero fills the viewport; afterwards it shrinks
          to a banner above the result. */}
      <section
        className={`relative bg-pine-950 text-white ${
          searched ? "" : "flex flex-1 flex-col"
        }`}
      >
        {/* Decorative rings, clipped here (not on the section) so the
            suggestion dropdown can extend below the hero. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-56 -top-72 h-[520px] w-[520px] rounded-full border-[16px] border-pine-900/60 sm:-right-32 sm:h-[560px] sm:w-[560px] sm:border-[18px] lg:-right-16">
            <div className="absolute inset-[64px] rounded-full border-[14px] border-pine-500/10" />
          </div>
        </div>

        <header className="relative z-10 flex items-center justify-between px-4 py-3.5 sm:px-8 sm:py-4">
          <UserMenu />
          <Link
            to="/"
            className="flex items-center gap-3 rounded-full focus-visible:outline-offset-4"
            aria-label="CertiCertify home"
          >
            <Logo
              size={52}
              className="bg-white p-1 shadow-[0_0_0_2px_rgba(255,255,255,0.14),0_6px_18px_-6px_rgba(0,0,0,0.5)]"
            />
            <span className="leading-tight">
              <span className="block font-display text-[19px] font-bold tracking-tight sm:text-[21px]">
                CertiCertify
              </span>
              <span className="mt-0.5 hidden text-[11px] font-medium text-sage-300 sm:block">
                Verify the authentications
              </span>
            </span>
          </Link>
          <span className="w-10" aria-hidden />
        </header>

        <div
          className={`relative z-20 mx-auto w-full max-w-3xl px-4 pb-16 pt-8 text-center sm:px-8 sm:pb-24 sm:pt-14 lg:pt-16 ${
            searched ? "" : "flex flex-1 flex-col justify-center"
          }`}
        >
          <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[52px]">
            Is this certificate genuine?
          </h1>
          <p className="mx-auto mt-4 w-full max-w-lg text-[15px] leading-relaxed text-sage-300 sm:mt-5 sm:text-base">
            Type the roll number or certificate number printed on it. We check
            it against the record the institution published.
          </p>

          <form
            onSubmit={handleSubmit}
            className="relative mx-auto mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/10 transition-shadow focus-within:ring-2 focus-within:ring-pine-500/70 sm:mt-10 sm:flex-row sm:items-center sm:rounded-full"
          >
            <label className="relative flex flex-1 items-center">
              <span className="sr-only">Roll number or certificate number</span>
              <Search
                size={20}
                strokeWidth={2.25}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pine-800"
              />
              <input
                type="text"
                value={rollNo}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Enter roll number or certificate number"
                autoComplete="off"
                spellCheck={false}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={listboxOpen}
                aria-controls="student-suggestions"
                aria-activedescendant={
                  showSuggestions && activeIndex >= 0
                    ? `student-suggestions-${activeIndex}`
                    : undefined
                }
                className="h-12 w-full rounded-xl bg-transparent pl-12 pr-4 font-mono text-base text-ink-900 outline-none placeholder:font-sans placeholder:text-ink-400 sm:h-[52px] sm:rounded-full"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !rollNo.trim()}
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#e35f00] px-7 text-base font-semibold text-white transition-[background-color,transform] hover:bg-[#c85300] active:scale-[0.98] active:bg-[#b34a00] disabled:cursor-not-allowed disabled:bg-[#e35f00]/70 disabled:active:scale-100 sm:h-[52px] sm:rounded-full sm:px-8"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check size={18} strokeWidth={3} />
              )}
              Check
            </button>

            {listboxOpen && (
              <StudentSuggestionList
                items={suggestions}
                noResults={showNoMatches}
                query={rollNo}
                activeIndex={activeIndex}
                listId="student-suggestions"
                onHover={setActiveIndex}
                onPick={pickSuggestion}
                className={`absolute left-0 right-0 top-full z-50 mt-1.5 ${
                  // The result table needs more room than the search box on
                  // tablet/desktop; the empty state stays box-width.
                  showSuggestions
                    ? "md:left-1/2 md:right-auto md:w-[min(56rem,calc(100vw-3rem))] md:-translate-x-1/2"
                    : ""
                }`}
              />
            )}
          </form>

          <p className="mt-4 text-xs text-sage-300/80">
            Matching records appear as you type — pick one to verify it instantly.
          </p>
        </div>
      </section>

      <main
        className={`mx-auto w-full max-w-5xl px-4 sm:px-8 ${
          searched ? "flex-1 py-10 sm:py-12" : ""
        }`}
      >
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
              const certificateId = student.certificate_id || student.roll_no || "";

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
                  <Detail label="Certificate number" value={student.certificate_no} mono />
                  <Detail label="Roll number" value={student.roll_no} mono />
                  <Detail label="Batch year" value={student.batch_year} />
                  <Detail label="Course" value={student.course_or_Acadamic} wide />
                  <Detail label="Passed out" value={student.month_year_pass} />
                  <Detail label="Grade" value={student.grade} />
                </dl>
              </div>

              <div className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-line bg-mint-50 lg:min-h-[480px]">
                {student.certificate_url ? (
                  <CertificateViewer url={student.certificate_url} rollNo={student.roll_no} />
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

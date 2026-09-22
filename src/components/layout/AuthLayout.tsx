import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-pine-950 px-12 py-14 text-mint-50 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #ffffff 0, #ffffff 1px, transparent 1px, transparent 28px)",
          }}
          aria-hidden
        />
        <Link to="/" className="relative flex items-center gap-3">
          <Logo size={52} />
          <span className="font-display text-xl font-bold tracking-tight">
            CertiCertify
          </span>
        </Link>
        <div className="relative max-w-sm">
          <p className="font-display text-3xl font-semibold leading-tight text-white">
            A registry of record for every certificate your institution issues.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-sage-300">
            Upload a roster once, attach the certificate files, and every
            student record carries a verifiable trail back to your
            institution.
          </p>
        </div>
        <p className="relative text-xs text-sage-300/80">
          Registered institutions only. Contact your administrator for access.
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={44} />
            <span className="font-display text-lg font-bold text-pine-950">
              CertiCertify
            </span>
          </Link>
          <h1 className="font-display text-[28px] font-bold leading-tight text-pine-950">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-ink-400">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

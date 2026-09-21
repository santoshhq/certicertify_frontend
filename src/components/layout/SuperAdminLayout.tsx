import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  CalendarClock,
  UploadCloud,
  LogOut,
  Menu,
  UserRound,
  X,
  ShieldAlert,
} from "lucide-react";
import { Logo } from "../Logo";
import { ContactUsLink } from "../ContactUsLink";
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext";

const NAV_ITEMS = [
  { to: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/superadmin/institutions", label: "Institutions", icon: Building2 },
  { to: "/superadmin/admins", label: "Admins", icon: ShieldCheck },
  { to: "/superadmin/students", label: "Previous data Year Wise", icon: CalendarClock },
  { to: "/superadmin/students/upload", label: "Upload Students", icon: UploadCloud },
  { to: "/superadmin/profile", label: "Profile", icon: UserRound },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "border-rose-500 bg-white/10 font-medium text-white"
                : "border-transparent text-sage-300 hover:bg-white/5 hover:text-white"
            )
          }
        >
          <Icon size={17} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
      <ContactUsLink onNavigate={onNavigate} />
    </nav>
  );
}

function LogoutButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600/90",
        className
      )}
    >
      <LogOut size={16} /> Logout
    </button>
  );
}

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { email, profile, logout } = useSuperAdminAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/superadmin-login", { replace: true });
  }


  return (
    <div className="min-h-svh bg-paper lg:grid lg:grid-cols-[268px_1fr]">
      <aside className="hidden flex-col bg-pine-950 py-6 lg:sticky lg:top-0 lg:flex lg:h-svh lg:overflow-y-auto">
        <div className="mb-2 flex items-center gap-3 px-5">
          <Logo size={34} className="bg-white p-1" />
          <span className="font-display text-lg font-bold text-white">
            CertiCertify
          </span>
        </div>
        <div className="mb-4 flex items-center gap-2 px-5 text-rose-400">
          <ShieldAlert size={14} />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Super admin
          </span>
        </div>
        <NavItems />
        <div className="mt-auto px-5 pt-4">
          <div className="border-t border-white/10 pt-4">
            {profile?.fullname && (
              <p className="truncate text-sm font-medium text-white">{profile.fullname}</p>
            )}
            <p className="truncate text-xs text-sage-300">{profile?.email ?? email ?? ""}</p>
          </div>
          <LogoutButton onClick={handleLogout} className="mt-4 w-full" />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="flex w-72 flex-col bg-pine-950 py-6">
            <div className="mb-6 flex items-center justify-between px-5">
              <div className="flex items-center gap-3">
                <Logo size={30} className="bg-white p-1" />
                <span className="font-display text-lg font-bold text-white">
                  CertiCertify
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-sage-300"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto border-t border-white/10 px-5 pt-4">
              <LogoutButton onClick={handleLogout} className="w-full" />
            </div>
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-5 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Logo size={30} />
            <span className="font-display text-base font-bold text-pine-950">
              CertiCertify
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-pine-900"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </header>
        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

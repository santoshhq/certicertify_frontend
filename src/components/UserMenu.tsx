import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CircleUserRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "./ui/ConfirmDialog";

export function UserMenu() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickAway(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  function askLogout() {
    setOpen(false);
    setConfirmingLogout(true);
  }

  function confirmLogout() {
    setConfirmingLogout(false);
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div ref={containerRef} className="relative">
      <ConfirmDialog
        open={confirmingLogout}
        tone="brand"
        icon={<LogOut size={20} />}
        iconPlacement="inline"
        confirmIcon={<LogOut size={15} />}
        title="Are you sure you want to log out?"
        description="You will be signed out of your institution account on this device."
        confirmLabel="Yes, log out"
        cancelLabel="No, stay signed in"
        onConfirm={confirmLogout}
        onCancel={() => setConfirmingLogout(false)}
      />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-pine-900 transition-colors hover:border-pine-600 hover:text-pine-700"
      >
        <CircleUserRound size={22} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-line bg-white py-1.5 shadow-lg">
          {token ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-mint-50 hover:text-pine-900"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button
                type="button"
                onClick={askLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-mint-50 hover:text-pine-900"
              >
                <LogIn size={16} />
                Institution Login
              </Link>
              <Link
                to="/admin-login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-mint-50 hover:text-pine-900"
              >
                <ShieldCheck size={16} />
                Admin Login
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

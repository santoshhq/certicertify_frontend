import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { ADMIN_TOKEN_KEY, setAdminUnauthorizedHandler } from "../lib/api";
import { getAdminMe } from "../lib/admin";
import type { AdminMe, AdminPermissionKey } from "../types";

const LOGIN_ID_KEY = "certicertify_admin_loginId";
const NAME_KEY = "certicertify_admin_name";

interface AdminAuthContextValue {
  token: string | null;
  adminLoginId: string | null;
  adminName: string | null;
  /** null until /admin/me has answered (or failed). */
  me: AdminMe | null;
  permissionsLoading: boolean;
  can: (permission: AdminPermissionKey) => boolean;
  login: (token: string, adminLoginId: string, adminName?: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

function isExpired(token: string) {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
    return stored && !isExpired(stored) ? stored : null;
  });
  const [adminLoginId, setAdminLoginId] = useState<string | null>(() =>
    localStorage.getItem(LOGIN_ID_KEY)
  );
  const [adminName, setAdminName] = useState<string | null>(() =>
    localStorage.getItem(NAME_KEY)
  );
  const [me, setMe] = useState<AdminMe | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(LOGIN_ID_KEY);
    localStorage.removeItem(NAME_KEY);
    setToken(null);
    setAdminLoginId(null);
    setAdminName(null);
    setMe(null);
    setPermissionsLoading(false);
  }, []);

  useEffect(() => {
    setAdminUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setMe(null);
      setPermissionsLoading(false);
      return;
    }
    let cancelled = false;
    setPermissionsLoading(true);
    getAdminMe()
      .then((data) => {
        if (cancelled) return;
        setMe(data);
        if (data.admin_name) setAdminName(data.admin_name);
      })
      .catch(() => {
        // Backend without /admin/me: leave `me` null and let the server's 403s decide.
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setPermissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(
    (newToken: string, newAdminLoginId: string, newAdminName?: string) => {
      const resolvedAdminName = newAdminName?.trim() || newAdminLoginId;
      localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
      localStorage.setItem(LOGIN_ID_KEY, newAdminLoginId);
      localStorage.setItem(NAME_KEY, resolvedAdminName);
      setToken(newToken);
      setAdminLoginId(newAdminLoginId);
      setAdminName(resolvedAdminName);
    },
    []
  );

  const can = useCallback(
    (permission: AdminPermissionKey) => {
      if (!me) return true;
      if (me.access_level === "full") return true;
      return me.permissions?.[permission] === true;
    },
    [me]
  );

  const value = useMemo<AdminAuthContextValue>(
    () => ({ token, adminLoginId, adminName, me, permissionsLoading, can, login, logout }),
    [token, adminLoginId, adminName, me, permissionsLoading, can, login, logout]
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}

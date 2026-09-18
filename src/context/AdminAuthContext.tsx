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

const LOGIN_ID_KEY = "certicertify_admin_loginId";
const NAME_KEY = "certicertify_admin_name";

interface AdminAuthContextValue {
  token: string | null;
  adminLoginId: string | null;
  adminName: string | null;
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

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(LOGIN_ID_KEY);
    localStorage.removeItem(NAME_KEY);
    setToken(null);
    setAdminLoginId(null);
    setAdminName(null);
  }, []);

  useEffect(() => {
    setAdminUnauthorizedHandler(logout);
  }, [logout]);

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

  const value = useMemo<AdminAuthContextValue>(
    () => ({ token, adminLoginId, adminName, login, logout }),
    [token, adminLoginId, adminName, login, logout]
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

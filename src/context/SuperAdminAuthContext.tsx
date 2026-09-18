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
import { SUPERADMIN_TOKEN_KEY, setSuperAdminUnauthorizedHandler } from "../lib/api";

const EMAIL_KEY = "certicertify_superadmin_email";

interface SuperAdminAuthContextValue {
  token: string | null;
  email: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextValue | undefined>(
  undefined
);

function isExpired(token: string) {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(SUPERADMIN_TOKEN_KEY);
    return stored && !isExpired(stored) ? stored : null;
  });
  const [email, setEmail] = useState<string | null>(() =>
    localStorage.getItem(EMAIL_KEY)
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SUPERADMIN_TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setEmail(null);
  }, []);

  useEffect(() => {
    setSuperAdminUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback((newToken: string, newEmail: string) => {
    localStorage.setItem(SUPERADMIN_TOKEN_KEY, newToken);
    localStorage.setItem(EMAIL_KEY, newEmail);
    setToken(newToken);
    setEmail(newEmail);
  }, []);

  const value = useMemo<SuperAdminAuthContextValue>(
    () => ({ token, email, login, logout }),
    [token, email, login, logout]
  );

  return (
    <SuperAdminAuthContext.Provider value={value}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
}

export function useSuperAdminAuth() {
  const ctx = useContext(SuperAdminAuthContext);
  if (!ctx) {
    throw new Error("useSuperAdminAuth must be used within SuperAdminAuthProvider");
  }
  return ctx;
}

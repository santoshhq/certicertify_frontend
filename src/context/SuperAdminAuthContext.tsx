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
import { getSuperAdminProfile } from "../lib/superadmin";
import type { SuperAdminProfile } from "../types";

const EMAIL_KEY = "certicertify_superadmin_email";

interface SuperAdminAuthContextValue {
  token: string | null;
  email: string | null;
  profile: SuperAdminProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
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
  const [profile, setProfile] = useState<SuperAdminProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(SUPERADMIN_TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setEmail(null);
    setProfile(null);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    setSuperAdminUnauthorizedHandler(logout);
  }, [logout]);

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await getSuperAdminProfile();
      setProfile(data);
      if (data.email) setEmail(data.email);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    refreshProfile();
  }, [token, refreshProfile]);

  const login = useCallback((newToken: string, newEmail: string) => {
    localStorage.setItem(SUPERADMIN_TOKEN_KEY, newToken);
    localStorage.setItem(EMAIL_KEY, newEmail);
    setToken(newToken);
    setEmail(newEmail);
  }, []);

  const value = useMemo<SuperAdminAuthContextValue>(
    () => ({ token, email, profile, profileLoading, refreshProfile, login, logout }),
    [token, email, profile, profileLoading, refreshProfile, login, logout]
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

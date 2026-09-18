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
import { TOKEN_KEY, setUnauthorizedHandler } from "../lib/api";
import { getInstitution } from "../lib/institutions";
import type { Institution, JwtPayload } from "../types";

interface AuthContextValue {
  token: string | null;
  institution: Institution | null;
  institutionId: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshInstitution: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeInstitutionId(token: string): string | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    if (payload.exp * 1000 < Date.now()) return null;
    return payload.institution_id;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setInstitution(null);
  }, []);

  const loadInstitution = useCallback(async (activeToken: string) => {
    const institutionId = decodeInstitutionId(activeToken);
    if (!institutionId) {
      logout();
      return;
    }
    try {
      const profile = await getInstitution(institutionId);
      setInstitution(profile);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (token) {
        await loadInstitution(token);
      }
      if (!cancelled) setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (newToken: string) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      await loadInstitution(newToken);
    },
    [loadInstitution]
  );

  const refreshInstitution = useCallback(async () => {
    if (token) await loadInstitution(token);
  }, [token, loadInstitution]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      institution,
      institutionId: institution?.institution_id ?? null,
      loading,
      login,
      logout,
      refreshInstitution,
    }),
    [token, institution, loading, login, logout, refreshInstitution]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

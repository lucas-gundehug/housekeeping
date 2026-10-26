import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setUnauthorizedHandler } from "@/lib/authed-fetch";

// One shared session for the whole app, unlike the old per-route local
// state each page used to keep — that meant navigating between pages lost
// the token even though nothing about the session actually expired.
// Persisted to localStorage (not sessionStorage): "logged in until I log
// out", including across browser restarts, for this
// single-owner tool already gated by a high-entropy passphrase.
const STORAGE_KEY = "hk_auth_token";

// "checking" covers both the server render (no access to the browser's
// localStorage at all) and the initial client render before the effect
// below has had a chance to run — i.e. every render up until we actually
// know one way or the other. Gate components must treat "checking" as
// genuinely unknown, not as unauthenticated, or a valid stored session
// flashes the login box before swapping to the real page a beat later.
export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  authToken: string | null;
  status: AuthStatus;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Tokens are "ok:<expiryMs>.<hmac>" (see src/lib/auth.ts). The client can't
// verify the HMAC (that needs the server secret), but it can and should
// check the expiry before trusting a stored token — otherwise a stale
// token from yesterday's session gets treated as good enough to paint the
// real page, which then gets torn down again a beat later once the first
// API call comes back 401. Checking expiry locally keeps that flash from
// ever happening for the common "session expired overnight" case.
function isTokenUnexpired(token: string): boolean {
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const match = token.slice(0, dot).match(/^ok:(\d+)$/);
  if (!match) return false;
  return Date.now() <= Number(match[1]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isTokenUnexpired(stored)) {
      setAuthToken(stored);
      setStatus("authenticated");
    } else {
      if (stored) window.localStorage.removeItem(STORAGE_KEY);
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback((token: string) => {
    window.localStorage.setItem(STORAGE_KEY, token);
    setAuthToken(token);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ authToken, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

// Every route gates its real content behind this. While status is
// "checking" (server render, and the initial client render before
// AuthProvider's localStorage check has run) we render nothing rather
// than guessing — showing the login box only to swap it for the real
// page a beat later (or vice versa) is the flash this exists to avoid.
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, login } = useAuth();
  if (status === "checking") return null;
  if (status === "unauthenticated") return <LoginGate onUnlock={login} />;
  return <>{children}</>;
}

// The passphrase itself lives only server-side (see src/lib/auth.ts) and is
// verified there — the client never sees or stores it, just a signed token
// (persisted via AuthProvider, see src/lib/auth-context.tsx).
export function LoginGate({ onUnlock }: { onUnlock: (token: string) => void }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!passphrase || checking) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/public/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      }).then((r) => r.json());
      if (res.ok && res.token) {
        onUnlock(res.token);
        return;
      }
      setError(
        res.error === "locked"
          ? "Too many attempts — wait a bit and try again."
          : "Incorrect password, try again.",
      );
    } catch {
      setError("Something went wrong — try again.");
    }
    setPassphrase("");
    setChecking(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm rounded-2xl p-8 text-center">
        <img
          src="/logo.svg"
          alt="Housekeeping"
          className="mx-auto mb-4 h-20 w-20"
        />
        <h1 className="font-sans text-3xl font-bold tracking-tight">
          Housekeeping
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter password to continue
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            autoFocus
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            disabled={checking}
            type="password"
            autoComplete="current-password"
            className={`w-full rounded-md hairline border surface-tint px-3 py-3 text-center text-lg outline-none focus:border-primary/60 ${
              error ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          <button
            type="submit"
            disabled={checking || !passphrase}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? "Checking…" : "Log in"}
          </button>
        </form>
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

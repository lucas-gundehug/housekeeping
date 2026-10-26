import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmChangeDialog } from "@/components/confirm-change-dialog";
import { AuthGate } from "@/components/login-gate";
import { Button } from "@/components/ui/button";
import { changePassphrase } from "@/lib/admin-client";
import { useAuth } from "@/lib/auth-context";
import { changeDashboardCode } from "@/lib/dashboard-client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: Gate,
});

const inputClass =
  "w-full rounded-md hairline border surface-tint px-3 py-2 text-sm outline-none focus:border-primary/60";

function ChangePassphraseCard({ authHeaders }: { authHeaders: HeadersInit }) {
  const { login } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 12) {
      toast("New password must be at least 12 characters");
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setSaving(true);
    const result = await changePassphrase(current, next, authHeaders);
    setSaving(false);
    setConfirmOpen(false);
    if (result.ok) {
      toast("Password changed");
      login(result.token);
      setCurrent("");
      setNext("");
    } else {
      toast(
        result.error === "wrong_passphrase"
          ? "Incorrect current password"
          : result.error === "passphrase_too_short"
            ? "New password is too short (min. 12 characters)"
            : "Couldn't change the password",
      );
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-xl hairline border surface-tint p-4"
      >
        <h2 className="font-medium">Housekeeping login</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The passphrase you use to log in here.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Current password"
            className={inputClass}
            required
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="New password (min. 12 characters)"
            className={inputClass}
            required
          />
        </div>
        <Button type="submit" size="sm" className="mt-2">
          Change password
        </Button>
      </form>
      <ConfirmChangeDialog
        open={confirmOpen}
        title="Change Housekeeping login?"
        description="Your current session here switches to the new password automatically, but you'll need the new password the next time you log in."
        confirming={saving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function ChangeDashboardPinCard({ authHeaders }: { authHeaders: HeadersInit }) {
  const [next, setNext] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(next)) {
      toast("The code must be exactly 4 digits");
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setSaving(true);
    const result = await changeDashboardCode(next, authHeaders);
    setSaving(false);
    setConfirmOpen(false);
    if (result.ok) {
      toast("Dashboard code changed");
      setNext("");
    } else {
      toast(
        result.error === "invalid_code"
          ? "The code must be exactly 4 digits"
          : "Couldn't change the code",
      );
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-xl hairline border surface-tint p-4"
      >
        <h2 className="font-medium">Dashboard access code</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          4-digit login code for your personal dashboard.
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={next}
          onChange={(e) => setNext(e.target.value.replace(/\D/g, ""))}
          placeholder="New 4-digit code"
          className={`${inputClass} mt-3`}
          required
        />
        <Button type="submit" size="sm" className="mt-2">
          Change code
        </Button>
      </form>
      <ConfirmChangeDialog
        open={confirmOpen}
        title="Change the dashboard's access code?"
        description="The old code stops working immediately."
        confirming={saving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function AdminPage({ authHeaders }: { authHeaders: HeadersInit }) {
  return (
    <AppShell active="admin" title="Admin" description="Passwords and codes.">
      <div className="space-y-3">
        <ChangePassphraseCard authHeaders={authHeaders} />
        <ChangeDashboardPinCard authHeaders={authHeaders} />
      </div>
    </AppShell>
  );
}

function Gate() {
  const { authToken } = useAuth();
  return (
    <AuthGate>
      <AdminPage authHeaders={{ Authorization: `Bearer ${authToken}` }} />
    </AuthGate>
  );
}

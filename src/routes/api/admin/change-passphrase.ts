import { createFileRoute } from "@tanstack/react-router";
import {
  buildAuthToken,
  checkPassphrase,
  isAuthedToken,
  setPassphrase,
  tokenFromRequest,
} from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-log";
import {
  clearAttempts,
  clientKeyFromRequest,
  isLockedOut,
  recordFailedAttempt,
} from "@/lib/login-rate-limit";

// A real high-entropy passphrase, not a short password — same framing as
// the existing HOUSEKEEPING_PASSPHRASE itself.
const MIN_PASSPHRASE_LENGTH = 12;

export const Route = createFileRoute("/api/admin/change-passphrase")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAuthedToken(tokenFromRequest(request)))) {
          return Response.json(
            { ok: false, error: "unauthorized" },
            { status: 401 },
          );
        }

        const key = `changepass:${clientKeyFromRequest(request)}`;
        if (isLockedOut(key)) {
          return Response.json({ ok: false, error: "locked" }, { status: 429 });
        }

        const body = await request
          .json()
          .catch(
            () =>
              ({}) as { currentPassphrase?: string; newPassphrase?: string },
          );
        const currentPassphrase =
          typeof body.currentPassphrase === "string"
            ? body.currentPassphrase
            : "";
        const newPassphrase =
          typeof body.newPassphrase === "string" ? body.newPassphrase : "";

        if (newPassphrase.length < MIN_PASSPHRASE_LENGTH) {
          return Response.json(
            { ok: false, error: "passphrase_too_short" },
            { status: 400 },
          );
        }

        // 400, not 401: a wrong *current* passphrase is a business-logic
        // rejection, not a session/token problem — the caller's own token
        // is still perfectly valid. Housekeeping's authed-fetch.ts treats
        // any 401 as "session invalid, log out", so this must not be 401
        // or a mistyped current passphrase would silently sign the caller
        // out of their otherwise-valid session.
        if (!currentPassphrase || !(await checkPassphrase(currentPassphrase))) {
          recordFailedAttempt(key);
          await new Promise((r) => setTimeout(r, 400));
          return Response.json(
            { ok: false, error: "wrong_passphrase" },
            { status: 400 },
          );
        }

        clearAttempts(key);
        await setPassphrase(newPassphrase);
        await logAdminAction("Housekeeping passphrase changed");

        // Changing the passphrase invalidates every existing token (it's
        // baked into the HMAC key, see auth.ts) — the caller's own token
        // included — so issue a fresh one immediately instead of signing
        // out the person who just changed it.
        return Response.json({ ok: true, token: await buildAuthToken() });
      },
    },
  },
});

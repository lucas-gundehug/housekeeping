import { createFileRoute } from "@tanstack/react-router";
import { buildAuthToken, checkPassphrase } from "@/lib/auth";
import {
  clearAttempts,
  clientKeyFromRequest,
  isLockedOut,
  recordFailedAttempt,
} from "@/lib/login-rate-limit";

export const Route = createFileRoute("/api/public/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = clientKeyFromRequest(request);
        if (isLockedOut(key)) {
          return Response.json({ ok: false, error: "locked" }, { status: 429 });
        }

        const body = await request
          .json()
          .catch(() => ({}) as { passphrase?: string });
        const passphrase =
          typeof body.passphrase === "string" ? body.passphrase : "";

        if (!passphrase || !(await checkPassphrase(passphrase))) {
          recordFailedAttempt(key);
          // Small artificial delay on top of the lockout, so a single wrong
          // guess isn't entirely free either.
          await new Promise((r) => setTimeout(r, 400));
          return Response.json({ ok: false }, { status: 401 });
        }

        clearAttempts(key);
        return Response.json({ ok: true, token: await buildAuthToken() });
      },
    },
  },
});

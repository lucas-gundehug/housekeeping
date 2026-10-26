import { createFileRoute } from "@tanstack/react-router";
import { isAuthedToken, tokenFromRequest } from "@/lib/auth";
import { resetCurrentWeek } from "@/lib/personal-dashboard-training";

export const Route = createFileRoute("/api/training/reset-week")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAuthedToken(tokenFromRequest(request)))) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const { week } = await resetCurrentWeek();
        return Response.json({ ok: true, week });
      },
    },
  },
});

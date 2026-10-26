import { createFileRoute } from "@tanstack/react-router";
import { isAuthedToken, tokenFromRequest } from "@/lib/auth";
import { checkPersonalDashboardHealth } from "@/lib/health-check";

export const Route = createFileRoute("/api/admin/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAuthedToken(tokenFromRequest(request)))) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const personalDashboard = await checkPersonalDashboardHealth();
        return Response.json(
          { personalDashboard },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});

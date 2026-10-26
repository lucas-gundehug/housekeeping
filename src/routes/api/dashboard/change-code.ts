import { createFileRoute } from "@tanstack/react-router";
import { isAuthedToken, tokenFromRequest } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-log";
import { changeDashboardCode } from "@/lib/personal-dashboard-client";

export const Route = createFileRoute("/api/dashboard/change-code")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAuthedToken(tokenFromRequest(request)))) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const body = await request
          .json()
          .catch(() => ({}) as { newCode?: string });
        const newCode = typeof body.newCode === "string" ? body.newCode : "";
        if (!/^\d{4}$/.test(newCode)) {
          return Response.json(
            { ok: false, error: "invalid_code" },
            { status: 400 },
          );
        }
        const result = await changeDashboardCode(newCode);
        if (result.ok) await logAdminAction("Dashboard access code changed");
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    },
  },
});

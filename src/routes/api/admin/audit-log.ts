import { createFileRoute } from "@tanstack/react-router";
import { isAuthedToken, tokenFromRequest } from "@/lib/auth";
import { getAuditLog } from "@/lib/audit-log";

export const Route = createFileRoute("/api/admin/audit-log")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAuthedToken(tokenFromRequest(request)))) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        return Response.json({ entries: await getAuditLog() });
      },
    },
  },
});

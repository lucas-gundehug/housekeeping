import { createFileRoute } from "@tanstack/react-router";
import { isAuthedToken, tokenFromRequest } from "@/lib/auth";
import { getProgressionOverview } from "@/lib/personal-dashboard-training";

export const Route = createFileRoute("/api/training/overview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAuthedToken(tokenFromRequest(request)))) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        return Response.json({ sessions: await getProgressionOverview() });
      },
    },
  },
});

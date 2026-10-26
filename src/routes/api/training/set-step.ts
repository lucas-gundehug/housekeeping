import { createFileRoute } from "@tanstack/react-router";
import { isAuthedToken, tokenFromRequest } from "@/lib/auth";
import { setExerciseStep } from "@/lib/personal-dashboard-training";

export const Route = createFileRoute("/api/training/set-step")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAuthedToken(tokenFromRequest(request)))) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const body = await request
          .json()
          .catch(() => ({}) as { exerciseId?: string; step?: number });
        const exerciseId =
          typeof body.exerciseId === "string" ? body.exerciseId : "";
        const step = typeof body.step === "number" ? body.step : NaN;
        if (!exerciseId || Number.isNaN(step)) {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        await setExerciseStep(exerciseId, step);
        return Response.json({ ok: true });
      },
    },
  },
});

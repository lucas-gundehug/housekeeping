import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/login-gate";

export const Route = createFileRoute("/")({
  component: Gate,
});

function Dashboard() {
  return (
    <AppShell
      active="home"
      title="Housekeeping"
      description="Admin panel for all projects."
    >
      <div className="flex flex-col items-center gap-6 py-10 sm:py-20">
        <img
          src="/logo.svg"
          alt="Housekeeping"
          className="w-48 sm:w-72 md:w-96 lg:w-[420px]"
        />
      </div>
    </AppShell>
  );
}

function Gate() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}

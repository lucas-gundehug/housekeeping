import { defineConfig } from "vitest/config";
import path from "node:path";

// Deliberately separate from vite.config.ts — that one pulls in TanStack
// Start/Nitro SSR plugins that have no business in a plain unit-test run.
// Just enough config for tests to resolve the "@/*" alias.
export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/lib/auth.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { devtools } from "@tanstack/devtools-vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(
    loadEnv(mode, process.cwd(), "VITE_"),
  )) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "::",
      port: 8080,
      watch: {
        awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 },
      },
    },
    plugins: [
      ...(mode === "development"
        ? [
            devtools({
              logging: false,
              eventBusConfig: { enabled: false },
              enhancedLogs: { enabled: false },
              consolePiping: { enabled: false },
              removeDevtoolsOnBuild: false,
              injectSource: { enabled: true },
            }),
          ]
        : []),
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        server: { entry: "server" },
      }),
      // inlineDynamicImports forces a single server output file instead of
      // multiple chunks — works around a known rolldown bug where its
      // chunk-splitting can produce two chunks that each need a runtime
      // helper (__exportAll) from the other at module-evaluation time,
      // crashing with "__exportAll is not a function" depending on load
      // order (rolldown/rolldown#8809). The server bundle runs as one
      // serverless function anyway, so splitting it into chunks bought
      // nothing here.
      ...(command === "build"
        ? [nitro({ preset: "vercel", inlineDynamicImports: true })]
        : []),
      viteReact(),
    ],
  };
});

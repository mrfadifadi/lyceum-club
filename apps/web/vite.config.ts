import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import { mysqlApiPlugin } from "./src/server/mysqlApiPlugin";

// Multi-page app: every *.html in the project root is its own page/entry.
const rootDir = import.meta.dirname;
const input = Object.fromEntries(
  fs.readdirSync(rootDir).filter((f) => f.endsWith(".html")).map((f) => [f.replace(".html", ""), path.resolve(rootDir, f)]),
);

export default defineConfig({
  appType: "mpa",
  plugins: [react(), tailwindcss(), mysqlApiPlugin()],
  resolve: { alias: { "@": path.resolve(rootDir, "src") } },
  build: { rollupOptions: { input } },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"] },
});

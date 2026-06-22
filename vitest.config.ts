import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";

export default defineConfig(() => {
  process.env = { ...process.env, ...loadEnv("test", process.cwd(), "") };

  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      globals: true,
      include: ["tests/**/*.test.ts"],
    },
  };
});

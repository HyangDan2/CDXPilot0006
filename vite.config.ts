import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  test: { include: ["tests/**/*.test.ts"] },
} as Parameters<typeof defineConfig>[0]);

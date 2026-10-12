import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["e2e/**/*.test.ts"],
    globals: true,
    globalSetup: ["./e2e/global-setup.ts"],
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
})

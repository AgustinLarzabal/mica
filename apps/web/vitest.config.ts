import { fileURLToPath } from "node:url"

import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

import { applicationVersionDefine } from "./application-version"

export default defineConfig({
  define: applicationVersionDefine,
  plugins: [viteReact()],
  resolve: {
    alias: {
      "@workspace/api": fileURLToPath(
        new URL("../../packages/api/src/index.ts", import.meta.url)
      ),
    },
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/test/**",
        "src/**/*.gen.{ts,tsx}",
        "src/**/*.generated.{ts,tsx}",
        "src/generated/**",
        "src/**/*.d.ts",
        "**/*.config.{js,ts,mjs,mts,cjs,cts}",
        "../../packages/ui/**",
      ],
      excludeAfterRemap: true,
      reportsDirectory: "coverage",
      reporter: ["text", "html"],
    },
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
})

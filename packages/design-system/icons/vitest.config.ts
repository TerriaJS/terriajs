import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        // The Figma fetch script runs in Node
        test: {
          name: "scripts",
          environment: "node",
          include: ["scripts/**/*.test.ts"]
        }
      },
      {
        plugins: [react()],
        test: {
          name: "components",
          globals: true,
          include: ["src/**/*.test.{ts,tsx}"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }]
          }
        }
      }
    ]
  }
});

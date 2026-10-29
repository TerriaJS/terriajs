import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Runs every story as a test, with its play function and accessibility
// checks; the Storybook UI's test panel starts this project
export default defineConfig({
  plugins: [
    storybookTest({
      configDir: join(dirname(fileURLToPath(import.meta.url)), ".storybook")
    })
  ],
  // The components package resolves its own React; one copy for both
  resolve: { dedupe: ["react", "react-dom"] },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }]
    }
  }
});

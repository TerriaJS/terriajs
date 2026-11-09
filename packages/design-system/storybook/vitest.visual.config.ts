import { join } from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import stories from "./vitest.config";

// Screenshots of every story, compared as Taiga UI compares its demo: run
// with -u on a change's own code to take the references, then without it on
// the base branch's code, so what differs fails with a diff. Both runs keep
// the references in VISUAL_SCREENSHOTS, outside either checkout
const screenshots =
  process.env["VISUAL_SCREENSHOTS"] ??
  join(import.meta.dirname, "__screenshots__");

export default mergeConfig(
  stories,
  defineConfig({
    // Vitest only writes screenshots where Vite may serve files from: the
    // repository, as by default, and the references' folder
    server: {
      fs: { allow: [join(import.meta.dirname, "../.."), screenshots] }
    },
    test: {
      setupFiles: ["./visual.setup.ts"],
      // Storybook's plugin turns file writes off unless asked for, and the
      // screenshots are written from the browser
      api: { allowWrite: true },
      browser: {
        viewport: { width: 1024, height: 768 },
        expect: {
          toMatchScreenshot: {
            resolveScreenshotPath: ({ arg, ext, testFileName }) =>
              join(screenshots, testFileName, `${arg}${ext}`),
            resolveDiffPath: ({ arg, ext, testFileName }) =>
              join(screenshots, "__diffs__", testFileName, `${arg}${ext}`)
          }
        }
      }
    }
  })
);

import { join } from "node:path";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";
import tests from "./vitest.config.ts";

// Visual tests (*.visual.tsx): each component in each state it shows,
// screenshotted in both themes. Compared as Taiga UI compares its demo: run
// with -u on a change's own code to take the references, then without it on
// the base branch's code, so what differs fails with a diff. Both runs keep
// the references in VISUAL_SCREENSHOTS, outside either checkout
const screenshots =
  process.env["VISUAL_SCREENSHOTS"] ??
  join(import.meta.dirname, "__screenshots__");

// userEvent can click but not hold the button down, so pressed states press
// the real mouse where userEvent.hover left it: :active and React Aria's
// data-pressed both follow
const mouseDown: BrowserCommand<[]> = async ({ page }) => {
  await page.mouse.down();
};
const mouseUp: BrowserCommand<[]> = async ({ page }) => {
  await page.mouse.up();
};
// Every test renders in the same place, so a pointer left where the last
// one put it would hover the next
const mouseAway: BrowserCommand<[]> = async ({ page }) => {
  await page.mouse.move(0, 0);
};
// A test file that fails to build has its error reported, but Vite also
// draws it over Vitest's page and the tests' frames: every screenshot after
// would have it in
const hideErrorOverlay: BrowserCommand<[]> = async ({ page }) => {
  await Promise.all(
    page.frames().map((frame) =>
      frame.evaluate(() => {
        if (document.getElementById("hide-error-overlay")) return;
        const style = document.createElement("style");
        style.id = "hide-error-overlay";
        style.textContent = "vite-error-overlay { display: none !important; }";
        document.head.append(style);
      })
    )
  );
};

export default mergeConfig(
  tests,
  defineConfig({
    // Vitest only writes screenshots where Vite may serve files from: the
    // repository, as by default, and the references' folder
    server: {
      fs: { allow: [join(import.meta.dirname, "../.."), screenshots] }
    },
    test: {
      include: ["src/**/*.visual.tsx"],
      setupFiles: ["./src/visual-setup.ts"],
      browser: {
        // Without LCD (subpixel) text, text antialiasing doesn't depend on
        // how busy the machine is or what's behind it, as over a blur
        provider: playwright({
          launchOptions: { args: ["--disable-lcd-text"] }
        }),
        viewport: { width: 640, height: 480 },
        commands: { mouseDown, mouseUp, mouseAway, hideErrorOverlay },
        expect: {
          toMatchScreenshot: {
            // A shade of antialiasing at an icon's edge can vary from run to
            // run; a real change alters far more than 0.02% of the pixels
            comparatorName: "pixelmatch",
            comparatorOptions: { allowedMismatchedPixelRatio: 0.0002 },
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

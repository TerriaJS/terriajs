import { afterEach, beforeEach, expect, vi } from "vitest";
import { page } from "vitest/browser";

const THEMES = ["light", "dark"] as const;

// Screenshots only differ where the code does: no animation or transition
// caught partway, including the theme switch's, no looping one either, and one moment in time for
// stories that show the current date
const still = document.createElement("style");
still.textContent = `*, *::before, *::after {
  animation-duration: 0.01ms !important;
  animation-delay: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  transition-delay: 0.01ms !important;
  caret-color: transparent !important;
}
/* Code takes the browser's generic monospace, which Chromium resolves to
   different system fonts from run to run; one named font instead */
:is(code, pre, samp) {
  font-family: "Courier New", monospace !important;
}`;
document.head.append(still);

beforeEach(async () => {
  // Only Date: timers stay real, so stories still settle
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-15T09:30:00Z"));
  // Fonts load before the story renders, so nothing is laid out, or an
  // overlay placed, against a fallback font. Inter comes from a stylesheet
  // fonts.css @imports, fetched on its own: until it arrives its faces aren't
  // declared and document.fonts.ready resolves without them
  await vi.waitFor(
    () => {
      const inter = [...document.fonts].filter((face) =>
        face.family.includes("Inter")
      );
      if (inter.length === 0) throw new Error("Inter isn't declared yet");
      return Promise.all(inter.map((face) => face.load()));
    },
    { timeout: 10_000 }
  );
  await Promise.all([...document.fonts].map((face) => face.load()));
});

// Each story once it has rendered and its play function has run, in both
// themes; the tokens switch on <html data-theme>
afterEach(async ({ task }) => {
  vi.useRealTimers();
  if (task.result?.state === "fail") return;
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme");
  for (const mode of THEMES) {
    root.setAttribute("data-theme", mode);
    await expect(page.elementLocator(document.body)).toMatchScreenshot(
      `${task.name}-${mode}`
    );
  }
  if (theme) root.setAttribute("data-theme", theme);
});

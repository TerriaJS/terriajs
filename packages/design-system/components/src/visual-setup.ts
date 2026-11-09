// For the visual tests, after test-setup.ts: the font, and screenshots that
// only differ where the code does
import { afterEach, beforeEach, vi } from "vitest";
import { commands } from "vitest/browser";
import "./css/fonts.css";

declare module "vitest/browser" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Only an interface merges into Vitest's
  interface BrowserCommands {
    mouseDown: () => Promise<void>;
    mouseUp: () => Promise<void>;
    mouseAway: () => Promise<void>;
    hideErrorOverlay: () => Promise<void>;
  }
}

// No animation or transition caught partway, the theme switch's included,
// and no looping one either. Code takes the browser's generic monospace,
// which Chromium resolves to different system fonts from run to run, so one
// named font instead. Each test renders into a container of its own, sized to
// what's in it, with room for focus rings and shadows
const still = document.createElement("style");
still.textContent = `*, *::before, *::after {
  animation-duration: 0.01ms !important;
  animation-delay: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  transition-delay: 0.01ms !important;
  caret-color: transparent !important;
}
:is(code, pre, samp) {
  font-family: "Courier New", monospace !important;
}
body > div:not([data-react-aria-top-layer], [data-live-announcer]) {
  display: inline-block;
  padding: 12px;
}`;
document.head.append(still);

beforeEach(async () => {
  await commands.hideErrorOverlay();
  // Only Date: timers stay real, so components still settle
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-15T09:30:00Z"));
  // Fonts load before anything renders, so nothing is laid out, or an
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

afterEach(async () => {
  vi.useRealTimers();
  // A test that pressed and didn't let go would leave the next one pressed,
  // and the pointer where it was would hover it
  await commands.mouseUp();
  await commands.mouseAway();
  document.documentElement.removeAttribute("data-theme");
});

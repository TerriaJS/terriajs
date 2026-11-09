// Helpers for the visual tests: put a component in a state the way a person
// would, then screenshot it in both themes
import { expect } from "vitest";
import { commands, page, userEvent, type Locator } from "vitest/browser";

const THEMES = ["light", "dark"] as const;

// What a test renders into: not React Aria's overlays or live announcer,
// which also sit on <body>
const CONTAINER =
  "body > div:not([data-react-aria-top-layer], [data-live-announcer])";

/**
 * Screenshots `target` in the light and the dark theme, named after the test.
 * By default the test's container, sized to what it rendered; pass the page
 * for overlays, which render outside it
 */
export const snap = async (target?: Locator): Promise<void> => {
  const name = expect.getState().currentTestName ?? "screenshot";
  const container = document.querySelector<HTMLElement>(CONTAINER);
  if (!target && !container) throw new Error("Nothing rendered to snap");
  const locator =
    target ?? page.elementLocator(container ?? document.documentElement);
  for (const theme of THEMES) {
    document.documentElement.setAttribute("data-theme", theme);
    await expect(locator).toMatchScreenshot(`${name} ${theme}`);
  }
};

/** The whole page, for overlays */
export const viewport = (): Locator => page.elementLocator(document.body);

/** The pointer over `target` */
export const hover = (target: Locator): Promise<void> =>
  userEvent.hover(target);

/**
 * `target` focused from the keyboard, so it shows its focus ring. React Aria
 * tells a keyboard user by a keydown of anything but a modifier, so one with
 * no key comes first: a real Escape or Tab would close overlays or move focus
 */
export const focusVisible = async (target: Locator): Promise<void> => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Unidentified", bubbles: true })
  );
  (target.element() as HTMLElement).focus();
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

/** The mouse held down on `target`, until the test ends */
export const press = async (target: Locator): Promise<void> => {
  await userEvent.hover(target);
  await commands.mouseDown();
};

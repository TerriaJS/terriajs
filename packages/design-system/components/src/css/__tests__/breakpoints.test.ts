// import.meta.glob and ?raw imports come from Vite, which runs the tests
/// <reference types="vite/client" />
import { expect, it } from "vitest";
import tokens from "../tokens.css?raw";

// Media queries can't read custom properties, so a breakpoint is written as
// its value. Every width a stylesheet or a component's media query switches
// at has to be one of the screens tokens
const sources = import.meta.glob(
  [
    "../../**/*.{css,ts,tsx}",
    "!../../**/tokens.css",
    "!../../**/__tests__/**",
    "!../../**/*.test.{ts,tsx}",
    "!../../**/*.visual.tsx",
    "!../../**/*.stories.tsx"
  ],
  { query: "?raw", import: "default", eager: true }
);

const SCREENS = new Map(
  [...tokens.matchAll(/(--terria-ds-dimensions-screens-\w+): (\d+)px;/g)].map(
    ([, name, width]) => [Number(width), String(name)]
  )
);

// (width >= 768px), (width < 768px), (min-width: 768px)…
const WIDTH = /\((?:min-|max-)?width\s*(?:>=|<=|<|>|:)\s*([\d.]+)px\)/g;

it("reads the screens tokens", () => {
  expect(SCREENS.size).toBeGreaterThan(0);
});

it.each(Object.entries(sources))(
  "%s switches only at the screens tokens' widths",
  (_, source) => {
    const widths = [...source.matchAll(WIDTH)].map(([, width]) =>
      Number(width)
    );
    expect(
      widths.filter((width) => !SCREENS.has(width)),
      `allowed: ${[...SCREENS].map(([w, n]) => `${String(w)}px (${n})`).join(", ")}`
    ).toEqual([]);
  }
);

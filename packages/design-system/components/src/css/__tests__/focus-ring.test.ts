// import.meta.glob and ?raw imports come from Vite, which runs the tests
/// <reference types="vite/client" />
import { expect, it } from "vitest";

// Forced-colors mode (Windows High Contrast) drops box-shadows, so a focus
// ring drawn as one disappears there. Each rule that draws it also sets an
// outline: transparent normally, given a system colour in that mode
const sources = import.meta.glob(["../../**/*.css", "!../../**/tokens.css"], {
  query: "?raw",
  import: "default",
  eager: true
});

type Rule = { selector: string; declarations: string };

// Each rule's selector, nested ones with their parents', and its own
// declarations, without those of the rules nested in it
const rules = (css: string): Rule[] => {
  const found: Rule[] = [];
  const stack: Rule[] = [];
  let text = "";
  for (const char of css.replaceAll(/\/\*[\s\S]*?\*\//g, "")) {
    if (char === "{") {
      const [declarations, selector] = splitLast(text);
      const parent = stack.at(-1);
      if (parent) parent.declarations += declarations;
      stack.push({
        selector: `${parent?.selector ?? ""} ${selector}`,
        declarations: ""
      });
      text = "";
    } else if (char === "}") {
      const rule = stack.pop();
      if (rule) {
        rule.declarations += text;
        found.push(rule);
      }
      text = "";
    } else {
      text += char;
    }
  }
  return found;
};

// What's before a nested rule's selector is its parent's declarations
const splitLast = (text: string): [string, string] => {
  const end = text.lastIndexOf(";");
  return [text.slice(0, end + 1), text.slice(end + 1).trim()];
};

// Rules that only restyle a ring whose outline another rule sets: the
// danger-coloured rings, and the cells drawing a focused row's ring, which the
// row's own outline goes round
const RESTYLES = [/danger|invalid/, /"table-row"\]\[data-focus-visible\] >/];

const ringsWithoutOutline = (css: string): string[] =>
  rules(css)
    .filter(
      ({ selector, declarations }) =>
        selector.includes("focus-visible") &&
        !RESTYLES.some((pattern) => pattern.test(selector)) &&
        /box-shadow:(?!\s*none)/.test(declarations) &&
        !/outline:\s*(?!none)/.test(declarations)
    )
    .map(({ selector }) => selector.replaceAll(/\s+/g, " ").trim());

it("finds a ring without an outline", () => {
  expect(
    ringsWithoutOutline(
      "a { &[data-focus-visible] { box-shadow: 0 0 0 2px red; } }"
    )
  ).toEqual(["a &[data-focus-visible]"]);
});

it.each(Object.entries(sources))(
  "%s pairs every focus ring with an outline",
  (_, source) => {
    expect(ringsWithoutOutline(source)).toEqual([]);
  }
);

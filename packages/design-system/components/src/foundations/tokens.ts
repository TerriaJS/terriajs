import type { CSSProperties } from "react";

// Helpers for the Foundations docs pages

// How a token is used in CSS
export const token = (name: string): string => `var(--terria-ds-${name})`;

// Which token an example shows is data, so it goes in as custom properties
// for the page's stylesheet to style with
export const customProperties = (
  properties: Record<string, string>
): CSSProperties => properties;

// Every token whose name starts with the prefix, in the order tokens.css
// declares them, read from the loaded stylesheets so a page can't drift from
// them. Names come without the --terria-ds- part
export const readTokens = (prefix: string): string[] => {
  const start = `--terria-ds-${prefix}`;
  const names = new Set<string>();
  const visit = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        for (const property of Array.from(rule.style)) {
          if (property.startsWith(start)) {
            names.add(property.slice("--terria-ds-".length));
          }
        }
      }
      // Layers, and rules nested in rules
      if (rule instanceof CSSGroupingRule) visit(rule.cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      // A cross-origin stylesheet can't be read, and holds no tokens
    }
  }
  return [...names];
};

// A length token's size in pixels, to sort a scale by
export const tokenPixels = (name: string): number => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--terria-ds-${name}`)
    .trim();
  const number = Number.parseFloat(value) || 0;
  return value.endsWith("rem") ? number * 16 : number;
};

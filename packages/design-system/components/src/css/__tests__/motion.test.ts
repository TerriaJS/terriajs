// import.meta.glob and ?raw imports come from Vite, which runs the tests
/// <reference types="vite/client" />
import { expect, it } from "vitest";
import tokens from "../tokens.css?raw";

// Motion is written as the motion tokens, so no timing exists that they
// don't hold. Only loops (infinite animations, and the --_*-loop properties
// that time them) keep their own
const sources = import.meta.glob(
  ["../../**/*.css", "!../../**/tokens.css", "!../../**/reset.css"],
  { query: "?raw", import: "default", eager: true }
);

// A time other than none at all, or a curve other than linear
const TIME = /(?<![-\w.])(?!0m?s\b)\d*\.?\d+m?s\b/;
const CURVE =
  /cubic-bezier\(|steps\(|(?<![-\w])ease(?:-in|-out|-in-out)?(?![-\w])/;

const declarations = (css: string): string[] =>
  css
    .replaceAll(/\/\*[\s\S]*?\*\//g, "")
    .split(/[;{}]/)
    .map((declaration) => declaration.replaceAll(/\s+/g, " ").trim());

const isLoop = (declaration: string): boolean =>
  declaration.includes("infinite") || /^--_[\w-]+-loop:/.test(declaration);

it("reads the motion tokens", () => {
  expect(tokens).toContain("--terria-ds-duration-150: 150ms;");
  expect(tokens).toContain("--terria-ds-ease-out: cubic-bezier(0, 0, 0.2, 1);");
});

it.each(Object.entries(sources))(
  "%s writes motion as its tokens",
  (_, source) => {
    expect(
      declarations(source).filter(
        (declaration) =>
          !isLoop(declaration) &&
          (TIME.test(declaration) || CURVE.test(declaration))
      )
    ).toEqual([]);
  }
);

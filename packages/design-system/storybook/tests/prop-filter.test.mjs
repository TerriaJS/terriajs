import assert from "node:assert/strict";
import { test } from "node:test";
import config from "../.storybook/main.ts";

const filter = config.typescript.reactDocgenTypescriptOptions.propFilter;
const inherited = (name, parent) => ({
  name,
  parent: { name: parent, fileName: "/node_modules/library/index.d.ts" }
});

test("hides generic inherited DOM and React props", () => {
  for (const [name, parent] of [
    ["onPlay", "DOMAttributes"],
    ["onPointerMoveCapture", "GlobalDOMEvents"],
    ["suppressHydrationWarning", "HTMLAttributes"],
    ["inert", "GlobalDOMAttributes"],
    ["ref", "RefAttributes"],
    ["key", "Attributes"]
  ]) {
    assert.equal(filter(inherited(name, parent)), false, name);
  }
  assert.equal(filter({ name: "aria-label" }), false);
});

test("keeps component APIs and useful native input props", () => {
  for (const [name, parent] of [
    ["isDisabled", "ButtonProps"],
    ["onPress", "PressEvents"],
    ["value", "InputHTMLAttributes"],
    ["onChange", "InputHTMLAttributes"],
    ["defaultValue", "HTMLAttributes"],
    ["defaultChecked", "HTMLAttributes"],
    ["autoFocus", "HTMLAttributes"]
  ]) {
    assert.equal(filter(inherited(name, parent)), true, name);
  }
  assert.equal(filter({ name: "variant" }), true);
  assert.equal(
    filter({
      name: "size",
      parent: {
        name: "ButtonProps",
        fileName: "/@terria/design-system/src/Button.tsx"
      }
    }),
    true
  );
});

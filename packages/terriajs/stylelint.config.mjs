// @ts-check
import stylelint from "stylelint";
import shared from "../design-system/stylelint.shared.mjs";

// The new UI's CSS (lib/UI) sits in the tjs layers, after the design
// system's, so the cascade order holds whatever order the files load in
const ruleName = "terriajs/in-tjs-layer";
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: "Put rules inside @layer tjs.components (or tjs.overrides)"
});
const inTjsLayer = stylelint.createPlugin(ruleName, (enabled) => {
  return (root, result) => {
    if (!enabled) return;
    root.walkRules((rule) => {
      for (let node = rule.parent; node; node = node.parent) {
        if (
          node.type === "atrule" &&
          "name" in node &&
          node.name === "layer" &&
          /^tjs\./.test(String(node.params))
        ) {
          return;
        }
      }
      stylelint.utils.report({
        ruleName,
        result,
        node: rule,
        message: messages.rejected
      });
    });
  };
});

/** @type {import("stylelint").Config} */
export default {
  ...shared,
  plugins: [...(shared.plugins ?? []), inTjsLayer],
  rules: {
    ...shared.rules,
    // Every value the design defines comes from its tokens
    "scale-unlimited/declaration-strict-value": [
      [
        "/color$/",
        "font-size",
        "font-weight",
        "z-index",
        "/^(margin|padding|gap|row-gap|column-gap|inset)/",
        "/radius$/",
        "box-shadow",
        "/duration$/"
      ],
      {
        ignoreValues: [
          "inherit",
          "transparent",
          "currentcolor",
          "none",
          "0",
          "auto"
        ]
      }
    ],
    "selector-class-pattern": [
      "^tjs-[a-z0-9-]+(__[a-z0-9-]+)?$",
      { message: "Classes are tjs-<component> or tjs-<component>__<part>" }
    ],
    [ruleName]: true
  }
};

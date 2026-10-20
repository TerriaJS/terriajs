// @ts-check
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// const require = createRequire(import.meta.url);

// The design system's rules, for each of its packages' stylelint.config.mjs,
// which resolves the plugins and config named here from the package
/** @type {import("stylelint").Config} */
export default {
  allowEmptyInput: true,
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "**/dist/**",
    "**/node_modules/**",
    // Generated; absolute, as each package reads ignoreFiles from its own folder
    fileURLToPath(new URL("components/src/css/tokens.css", import.meta.url))
  ],
  plugins: [
    "stylelint-declaration-strict-value",
    "stylelint-value-no-unknown-custom-properties"
  ],
  rules: {
    "custom-property-empty-line-before": null,
    "declaration-empty-line-before": null,
    // ESLint directives sit directly above the line they apply to
    "comment-empty-line-before": [
      "always",
      {
        except: ["first-nested"],
        ignore: ["stylelint-commands"],
        ignoreComments: [/^eslint-/]
      }
    ],
    "scale-unlimited/declaration-strict-value": [
      ["/color$/", "font-size", "z-index"],
      {
        ignoreValues: ["inherit", "transparent", "currentColor", "none"]
      }
    ],
    "csstools/value-no-unknown-custom-properties": [
      true,
      {
        importFrom: [
          fileURLToPath(
            new URL("components/src/css/tokens.css", import.meta.url)
          )
        ]
      }
    ],
    "custom-property-pattern": "terria-ds-.+|^_.+"
  }
};

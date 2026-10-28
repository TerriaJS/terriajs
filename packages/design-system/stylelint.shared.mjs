// @ts-check
import { fileURLToPath } from "node:url";

// The design system's rules, for each of its packages' stylelint.config.mjs,
// which resolves the plugins and config named here from the package
/** @type {import("stylelint").Config} */
export default {
  allowEmptyInput: true,
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "**/dist/**",
    "**/node_modules/**",
    "**/storybook-static/**",
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
      ["/color$/", "font-size", "font-weight", "z-index"],
      {
        ignoreValues: ["inherit", "transparent", "currentcolor", "none"]
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

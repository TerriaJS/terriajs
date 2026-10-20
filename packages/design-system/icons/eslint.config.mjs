// @ts-check

import eslintReact from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import { dirname } from "node:path";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/dist/**",
    "**/coverage/**",
    "**/*.config.ts",
    "**/*.config.js",
    "**/*.config.cjs",
    "**/*.config.mjs"
  ]),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        // The design system's folder, whose tsconfig.json covers files a
        // package's own leaves out, like icons' scripts
        tsconfigRootDir: dirname(import.meta.dirname)
      }
    }
  },
  {
    files: [
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "**/*.jsx",
      "**/*.ts",
      "**/*.tsx"
    ],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      importPlugin.flatConfigs.recommended
    ]
  },
  {
    name: "Imports",
    files: [
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "**/*.jsx",
      "**/*.ts",
      "**/*.tsx"
    ],
    settings: {
      "import/ignore": [
        "\.(scss|less|css)$" // can't parse unprocessed CSS modules, either
      ],
      "import/resolver": {
        // You will also need to install and configure the TypeScript resolver
        // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
        typescript: true
      }
    },
    rules: {
      // eslint-plugin-import's no-default-export reads context.parserOptions,
      // which ESLint 10 removed; the core rule enforces the same policy
      "no-restricted-exports": [
        "error",
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true
          }
        }
      ],
      "import/no-namespace": "error",
      "import/no-deprecated": "warn",
      "import/first": "error",
      "import/no-mutable-exports": "error",
      "import/no-duplicates": "error",
      "import/newline-after-import": "error",
      "import/no-absolute-path": "error",
      "import/no-webpack-loader-syntax": "error",
      "import/no-self-import": "error",
      "import/no-relative-packages": "error"
    }
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.jsx"],
    settings: {
      react: {
        version: "18.2"
      },
      "react-x": {
        version: "18.2"
      }
    },
    extends: [
      importPlugin.flatConfigs.typescript,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat["jsx-runtime"],
      eslintReact.configs["disable-conflict-eslint-plugin-react"],
      eslintReact.configs["recommended-type-checked"]
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true
        }
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowNullableString: true,
          allowNullableBoolean: true
        }
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/display-name": "error"
    }
  },
  prettier
);

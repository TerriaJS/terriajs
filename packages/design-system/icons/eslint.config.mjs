// @ts-check

import eslintReact from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
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

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        // The design system's folder, whose tsconfig.json covers files a
        // package's own leaves out, like icons' scripts
        tsconfigRootDir: dirname(import.meta.dirname)
      }
    },
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
  {
    files: ["**/*.ts", "**/*.tsx"],
    settings: {
      react: {
        version: "18.2"
      },
      "react-x": {
        version: "18.2"
      }
    },
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat["jsx-runtime"],
      eslintReact.configs["disable-conflict-eslint-plugin-react"],
      eslintReact.configs["recommended-type-checked"]
    ]
  },
  prettier
);

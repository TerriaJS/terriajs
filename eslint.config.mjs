// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";

import tsParser from "@typescript-eslint/parser";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/*.scss.d.ts", "lib/ThirdParty", "dist", "wwwroot"]),

  js.configs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  {
    name: "terriajs/include-files",
    files: [
      "**/*.jsx",
      "**/*.tsx",
      "**/*.js",
      "**/*.ts",
      "**/*.cjs",
      "**/*.mjs"
    ]
  },
  {
    name: "terriajs/language-options",
    languageOptions: {
      ecmaVersion: 2025,
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          modules: true,
          legacyDecorators: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        process: true
      }
    },
    settings: {
      react: {
        version: "18.3"
      }
    }
  },
  {
    name: "terriajs/base-rules",
    rules: {
      "react-hooks/exhaustive-deps": "error",

      "react/jsx-boolean-value": [
        "error",
        "never",
        {
          always: []
        }
      ],

      "react/no-arrow-function-lifecycle": "error",
      "react/no-invalid-html-attribute": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/jsx-no-constructed-context-values": "error",
      "react/jsx-fragments": ["error", "syntax"],

      "react/jsx-no-duplicate-props": [
        "error",
        {
          ignoreCase: true
        }
      ],

      "react/jsx-pascal-case": [
        "error",
        {
          allowAllCaps: true,
          ignore: []
        }
      ],

      "react/no-danger": "warn",
      "react/no-did-update-set-state": "error",
      "react/no-will-update-set-state": "error",
      "react/self-closing-comp": "error",

      "react/jsx-no-undef": [
        "error",
        {
          allowGlobals: true
        }
      ],

      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"]
        }
      ],

      "no-restricted-imports": [
        "error",
        {
          name: "lodash",
          message: "Please use 'lodash-es' instead."
        }
      ],
      "block-scoped-var": "error",
      "no-console": "off",
      "no-inner-declarations": ["warn", "functions"],
      eqeqeq: ["error"],
      "no-alert": ["error"],
      "no-caller": ["error"],
      "no-div-regex": ["error"],

      "no-empty": [
        "error",
        {
          allowEmptyCatch: true
        }
      ],

      "no-eval": ["error"],
      "no-extend-native": ["error"],
      "no-fallthrough": ["off"],
      "no-implied-eval": ["error"],
      "no-iterator": ["error"],
      "no-labels": ["error"],
      "no-lone-blocks": ["error"],
      "no-loop-func": ["error"],
      "no-new-func": ["error"],
      "no-new-wrappers": ["error"],
      "no-new": ["error"],
      "no-octal-escape": ["error"],
      "no-proto": ["error"],
      "no-return-assign": ["error"],
      "no-script-url": ["error"],
      "no-sequences": ["error"],
      radix: "error",
      strict: ["off", "global"],
      "no-label-var": "warn",

      camelcase: [
        "off",
        {
          properties: "always"
        }
      ],

      "no-array-constructor": "error",
      "no-object-constructor": "warn",
      "no-unneeded-ternary": "warn",
      "prefer-const": "error",
      "no-new-native-nonconstructor": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-this-alias": "off",

      "@typescript-eslint/no-empty-object-type": [
        "error",
        {
          allowInterfaces: "with-single-extends"
        }
      ],

      "@typescript-eslint/unified-signatures": "error",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ],

      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "error",
      // @TODO: revise these rules
      "@typescript-eslint/consistent-type-assertions": "error"
    }
  },
  {
    name: "terriajs/typescript-rules",
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        ecmaFeatures: {
          modules: true,
          legacyDecorators: true
        }
      }
    },
    rules: {}
  },
  {
    name: "terriajs/tests",
    files: ["test/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.jasmine
      }
    }
  },
  {
    name: "terriajs/build-process",
    files: ["buildprocess/**/*.{js,ts,cjs,mjs}", "gulpfile.js"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  prettier
]);

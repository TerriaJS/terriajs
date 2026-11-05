// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";

import tsParser from "@typescript-eslint/parser";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginZod from "eslint-plugin-zod";

// The new UI's rules (lib/UI), used by its blocks below
const noLogic = "Logic belongs in a model or view model, not a UI component.";
const newUiImports = {
  paths: [
    { name: "lodash", message: "Please use 'lodash-es' instead." },
    ...[
      "styled-components",
      "create-react-class",
      "classnames",
      "hoist-non-react-statics",
      "react-select",
      "rc-slider",
      "react-datepicker",
      "react-color",
      "react-anything-sortable",
      "react-transition-group",
      "react-virtual",
      "react-swipeable",
      "react-responsive",
      "@visx/tooltip"
    ].map((name) => ({
      name,
      message: "The new UI uses the design system, React Aria and clsx instead."
    }))
  ],
  patterns: [
    {
      group: ["*.scss"],
      message: "The new UI's CSS is plain .css in the tjs layers."
    },
    {
      group: ["**/Styled/**", "**/ReactViews/**"],
      message: "The new UI doesn't use the old UI's components."
    }
  ]
};
const mobxActions = {
  name: "mobx",
  importNames: ["runInAction", "action", "reaction", "autorun", "when", "flow"],
  message: noLogic
};
const loadHelpers = {
  group: ["**/Core/load*"],
  message: "Loading belongs in a model or view model, not a UI component."
};
const newUiClasses = {
  selector: "ClassDeclaration[superClass], ClassExpression[superClass]",
  message: "The new UI is function components only."
};
const newUiLogic = [
  {
    selector:
      "CallExpression[callee.name=/^(runInAction|action|reaction|autorun|when|flow|fetch)$/]",
    message: noLogic
  },
  {
    selector:
      "CallExpression[callee.property.name=/^(setTrait|setTraitsFromJson|runInAction)$/]",
    message: noLogic
  },
  { selector: "Identifier[name='CommonStrata']", message: noLogic }
];

export default defineConfig([
  globalIgnores(["**/*.scss.d.ts", "lib/ThirdParty", "dist", "wwwroot"]),

  js.configs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  eslintPluginZod.configs.recommended,
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
      "zod/prefer-string-schema-with-trim": "off",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",

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

      "react/no-danger": "error",
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
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]",
          message:
            "Raw HTML sink. Render React elements, or pass HTML through parseCustomHtmlToReact / markdownToHtml (DOMPurify)."
        },
        {
          selector:
            "CallExpression[callee.property.name=/^(insertAdjacentHTML|createContextualFragment)$/]",
          message:
            "Raw HTML sink. Render React elements, or pass HTML through parseCustomHtmlToReact / markdownToHtml (DOMPurify)."
        },
        {
          selector:
            "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
          message: "document.write is a raw HTML sink."
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
        tsconfigRootDir: import.meta.dirname,
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
    },
    rules: {
      "no-restricted-syntax": "off",
      "react/no-danger": "off"
    }
  },
  // The new UI (lib/UI): TypeScript function components on the design system,
  // with no logic of their own. Its tests may set up model state
  {
    name: "terriajs/new-ui",
    files: ["lib/UI/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", newUiImports],
      "no-restricted-syntax": ["error", newUiClasses]
    }
  },
  {
    name: "terriajs/new-ui-no-logic",
    files: ["lib/UI/**/*.{ts,tsx}"],
    ignores: ["lib/UI/**/*.test.{ts,tsx}", "lib/UI/test/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...newUiImports.paths, mobxActions],
          patterns: [...newUiImports.patterns, loadHelpers]
        }
      ],
      "no-restricted-syntax": ["error", newUiClasses, ...newUiLogic]
    }
  },
  {
    name: "terriajs/new-ui-typescript-only",
    files: ["lib/UI/**/*.{js,jsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "Program", message: "The new UI is TypeScript only." }
      ]
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

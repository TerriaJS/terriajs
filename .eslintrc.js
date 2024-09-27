"use strict";

module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2019,
    ecmaFeatures: {
      jsx: true,
      modules: true,
      legacyDecorators: true
    }
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  ignorePatterns: ["*.scss.d.ts"],
  plugins: ["react", "react-hooks", "@typescript-eslint"],
  globals: {
    process: true
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    "react-hooks/exhaustive-deps": "error",
    "react/jsx-boolean-value": ["error", "never", { always: [] }],
    "react/no-arrow-function-lifecycle": "error",
    "react/no-invalid-html-attribute": "error",
    "react/jsx-no-useless-fragment": "error",
    "react/jsx-no-constructed-context-values": "error",
    "react/jsx-fragments": ["error", "syntax"],
    "react/jsx-no-duplicate-props": ["error", { ignoreCase: true }],
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
    "react/jsx-no-undef": ["error", { allowGlobals: true }],

    /*Possible Errors */
    "no-console": "off",
    "no-inner-declarations": [1, "functions"],

    /* Best Practices */
    eqeqeq: ["error"],
    "no-alert": ["error"],
    "no-caller": ["error"],
    "no-div-regex": ["error"],
    "no-eval": ["error"],
    "no-extend-native": ["error"],
    "no-fallthrough": 0,
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

    /* Strict Mode */
    strict: [0, "global"],

    /* Variables */
    "no-label-var": 1,
    "no-unused-vars": [
      "warn",
      {
        vars: "local",
        args: "none"
      }
    ],

    camelcase: [
      0,
      {
        properties: "always"
      }
    ],
    "no-array-constructor": "error",
    "no-new-object": 1,
    "no-unneeded-ternary": 1 /* ECMAScript 6 */,
    "prefer-const": "error",
    /* See https://stackoverflow.com/questions/64646248/eslintrc-js-for-react-17-and-jsx-without-import-react/64646593#64646593 */
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "react/no-unknown-property": ["error", { ignore: ["css"] }]
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        // @TODO: revise these rules
        "@typescript-eslint/consistent-type-assertions": "error",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_",
            ignoreRestSiblings: true
          }
        ],
        "@typescript-eslint/ban-ts-comment": "warn",
        "@typescript-eslint/no-loss-of-precision": "warn",
        "@typescript-eslint/no-unsafe-declaration-merging": "error",
        "react-hooks/exhaustive-deps": "error",
        "react/prop-types": "warn"
      }
    }
  ]
};

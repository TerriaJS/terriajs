import type { StorybookConfig } from "@storybook/react-vite";
import path, { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../components/src/**/*.mdx",
    "../../components/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-designs",
    "storybook-dark-mode"
  ],
  core: {
    disableTelemetry: true
  },
  // The dark mode toggle themes the canvas; the backgrounds toolbar would
  // compete with it
  features: {
    backgrounds: false
  },
  typescript: {
    check: true,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false
      },
      propFilter: (prop) => {
        if (prop.name.startsWith("aria-")) return false;
        if (!prop.parent?.fileName.includes("node_modules")) return true;
        if (["defaultValue", "defaultChecked", "autoFocus"].includes(prop.name))
          return true;
        // Keep component APIs, but omit the generic DOM/React prop tables.
        return ![
          "DOMAttributes",
          "HTMLAttributes",
          "GlobalDOMAttributes",
          "GlobalDOMEvents",
          "RefAttributes",
          "Attributes"
        ].includes(prop.parent.name);
      },
      include: [
        path.resolve(__dirname, "../../components/src/**/*.tsx") // Your external library
      ]
    }
  },
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  viteFinal: (config) => {
    // Customize the Vite config here
    return {
      ...config,
      define: { "process.env": {} },
      resolve: {
        alias: [
          {
            find: /^@terria\/design-system\/(layers|tokens|reset|base|typography|fonts)\.css$/,
            replacement: resolve(__dirname, "../../components/src/css/$1.css")
          },
          {
            find: "@terria/design-system",
            replacement: resolve(__dirname, "../../components/src")
          }
        ]
      }
    };
  }
};
export default config;

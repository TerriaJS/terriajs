import type { Decorator, Preview } from "@storybook/react-vite";
import { themes } from "storybook/theming";
// layers.css first: the first @layer a page meets fixes the order
import "@terria/design-system/layers.css";
import "@terria/design-system/reset.css";
import "@terria/design-system/tokens.css";
import "@terria/design-system/base.css";
import "@terria/design-system/typography.css";
import "@terria/design-system/fonts.css";
import "./preview.css";
import { DesignSystemTheme, ThemedDocsContainer, type Theme } from "./theme";

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark";

const withDesignSystemTheme: Decorator = (Story, { globals }) => (
  <DesignSystemTheme
    theme={isTheme(globals["theme"]) ? globals["theme"] : undefined}
  >
    <Story />
  </DesignSystemTheme>
);

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i
      },
      sort: "none"
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    },
    darkMode: {
      current: "light",
      dark: themes.dark,
      light: themes.light
    },
    docs: {
      container: ThemedDocsContainer,
      codePanel: true
    },
    // Every story is snapshotted in both themes; the theme global is set
    // only here, so in Storybook the toolbar toggle decides
    chromatic: {
      modes: {
        light: { theme: "light" },
        dark: { theme: "dark" }
      }
    }
  },
  // Declared, with no toolbar, so Chromatic's modes can set it
  globalTypes: {
    theme: { description: "Design-system theme for visual tests" }
  },
  decorators: [withDesignSystemTheme],
  tags: ["autodocs"]
};

export default preview;

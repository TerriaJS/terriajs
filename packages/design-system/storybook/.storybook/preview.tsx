import type { Decorator, Preview } from "@storybook/react-vite";
import { themes } from "storybook/theming";
// layers.css first: the first @layer a page meets fixes the order
import "@terria/design-system/layers.css";
import "@terria/design-system/reset.css";
import "@terria/design-system/tokens.css";
import "@terria/design-system/base.css";
import "@terria/design-system/typography.css";
import "@terria/design-system/layout.css";
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
    options: {
      // Folders and components by name; a component's stories keep the order
      // they're written in, Docs first. Storybook reads this out of the file
      // and runs it as plain JavaScript, so it has no types and can't use
      // anything from outside it
      /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- untyped, as above */
      // @ts-expect-error: no types
      storySort: (a, b) =>
        a.title === b.title
          ? 0
          : a.title.localeCompare(b.title, undefined, { numeric: true })
      /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    },
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
      test: "error",
      config: {
        rules: [
          // Items named by their label slot and described by their
          // description slot, as React Aria wires them, read to axe as text
          // left out of the name
          { id: "label-content-name-mismatch", enabled: false }
        ]
      },
      // Full detail only for what needs fixing: every element that passed,
      // in every story, made the test results too big for Storybook to send
      // to its UI
      options: { resultTypes: ["violations", "incomplete"] }
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

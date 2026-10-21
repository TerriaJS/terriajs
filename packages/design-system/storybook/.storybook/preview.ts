import type { Decorator, Preview } from "@storybook/react-vite";
// layers.css first: the first @layer a page meets fixes the order
import "@terria/design-system/layers.css";
import "@terria/design-system/reset.css";
import "@terria/design-system/tokens.css";
import "@terria/design-system/base.css";
import "@terria/design-system/typography.css";
import "@terria/design-system/fonts.css";
import { themes } from "storybook/theming";

// The backgrounds toolbar doubles as the theme switch: the tokens define the
// dark theme under [data-theme="dark"] and the light theme on :root.
const withDesignSystemTheme: Decorator = (Story, context) => {
  const { backgrounds } = context.globals as {
    backgrounds?: { value?: string };
  };
  document.documentElement.setAttribute(
    "data-theme",
    backgrounds?.value === "dark" ? "dark" : "light"
  );
  return Story();
};

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
    docs: {
      theme: themes.light,
      codePanel: true
    },
    backgrounds: {
      options: {
        // Same token in both: data-theme decides which value it resolves to
        light: { name: "Light", value: "var(--terria-ds-surface-bg)" },
        dark: { name: "Dark", value: "var(--terria-ds-surface-bg)" }
      }
    }
  },
  initialGlobals: {
    backgrounds: { value: "light" }
  },
  decorators: [withDesignSystemTheme],
  tags: ["autodocs"]
};

export default preview;

import { DocsContainer } from "@storybook/addon-docs/blocks";
import { useLayoutEffect, type ComponentProps, type ReactNode } from "react";
import { useDarkMode } from "storybook-dark-mode";
import { themes } from "storybook/theming";

// storybook-dark-mode's toolbar toggle themes Storybook itself; the tokens
// switch on data-theme, so the preview's root follows it
export const DesignSystemTheme = ({
  children
}: {
  children: ReactNode;
}): ReactNode => {
  const theme = useDarkMode() ? "dark" : "light";
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return children;
};

// Docs pages follow the toggle too
export const ThemedDocsContainer = (
  props: ComponentProps<typeof DocsContainer>
): ReactNode => (
  <DocsContainer
    {...props}
    theme={useDarkMode() ? themes.dark : themes.light}
  />
);

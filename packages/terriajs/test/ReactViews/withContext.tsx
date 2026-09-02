import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { StyleSheetManager, ThemeProvider } from "styled-components";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { ViewStateProvider } from "../../lib/ReactViews/Context/ViewStateContext";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";
import { shouldForwardProp } from "../../lib/Styled/shouldForwardProp";

/**
 * The styled-components half of `ContextProviders`, for specs that render a
 * component without the full app shell.
 */
export const TerriaThemeProvider = (props: { children: ReactNode }) => (
  <StyleSheetManager shouldForwardProp={shouldForwardProp}>
    <ThemeProvider theme={terriaTheme}>{props.children}</ThemeProvider>
  </StyleSheetManager>
);

export function withThemeContext(node: ReactNode) {
  return <TerriaThemeProvider>{node}</TerriaThemeProvider>;
}

export function renderWithContexts(
  node: ReactElement,
  viewState: ViewState,
  renderOptions?: Omit<RenderOptions, "wrapper">
) {
  return render(node, {
    wrapper: ({ children }) => (
      <ViewStateProvider viewState={viewState}>
        <TerriaThemeProvider>{children}</TerriaThemeProvider>
      </ViewStateProvider>
    ),
    ...renderOptions
  });
}

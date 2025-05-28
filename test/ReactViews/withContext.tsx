import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { create, TestRendererOptions } from "react-test-renderer";
import { ThemeProvider } from "styled-components";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { ViewStateProvider } from "../../lib/ReactViews/Context/ViewStateContext";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";

export function withThemeContext(node: ReactNode) {
  return <ThemeProvider theme={terriaTheme}>{node}</ThemeProvider>;
}

/** Wrap react node in viewState and theme provider */
export function createWithContexts(
  viewState: ViewState,
  node: ReactNode,
  testRendererOptions?: TestRendererOptions
) {
  return create(
    <ViewStateProvider viewState={viewState}>
      <ThemeProvider theme={terriaTheme}>{node}</ThemeProvider>
    </ViewStateProvider>,
    testRendererOptions
  );
}

export function renderWithContexts(
  node: ReactElement,
  viewState: ViewState,
  renderOptions?: Omit<RenderOptions, "wrapper">
) {
  return render(node, {
    wrapper: ({ children }) => (
      <ViewStateProvider viewState={viewState}>
        <ThemeProvider theme={terriaTheme}>{children}</ThemeProvider>
      </ViewStateProvider>
    ),
    ...renderOptions
  });
}

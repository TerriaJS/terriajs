import React from "react";
import { create, TestRendererOptions } from "react-test-renderer";
import { ThemeProvider } from "styled-components";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";
import { ViewStateProvider } from "../../lib/ReactViews/Context";

export function withThemeContext(node: React.ReactNode) {
  return <ThemeProvider theme={terriaTheme}>{node}</ThemeProvider>;
}

/** Wrap react node in viewState and theme provider */
export function createWithContexts(
  viewState: ViewState,
  node: React.ReactNode,
  testRendererOptions?: TestRendererOptions
) {
  return create(
    <ViewStateProvider viewState={viewState}>
      <ThemeProvider theme={terriaTheme}>{node}</ThemeProvider>
    </ViewStateProvider>,
    testRendererOptions
  );
}

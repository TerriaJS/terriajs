import React from "react";
import { DefaultTheme, ThemeProvider } from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { ViewStateProvider } from "./ViewStateContext";

export default (props: {
  viewState: ViewState;
  theme: DefaultTheme | ((theme: DefaultTheme) => DefaultTheme);
  children: React.ReactNode[];
}) => (
  <ViewStateProvider viewState={props.viewState}>
    <ThemeProvider theme={props.theme}>{props.children}</ThemeProvider>
  </ViewStateProvider>
);

import { ReactNode } from "react";
import {
  DefaultTheme,
  StyleSheetManager,
  ThemeProvider
} from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { shouldForwardProp } from "../../Styled/shouldForwardProp";
import { ViewStateProvider } from "./ViewStateContext";

export const ContextProviders = (props: {
  viewState: ViewState;
  theme: DefaultTheme | ((theme: DefaultTheme | undefined) => DefaultTheme);
  children: ReactNode[] | ReactNode;
}) => (
  <ViewStateProvider viewState={props.viewState}>
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <ThemeProvider theme={props.theme}>{props.children}</ThemeProvider>
    </StyleSheetManager>
  </ViewStateProvider>
);

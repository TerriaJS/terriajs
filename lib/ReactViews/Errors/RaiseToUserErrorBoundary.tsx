import i18next from "i18next";
import React, { ErrorInfo } from "react";
import ViewState from "../../ReactViewModels/ViewState";

/**
 * An error boundary that raises the error to the user.
 */
export default class RaiseToUserErrorBoundary extends React.Component<{
  viewState: ViewState;
}> {
  state = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const newError = new Error(i18next.t("itemSearchTool.toolLoadError"));
    newError.name = error.name;
    newError.stack = error.stack;
    this.props.viewState.terria.raiseErrorToUser(newError);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

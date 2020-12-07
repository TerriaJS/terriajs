import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import ViewState from "../ReactViewModels/ViewState";
import SplitPoint from "./SplitPoint";

interface ToolProps extends WithTranslation {
  viewState: ViewState;
  toolName: string;
  getToolComponent: () => React.Component | Promise<React.Component>;
  params?: any;
}

/**
 * Loads the given tool component.
 *
 * Has an associated {@link CloseToolButton} displayed in the map menu.
 * The prop toolComponent can be an immediate React Component or a promise to
 * module that exports a default React Component. The promise is useful for
 * lazy-loading the tool.
 */
class Tool extends React.Component<ToolProps> {
  render() {
    const { viewState, getToolComponent, params, toolName, t } = this.props;
    const terria = viewState.terria;
    const loadComponent = (onLoad: any) => {
      Promise.resolve(getToolComponent())
        .then(component => onLoad(component))
        .catch(() =>
          terria.error.raiseEvent({
            title: t("tool.loadingError.title", { toolName }),
            message: t("tool.loadingError.message")
          })
        );
    };
    return (
      <SplitPoint
        loadComponent={loadComponent}
        viewState={viewState}
        {...params}
      />
    );
  }
}

export default withTranslation()(Tool);

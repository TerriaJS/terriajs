import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import ViewState from "../ReactViewModels/ViewState";
import SplitPoint from "./SplitPoint";

interface PropsType extends WithTranslation {
  viewState: ViewState;
  toolName: string;
  toolComponent: React.Component | Promise<any>;
  params: unknown;
}

/**
 * Loads the given tool component.
 *
 * Has an associated {@link CloseToolButton} displayed in the map menu.
 * The prop toolComponent can be an immediate React Component or a promise to
 * module that exports a default React Component. The promise is useful for
 * lazy-loading the tool.
 */
class Tool extends React.Component<PropsType> {
  render() {
    const { viewState, toolComponent, params, toolName, t } = this.props;
    const terria = viewState.terria;
    const loadComponent = (onLoad: any) => {
      return toolComponent instanceof Promise
        ? toolComponent
            .then(module => onLoad(module.default))
            .catch(() =>
              terria.error.raiseEvent({
                title: t("tool.loadingError.title", { toolName }),
                message: t("tool.loadingError.message")
              })
            )
        : onLoad(toolComponent);
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

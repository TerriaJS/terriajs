import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import ViewState from "../ReactViewModels/ViewState";
import SplitPoint from "./SplitPoint";
import { observer } from "mobx-react";
import { computed } from "mobx";
import Styles from "./Map/Navigation/tool_button.scss";
import MapIconButton from "./MapIconButton/MapIconButton";
import Icon from "./Icon";

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

interface ToolButtonProps extends ToolProps {
  icon: { id: string };
}

@observer
export class ToolButton extends React.Component<ToolButtonProps> {
  @computed
  get isThisToolOpen() {
    const currentTool = this.props.viewState.currentTool;
    return currentTool && currentTool.toolName === this.props.toolName;
  }

  toggleOpen() {
    const { viewState } = this.props;
    if (this.isThisToolOpen) {
      viewState.closeTool();
    } else {
      viewState.openTool({
        toolName: this.props.toolName,
        getToolComponent: this.props.getToolComponent,
        params: this.props.params,
        showCloseButton: false
      });
    }
  }

  render() {
    const { toolName, icon } = this.props;
    const buttonState = this.isThisToolOpen ? "open" : "closed";
    const buttonTitle = this.props.t // We need this check because some jsx files do not pass `t` prop
      ? this.props.t(`tool.button.${buttonState}`, {
          toolName,
          toolNameLowerCase: toolName.toLowerCase()
        })
      : toolName;
    return (
      <div className={Styles.toolButton}>
        <MapIconButton
          primary={this.isThisToolOpen}
          expandInPlace
          title={toolName}
          onClick={() => this.toggleOpen()}
          iconElement={() => <Icon glyph={icon} />}
          closeIconElement={() => <Icon glyph={Icon.GLYPHS.closeTool} />}
        >
          {buttonTitle}
        </MapIconButton>
      </div>
    );
  }
}

export default withTranslation()(Tool);

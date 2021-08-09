import { WithT } from "i18next";
import { computed } from "mobx";
import { observer } from "mobx-react";
import React, { Suspense, useEffect, useState } from "react";
import { useTranslation, WithTranslation } from "react-i18next";
import Terria from "../Models/Terria";
import ViewState from "../ReactViewModels/ViewState";
import Icon from "../Styled/Icon";
import Styles from "./Map/Navigation/tool_button.scss";
import MapIconButton from "./MapIconButton/MapIconButton";
import TerriaError from "../Core/TerriaError";

interface ToolProps {
  viewState: ViewState;
  toolName: string;
  getToolComponent: () => React.ComponentType | Promise<React.ComponentType>;
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
const Tool: React.FC<ToolProps> = props => {
  const { viewState, getToolComponent, params, toolName } = props;
  const [t] = useTranslation();

  // Track the tool component & props together so that we always
  // pass the right props to the right tool.
  const [toolAndProps, setToolAndProps] = useState<any>(undefined);
  useEffect(() => {
    setToolAndProps([
      React.lazy(() =>
        Promise.resolve(getToolComponent()).then(c => ({ default: c }))
      ),
      params
    ]);
  }, [getToolComponent]);

  let ToolComponent;
  let toolProps;
  if (toolAndProps !== undefined) [ToolComponent, toolProps] = toolAndProps;
  return (
    <ToolErrorBoundary t={t} toolName={toolName} terria={viewState.terria}>
      <Suspense fallback={<div>Loading...</div>}>
        {ToolComponent !== undefined ? (
          <ToolComponent {...toolProps} viewState={viewState} />
        ) : null}
      </Suspense>
    </ToolErrorBoundary>
  );
};

interface ToolButtonProps extends ToolProps, WithTranslation {
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

  componentWillUnmount() {
    // Close tool when if tool button unmounts
    if (this.isThisToolOpen) this.props.viewState.closeTool();
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

interface ToolErrorBoundaryProps extends WithT {
  terria: Terria;
  toolName: string;
  children: any;
}

class ToolErrorBoundary extends React.Component<
  ToolErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    const { terria, toolName, t } = this.props;
    terria.raiseErrorToUser(
      new TerriaError({
        title: t("tool.loadingError.title", { toolName }),
        message: t("tool.loadingError.message")
      })
    );
    this.setState({ hasError: true });
  }

  render() {
    return this.state.hasError === true ? null : this.props.children;
  }
}

export default Tool;

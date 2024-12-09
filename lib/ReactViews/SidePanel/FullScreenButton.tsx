import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { observer } from "mobx-react";
import { withTranslation } from "react-i18next";
import { Category, ViewAction } from "../../Core/AnalyticEvents/analyticEvents";
import Icon from "../../Styled/Icon";
import withControlledVisibility from "../HOCs/withControlledVisibility";
import { withViewState } from "../Context";
import Styles from "./full_screen_button.scss";

// The button to make the map full screen and hide the workbench.
@observer
class FullScreenButton extends React.Component {
  static propTypes = {
    viewState: PropTypes.object.isRequired,
    btnText: PropTypes.string,
    minified: PropTypes.bool,
    animationDuration: PropTypes.number, // Defaults to 1 millisecond.
    t: PropTypes.func.isRequired
  };

  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false
    };
  }

  toggleFullScreen() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.setIsMapFullScreen(
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      !this.props.viewState.isMapFullScreen
    );

    // log a GA event
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.terria.analytics?.logEvent(
      Category.view,
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.isMapFullScreen
        ? ViewAction.exitFullScreen
        : ViewAction.enterFullScreen
    );
  }

  renderButtonText() {
    // @ts-expect-error TS(2339): Property 'btnText' does not exist on type 'Readonl... Remove this comment to see the full error message
    const btnText = this.props.btnText ? this.props.btnText : null;
    // @ts-expect-error TS(2339): Property 'minified' does not exist on type 'Readon... Remove this comment to see the full error message
    if (this.props.minified) {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      if (this.props.viewState.isMapFullScreen) {
        return <Icon glyph={Icon.GLYPHS.right} />;
      } else {
        return <Icon glyph={Icon.GLYPHS.closeLight} />;
      }
    }
    return (
      <>
        <span>{btnText}</span>
        <Icon glyph={Icon.GLYPHS.right} />
      </>
    );
  }

  render() {
    const btnClassName = classNames(Styles.btn, {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      [Styles.isActive]: this.props.viewState.isMapFullScreen,
      // @ts-expect-error TS(2339): Property 'minified' does not exist on type 'Readon... Remove this comment to see the full error message
      [Styles.minified]: this.props.minified
    });
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    return (
      <div
        className={classNames(Styles.fullScreen, {
          // @ts-expect-error TS(2339): Property 'minified' does not exist on type 'Readon... Remove this comment to see the full error message
          [Styles.minifiedFullscreenBtnWrapper]: this.props.minified,
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          [Styles.trainerBarVisible]: this.props.viewState.trainerBarVisible
        })}
      >
        // @ts-expect-error TS(2339): Property 'minified' does not exist on type
        'Readon... Remove this comment to see the full error message
        {this.props.minified && (
          <label className={Styles.toggleWorkbench} htmlFor="toggle-workbench">
            // @ts-expect-error TS(2339): Property 'btnText' does not exist on
            type 'Readonl... Remove this comment to see the full error message
            {this.props.btnText}
          </label>
        )}
        <button
          type="button"
          id="toggle-workbench"
          aria-label={
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            this.props.viewState.isMapFullScreen
              ? t("sui.showWorkbench")
              : t("sui.hideWorkbench")
          }
          onClick={() => this.toggleFullScreen()}
          className={btnClassName}
          title={
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            this.props.viewState.isMapFullScreen
              ? t("sui.showWorkbench")
              : t("sui.hideWorkbench")
          }
        >
          {this.renderButtonText()}
        </button>
      </div>
    );
  }
}

export default withTranslation()(
  // @ts-expect-error TS(2345): Argument of type '{ ({ elementConfig, ...props }: ... Remove this comment to see the full error message
  withViewState(withControlledVisibility(FullScreenButton))
);

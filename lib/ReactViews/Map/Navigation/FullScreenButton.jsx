"use strict";
const React = require("react");
const createReactClass = require("create-react-class");
const PropTypes = require("prop-types");
import Styles from "./full_screen_button.scss";
import classNames from "classnames";
import Icon from "../../Icon";
import { withTranslation } from "react-i18next";

// The button to make the map full screen and hide the workbench.
const FullScreenButton = createReactClass({
  displayName: "FullScreenButton",

  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object.isRequired,
    animationDuration: PropTypes.number, // Defaults to 1 millisecond.
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      isActive: false
    };
  },

  toggleFullScreen() {
    this.props.viewState.setIsMapFullScreen(
      !this.props.viewState.isMapFullScreen
    );
  },

  renderButtonText() {
    const { t } = this.props;
    if (this.props.viewState.isMapFullScreen) {
      return <span className={Styles.exit}>{t("sui.showWorkbench")}</span>;
    } else {
      return <Icon glyph={Icon.GLYPHS.expand} />;
    }
  },

  render() {
    const { t } = this.props;
    const btnClassName = classNames(Styles.btn, {
      [Styles.isActive]: this.props.viewState.isMapFullScreen
    });
    const btnTitle = this.props.viewState.isMapFullScreen
      ? t("sui.showWorkbench")
      : t("sui.hideWorkbench");
    return (
      <div className={Styles.fullScreen}>
        <button
          type="button"
          onClick={this.toggleFullScreen}
          title={btnTitle}
          className={btnClassName}
        >
          <span>{this.renderButtonText()}</span>
        </button>
      </div>
    );
  }
});
export default withTranslation()(FullScreenButton);

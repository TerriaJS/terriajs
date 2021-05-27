import React from "react";
import PropTypes from "prop-types";
import Styles from "./augmented_virtuality_tool.scss";
import Icon from "../../../Styled/Icon";
import ViewerMode from "../../../Models/ViewerMode";
import { withTranslation } from "react-i18next";
import AugmentedVirtuality from "../../../Models/AugmentedVirtuality";
import { observer } from "mobx-react";
import { action, observable } from "mobx";
import classNames from "classnames";

@withTranslation()
@observer
class AugmentedVirtualityTool extends React.Component {
  @observable experimentalWarningShown = false;
  @observable realignHelpShown = false;
  @observable resetRealignHelpShown = false;

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    experimentalWarning: PropTypes.bool,
    t: PropTypes.func.isRequired
  };

  static defaultProps = {
    experimentalWarning: true
  };

  constructor(props) {
    super(props);
    this.augmentedVirtuality = new AugmentedVirtuality(this.props.terria);
  }

  @action.bound
  handleClickAVTool() {
    // Make the AugmentedVirtuality module avaliable elsewhere.
    this.props.terria.augmentedVirtuality = this.augmentedVirtuality;
    // feature detect for new ios 13
    // it seems you don't need to ask for both, but who knows, ios 14 / something
    // could change again
    if (
      window.DeviceMotionEvent &&
      // exists on window by now?
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState !== "granted") {
            console.error("couldn't get access for motion events");
          }
        })
        .catch(console.error);
    }
    if (
      window.DeviceOrientationEvent &&
      // exists on window by now?
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState !== "granted") {
            console.error("couldn't get access for orientation events");
          }
        })
        .catch(console.error);
    }

    if (
      this.props.experimentalWarning !== false &&
      !this.experimentalWarningShown
    ) {
      this.experimentalWarningShown = true;
      const { t } = this.props;
      this.props.viewState.terria.notificationState.addNotificationToQueue({
        title: t("AR.title"),
        message: t("AR.experimentalFeatureMessage"),
        confirmText: t("AR.confirmText")
      });
    }
    this.augmentedVirtuality.toggleEnabled();
  }

  @action.bound
  handleClickRealign() {
    if (!this.realignHelpShown) {
      this.realignHelpShown = true;
      const { t } = this.props;
      this.props.viewState.terria.notificationState.addNotificationToQueue({
        title: t("AR.manualAlignmentTitle"),
        message: t("AR.manualAlignmentMessage", {
          img:
            '<img width="100%" src="./build/TerriaJS/images/ar-realign-guide.gif" />'
        }),
        confirmText: t("AR.confirmText")
      });
    }

    this.augmentedVirtuality.toggleManualAlignment();
  }

  @action.bound
  handleClickResetRealign() {
    if (!this.resetRealignHelpShown) {
      this.resetRealignHelpShown = true;
      const { t } = this.props;
      this.props.viewState.terria.notificationState.addNotificationToQueue({
        title: t("AR.resetAlignmentTitle"),
        message: t("AR.resetAlignmentMessage"),
        confirmText: t("AR.confirmText")
      });
    }

    this.augmentedVirtuality.resetAlignment();
  }

  handleClickHover() {
    this.augmentedVirtuality.toggleHoverHeight();
  }

  render() {
    const enabled = this.augmentedVirtuality.isEnabled;
    let toggleImage = Icon.GLYPHS.arOff;
    let toggleStyle = Styles.btn;
    if (enabled) {
      toggleImage = Icon.GLYPHS.arOn;
      toggleStyle = Styles.btnPrimary;
    }
    const { t } = this.props;
    const realignment = this.augmentedVirtuality.manualAlignment;
    let realignmentStyle = Styles.btn;
    if (realignment) {
      realignmentStyle = Styles.btnBlink;
    }

    const hoverLevel = this.augmentedVirtuality.hoverLevel;
    let hoverImage = Icon.GLYPHS.arHover0;
    // Note: We use the image of the next level that we will be changing to, not the level the we are currently at.
    switch (hoverLevel) {
      case 0:
        hoverImage = Icon.GLYPHS.arHover0;
        break;
      case 1:
        hoverImage = Icon.GLYPHS.arHover1;
        break;
      case 2:
        hoverImage = Icon.GLYPHS.arHover2;
        break;
    }

    return (
      <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
        <div
          className={classNames(Styles.augmentedVirtualityTool, {
            [Styles.withTimeSeriesControls]:
              this.props.terria.timelineStack.top !== undefined
          })}
        >
          <button
            type="button"
            className={toggleStyle}
            title={t("AR.arTool")}
            onClick={this.handleClickAVTool}
          >
            <Icon glyph={toggleImage} />
          </button>

          <If condition={enabled}>
            <button
              type="button"
              className={Styles.btn}
              title={t("AR.btnHover")}
              onClick={() => this.handleClickHover()}
            >
              <Icon glyph={hoverImage} />
            </button>

            <If condition={!this.augmentedVirtuality.manualAlignmentSet}>
              <button
                type="button"
                className={realignmentStyle}
                title={t("AR.btnRealign")}
                onClick={this.handleClickRealign}
              >
                <Icon glyph={Icon.GLYPHS.arRealign} />
              </button>
            </If>

            <If
              condition={
                this.augmentedVirtuality.manualAlignmentSet && !realignment
              }
            >
              <button
                type="button"
                className={Styles.btn}
                title={t("AR.btnResetRealign")}
                onClick={this.handleClickResetRealign}
              >
                <Icon glyph={Icon.GLYPHS.arResetAlignment} />
              </button>
            </If>
          </If>
        </div>
      </If>
    );
  }
}

export default AugmentedVirtualityTool;

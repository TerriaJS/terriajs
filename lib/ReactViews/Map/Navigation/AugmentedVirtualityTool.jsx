"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./augmented_virtuality_tool.scss";
import Icon from "../../Icon";
import ViewerMode from "../../../Models/ViewerMode";
import defined from "terriajs-cesium/Source/Core/defined";
import { withTranslation } from "react-i18next";

import AugmentedVirtuality from "../../../Models/AugmentedVirtuality";

const AugmentedVirtualityTool = createReactClass({
  displayName: "AugmentedVirtualityTool",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    experimentalWarning: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      augmentedVirtuality: new AugmentedVirtuality(this.props.terria),
      experimentalWarningShown: false,
      realignHelpShown: false,
      resetRealignHelpShown: false
    };
  },

  handleClickAVTool() {
    // Make the AugmentedVirtuality module avaliable elsewhere.
    this.props.terria.augmentedVirtuality = this.state.augmentedVirtuality;

    if (
      defined(this.props.experimentalWarning) &&
      this.props.experimentalWarning !== false &&
      !this.state.experimentalWarningShown
    ) {
      this.setState({ experimentalWarningShown: true });
      const { t } = this.props;
      this.props.viewState.notifications.push({
        title: t("AR.title"),
        message: t("AR.experimentalFeatureMessage"),
        confirmText: t("AR.confirmText")
      });
    }

    this.state.augmentedVirtuality.toggleEnabled();
  },

  handleClickRealign() {
    if (!this.state.realignHelpShown) {
      this.setState({ realignHelpShown: true });
      const { t } = this.props;
      this.props.viewState.notifications.push({
        title: t("AR.manualAlignmentTitle"),
        message: t("AR.manualAlignmentMessage", {
          img:
            '<img width="100%" src="./build/TerriaJS/images/ar-realign-guide.gif" />'
        }),
        confirmText: t("AR.confirmText")
      });
    }

    this.state.augmentedVirtuality.toggleManualAlignment();
  },

  handleClickResetRealign() {
    if (!this.state.resetRealignHelpShown) {
      this.setState({ resetRealignHelpShown: true });
      const { t } = this.props;
      this.props.viewState.notifications.push({
        title: t("AR.resetAlignmentTitle"),
        message: t("AR.resetAlignmentMessage"),
        confirmText: t("AR.confirmText")
      });
    }

    this.state.augmentedVirtuality.resetAlignment();
  },

  handleClickHover() {
    this.state.augmentedVirtuality.toggleHoverHeight();
  },

  render() {
    const enabled = this.state.augmentedVirtuality.enabled;
    let toggleImage = Icon.GLYPHS.arOff;
    let toggleStyle = Styles.btn;
    if (enabled) {
      toggleImage = Icon.GLYPHS.arOn;
      toggleStyle = Styles.btnPrimary;
    }
    const { t } = this.props;
    const realignment = this.state.augmentedVirtuality.manualAlignment;
    let realignmentStyle = Styles.btn;
    if (realignment) {
      realignmentStyle = Styles.btnBlink;
    }

    const hoverLevel = this.state.augmentedVirtuality.hoverLevel;
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
        <div className={Styles.augmentedVirtualityTool}>
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
              onClick={this.handleClickHover}
            >
              <Icon glyph={hoverImage} />
            </button>

            <If condition={!this.state.augmentedVirtuality.manualAlignmentSet}>
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
                this.state.augmentedVirtuality.manualAlignmentSet &&
                !realignment
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
});

module.exports = withTranslation()(AugmentedVirtualityTool);

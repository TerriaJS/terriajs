"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";
import Slider from "rc-slider";

import ViewerMode from "../../../Models/ViewerMode";
import ObserveModelMixin from "../../ObserveModelMixin";
import MenuPanel from "../../StandardUserInterface/customizable/MenuPanel.jsx";
import Icon from "../../Icon.jsx";
import { withTranslation } from "react-i18next";

import Styles from "./setting-panel.scss";
import DropdownStyles from "./panel.scss";

// The basemap and viewer setting panel
const SettingPanel = createReactClass({
  displayName: "SettingPanel",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    allBaseMaps: PropTypes.array,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    const { t } = this.props;
    return {
      activeMap: this.props.terria.baseMap
        ? this.props.terria.baseMap.name
        : t("settingPanel.none")
    };
  },

  selectBaseMap(baseMap, event) {
    event.stopPropagation();
    this.props.terria.baseMap = baseMap.catalogItem;
    this.props.terria.baseMapContrastColor = baseMap.contrastColor;

    // We store the user's chosen basemap for future use, but it's up to the instance to decide
    // whether to use that at start up.
    this.props.terria.setLocalProperty("basemap", baseMap.catalogItem.name);
  },

  mouseEnterBaseMap(baseMap) {
    this.setState({
      activeMap: baseMap.catalogItem.name
    });
  },

  mouseLeaveBaseMap() {
    const { t } = this.props;
    this.setState({
      activeMap: this.props.terria.baseMap
        ? this.props.terria.baseMap.name
        : t("settingPanel.none")
    });
  },

  selectViewer(viewer, event) {
    event.stopPropagation();

    let newViewerMode;
    switch (viewer) {
      case 0:
        newViewerMode = ViewerMode.CesiumTerrain;
        break;
      case 1:
        newViewerMode = ViewerMode.CesiumEllipsoid;
        break;
      case 2:
        newViewerMode = ViewerMode.Leaflet;
        break;
      default:
        return;
    }
    this.props.terria.viewerMode = newViewerMode;

    // We store the user's chosen viewer mode for future use.
    this.props.terria.setLocalProperty("viewermode", newViewerMode);
    this.props.terria.currentViewer.notifyRepaintRequired();
  },

  render() {
    const { t } = this.props;
    const viewerModeLabels = {
      [ViewerMode.CesiumTerrain]: t(
        "settingPanel.viewerModeLabels.CesiumTerrain"
      ),
      [ViewerMode.CesiumEllipsoid]: t(
        "settingPanel.viewerModeLabels.CesiumEllipsoid"
      ),
      [ViewerMode.Leaflet]: t("settingPanel.viewerModeLabels.Leaflet")
    };

    const qualityLabels = {
      0: t("settingPanel.qualityLabels.maximumPerformance"),
      1: t("settingPanel.qualityLabels.balancedPerformance"),
      2: t("settingPanel.qualityLabels.lowerPerformance")
    };
    const that = this;
    const useNativeResolution = this.props.terria.useNativeResolution;
    const currentViewer = this.props.terria.viewerMode;
    const currentBaseMap = this.props.terria.baseMap
      ? this.props.terria.baseMap.name
      : t("settingPanel.none");

    const nativeResolutionLabel = t("settingPanel.nativeResolutionLabel", {
      resolution1: useNativeResolution
        ? t("settingPanel.native")
        : t("settingPanel.screen"),
      resolution2: useNativeResolution
        ? t("settingPanel.screen")
        : t("settingPanel.native")
    });
    const dropdownTheme = {
      outer: Styles.settingPanel,
      inner: Styles.dropdownInner,
      btn: Styles.btnDropdown,
      icon: "map"
    };

    const viewerModes = [];

    if (
      this.props.terria.configParameters.useCesiumIonTerrain ||
      this.props.terria.configParameters.cesiumTerrainUrl
    ) {
      viewerModes.push(ViewerMode.CesiumTerrain);
    }

    viewerModes.push(ViewerMode.CesiumEllipsoid, ViewerMode.Leaflet);

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnTitle={t("settingPanel.btnTitle")}
        btnText={t("settingPanel.btnText")}
        viewState={this.props.viewState}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <div className={classNames(Styles.viewer, DropdownStyles.section)}>
          <label className={DropdownStyles.heading}>
            {" "}
            {t("settingPanel.mapView")}{" "}
          </label>
          <ul className={Styles.viewerSelector}>
            <For each="viewerMode" of={viewerModes}>
              <li key={viewerMode} className={Styles.listItem}>
                <button
                  onClick={that.selectViewer.bind(this, viewerMode)}
                  className={classNames(Styles.btnViewer, {
                    [Styles.isActive]: viewerMode === currentViewer
                  })}
                >
                  {viewerModeLabels[viewerMode]}
                </button>
              </li>
            </For>
          </ul>
        </div>
        <div className={classNames(Styles.baseMap, DropdownStyles.section)}>
          <label className={DropdownStyles.heading}>
            {" "}
            {t("settingPanel.baseMap")}{" "}
          </label>
          <label className={DropdownStyles.subHeading}>
            {this.state.activeMap}
          </label>
          <ul className={Styles.baseMapSelector}>
            <For each="baseMap" index="i" of={this.props.allBaseMaps}>
              <li key={i} className={Styles.listItem}>
                <button
                  className={classNames(Styles.btnBaseMap, {
                    [Styles.isActive]:
                      baseMap.catalogItem.name === currentBaseMap
                  })}
                  onClick={that.selectBaseMap.bind(this, baseMap)}
                  onMouseEnter={that.mouseEnterBaseMap.bind(this, baseMap)}
                  onMouseLeave={that.mouseLeaveBaseMap.bind(this, baseMap)}
                  onFocus={that.mouseEnterBaseMap.bind(this, baseMap)}
                >
                  {baseMap.catalogItem.name === currentBaseMap ? (
                    <Icon glyph={Icon.GLYPHS.selected} />
                  ) : null}
                  <img alt={baseMap.catalogItem.name} src={baseMap.image} />
                </button>
              </li>
            </For>
          </ul>
        </div>
        <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
          <div className={DropdownStyles.section}>
            <label className={DropdownStyles.heading}>
              {t("settingPanel.imageOptimisation")}
            </label>
            <section
              className={Styles.nativeResolutionWrapper}
              title={qualityLabels[this.props.terria.quality]}
            >
              <button
                id="mapUseNativeResolution"
                type="button"
                onClick={() =>
                  (this.props.terria.useNativeResolution = !useNativeResolution)
                }
                title={nativeResolutionLabel}
                className={Styles.btnNativeResolution}
              >
                {useNativeResolution ? (
                  <Icon glyph={Icon.GLYPHS.checkboxOn} />
                ) : (
                  <Icon glyph={Icon.GLYPHS.checkboxOff} />
                )}
              </button>
              <label
                title={nativeResolutionLabel}
                htmlFor="mapUseNativeResolution"
                className={classNames(
                  DropdownStyles.subHeading,
                  Styles.nativeResolutionHeader
                )}
              >
                {t("settingPanel.nativeResolutionHeader")}
              </label>
            </section>
            <label
              htmlFor="mapQuality"
              className={classNames(DropdownStyles.subHeading)}
            >
              {t("settingPanel.mapQuality")}
            </label>
            <section
              className={Styles.qualityWrapper}
              title={qualityLabels[this.props.terria.quality]}
            >
              <label
                className={classNames(
                  DropdownStyles.subHeading,
                  Styles.qualityLabel
                )}
              >
                {t("settingPanel.qualityLabel")}
              </label>
              <Slider
                id="mapMaximumScreenSpaceError"
                className={Styles.opacitySlider}
                min={1}
                max={3}
                step={0.1}
                value={this.props.terria.baseMaximumScreenSpaceError}
                onChange={val =>
                  (this.props.terria.baseMaximumScreenSpaceError = val)
                }
                marks={{ 2: "" }}
                // Awaiting https://github.com/react-component/slider/pull/420
                // aria-valuetext={qualityLabels[this.props.terria.quality]}
              />
              <label
                className={classNames(
                  DropdownStyles.subHeading,
                  Styles.qualityLabel
                )}
              >
                {t("settingPanel.performanceLabel")}
              </label>
            </section>
          </div>
        </If>
      </MenuPanel>
    );
  }
});

module.exports = withTranslation()(SettingPanel);

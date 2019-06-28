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

import Styles from "./setting-panel.scss";
import DropdownStyles from "./panel.scss";

const viewerModeLabels = {
  [ViewerMode.CesiumTerrain]: "3D Terrain",
  [ViewerMode.CesiumEllipsoid]: "3D Smooth",
  [ViewerMode.Leaflet]: "2D"
};

const qualityLabels = {
  0: "Maximum performance, lower quality",
  1: "Balanced performance & quality",
  2: "Maximum quality, lower performance"
};

// The basemap and viewer setting panel
const SettingPanel = createReactClass({
  displayName: "SettingPanel",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    allBaseMaps: PropTypes.array,
    viewState: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      activeMap: this.props.terria.baseMap
        ? this.props.terria.baseMap.name
        : "(None)"
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
    this.setState({
      activeMap: this.props.terria.baseMap
        ? this.props.terria.baseMap.name
        : "(None)"
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
    const that = this;
    const currentViewer = this.props.terria.viewerMode;
    const currentBaseMap = this.props.terria.baseMap
      ? this.props.terria.baseMap.name
      : "(None)";

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
        btnTitle="Change view"
        btnText="Map"
        viewState={this.props.viewState}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <div className={classNames(Styles.viewer, DropdownStyles.section)}>
          <label className={DropdownStyles.heading}> Map View </label>
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
          <label className={DropdownStyles.heading}> Base Map </label>
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
            <label
              htmlFor="mapQuality"
              className={classNames(
                DropdownStyles.subHeading,
                Styles.qualityHeading
              )}
            >
              Optimise for:
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
                Performance
              </label>
              <Slider
                id="mapQuality"
                className={Styles.opacitySlider}
                min={0}
                max={2}
                value={this.props.terria.quality}
                onChange={val => (this.props.terria.quality = val)}
                // Awaiting https://github.com/react-component/slider/pull/420
                // aria-valuetext={qualityLabels[this.props.terria.quality]}
              />
              <label
                className={classNames(
                  DropdownStyles.subHeading,
                  Styles.qualityLabel
                )}
              >
                Quality
              </label>
            </section>
          </div>
        </If>
      </MenuPanel>
    );
  }
});

module.exports = SettingPanel;

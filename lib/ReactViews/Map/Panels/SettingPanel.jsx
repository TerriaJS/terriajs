"use strict";

import classNames from "classnames";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
// eslint-disable-next-line no-unused-vars
import Terria from "../../../Models/Terria";
// eslint-disable-next-line no-unused-vars
import ViewState from "../../../ReactViewModels/ViewState";
import Icon from "../../Icon";
import MenuPanel from "../../StandardUserInterface/customizable/MenuPanel";
import Slider from "rc-slider";
import ViewerMode from "../../../Models/ViewerMode";
import DropdownStyles from "./panel.scss";
import Styles from "./setting-panel.scss";

const qualityLabels = {
  0: "Maximum performance, lower quality",
  1: "Balanced performance & quality",
  2: "Maximum quality, lower performance"
};

// The basemap and viewer setting panel
/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {ViewState} viewState
 *
 * @extends {React.Component<Props>}
 */
@observer
class SettingPanel extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    // allBaseMaps: PropTypes.array,
    viewState: PropTypes.object.isRequired
  };

  /**
   * @param {Props} props
   */
  constructor(props) {
    super(props);
    this.state = {
      activeMapName: props.terria.mainViewer.baseMap
        ? props.terria.mainViewer.baseMap.name
        : "(None)"
    };
  }

  selectBaseMap(baseMap, event) {
    event.stopPropagation();
    runInAction(() => {
      this.props.terria.mainViewer.baseMap = baseMap.mappable;
    });
    // this.props.terria.baseMapContrastColor = baseMap.contrastColor;

    // We store the user's chosen basemap for future use, but it's up to the instance to decide
    // whether to use that at start up.
    // this.props.terria.setLocalProperty('basemap', baseMap.catalogItem.name);
  }

  mouseEnterBaseMap(baseMap) {
    this.setState({
      activeMapName: baseMap.mappable.name
    });
  }

  mouseLeaveBaseMap() {
    this.setState({
      activeMapName: this.props.terria.mainViewer.baseMap
        ? this.props.terria.mainViewer.baseMap.name
        : "(None)"
    });
  }

  @action
  selectViewer(viewer, event) {
    const mainViewer = this.props.terria.mainViewer;
    event.stopPropagation();
    if (viewer === "3D Terrain" || viewer === "3D Smooth") {
      mainViewer.viewerMode = "cesium";
      mainViewer.viewerOptions.useTerrain = viewer === "3D Terrain";
    } else if (viewer === "2D") {
      mainViewer.viewerMode = "leaflet";
    } else {
      console.error(`Trying to select ViewerMode ${viewer} that doesn't exist`);
    }
    // We store the user's chosen viewer mode for future use.
    // this.props.terria.setLocalProperty('viewermode', newViewerMode);
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  render() {
    if (!this.props.terria.mainViewer) {
      return null;
    }

    const currentViewer =
      this.props.terria.mainViewer.viewerMode === "cesium"
        ? this.props.terria.mainViewer.viewerOptions.useTerrain
          ? "3D Terrain"
          : "3D Smooth"
        : "2D";

    const useNativeResolution = this.props.terria.useNativeResolution;
    const nativeResolutionLabel = `Press to stop using ${
      useNativeResolution ? "native" : "screen"
    } resolution and start using ${
      useNativeResolution ? "screen" : "native"
    } resolution`;

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
      viewerModes.push("3D Terrain");
    }

    viewerModes.push("3D Smooth", "2D");

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
                  onClick={this.selectViewer.bind(this, viewerMode)}
                  className={classNames(Styles.btnViewer, {
                    [Styles.isActive]: viewerMode === currentViewer
                  })}
                >
                  {viewerMode}
                </button>
              </li>
            </For>
          </ul>
        </div>
        <div className={classNames(Styles.baseMap, DropdownStyles.section)}>
          <label className={DropdownStyles.heading}> Base Map </label>
          <label className={DropdownStyles.subHeading}>
            {this.state.activeMapName}
          </label>
          <ul className={Styles.baseMapSelector}>
            <For each="baseMap" index="i" of={this.props.terria.baseMaps}>
              <li key={i} className={Styles.listItem}>
                <button
                  className={classNames(Styles.btnBaseMap, {
                    [Styles.isActive]:
                      baseMap.mappable === this.props.terria.mainViewer.baseMap
                  })}
                  onClick={this.selectBaseMap.bind(this, baseMap)}
                  onMouseEnter={this.mouseEnterBaseMap.bind(this, baseMap)}
                  onMouseLeave={this.mouseLeaveBaseMap.bind(this, baseMap)}
                  onFocus={this.mouseEnterBaseMap.bind(this, baseMap)}
                >
                  {baseMap.mappable === this.props.terria.mainViewer.baseMap ? (
                    <Icon glyph={Icon.GLYPHS.selected} />
                  ) : null}
                  <img alt={baseMap.mappable.name} src={baseMap.image} />
                </button>
              </li>
            </For>
          </ul>
        </div>
        <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
          <div className={DropdownStyles.section}>
            <label className={DropdownStyles.heading}>Image Optimisation</label>
            <section
              className={Styles.nativeResolutionWrapper}
              title={qualityLabels[this.props.terria.quality]}
            >
              <button
                id="mapUseNativeResolution"
                type="button"
                onClick={() => {
                  runInAction(() => {
                    this.props.terria.useNativeResolution = !useNativeResolution;
                  });
                }}
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
                Use native device resolution
              </label>
            </section>
            <label
              htmlFor="mapQuality"
              className={classNames(DropdownStyles.subHeading)}
            >
              Raster Map Quality:
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
                Quality
              </label>
              <Slider
                id="mapMaximumScreenSpaceError"
                className={Styles.opacitySlider}
                min={1}
                max={3}
                step={0.1}
                value={this.props.terria.baseMaximumScreenSpaceError}
                onChange={val => {
                  runInAction(() => {
                    this.props.terria.baseMaximumScreenSpaceError = val;
                  });
                }}
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
                Performance
              </label>
            </section>
          </div>
        </If>
      </MenuPanel>
    );
  }
}

export default SettingPanel;

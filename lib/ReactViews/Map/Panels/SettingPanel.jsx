"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";
import { observer } from "mobx-react";
import { action, set } from "mobx";

// import ViewerMode from "../../../Models/ViewerMode";
import ObserveModelMixin from "../../ObserveModelMixin";
import MenuPanel from "../../StandardUserInterface/customizable/MenuPanel";
import Icon from "../../Icon";

import Styles from "./setting-panel.scss";
import DropdownStyles from "./panel.scss";

// const viewerModeLabels = {
//   [ViewerMode.CesiumTerrain]: "3D Terrain",
//   [ViewerMode.CesiumEllipsoid]: "3D Smooth",
//   [ViewerMode.Leaflet]: "2D"
// };

// The basemap and viewer setting panel
@observer
class SettingPanel extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    // allBaseMaps: PropTypes.array,
    viewState: PropTypes.object.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      activeMapName: props.terria.baseMap
        ? props.terria.baseMap.name
        : "(None)"
    };
  }

  selectBaseMap(baseMap, event) {
    event.stopPropagation();
    this.props.terria.mainViewer.baseMap = baseMap.mappable;
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
      mainViewer.viewerOptions.cesium.useTerrain =
        viewer === "3D Terrain";
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
        ? this.props.terria.mainViewer.viewerOptions.cesium.useTerrain
          ? "3D Terrain"
          : "3D Smooth"
        : "2D";
    // const currentBaseMap = this.props.terria.baseMap ? this.props.terria.baseMap.name : '(None)';

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
                      baseMap.mappable ===
                      this.props.terria.mainViewer.baseMap
                  })}
                  onClick={this.selectBaseMap.bind(this, baseMap)}
                  onMouseEnter={this.mouseEnterBaseMap.bind(this, baseMap)}
                  onMouseLeave={this.mouseLeaveBaseMap.bind(this, baseMap)}
                  onFocus={this.mouseEnterBaseMap.bind(this, baseMap)}
                >
                  {baseMap.mappable ===
                  this.props.terria.mainViewer.baseMap ? (
                    <Icon glyph={Icon.GLYPHS.selected} />
                  ) : null}
                  <img alt={baseMap.mappable.name} src={baseMap.image} />
                </button>
              </li>
            </For>
          </ul>
        </div>
      </MenuPanel>
    );
  }
}

export default SettingPanel;

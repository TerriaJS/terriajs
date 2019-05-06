'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import ViewerMode from '../../../Models/ViewerMode';
import ObserveModelMixin from '../../ObserveModelMixin';
import MenuPanel from '../../StandardUserInterface/customizable/MenuPanel';
import Icon from "../../Icon";

import Styles from './setting-panel.scss';
import DropdownStyles from './panel.scss';

const viewerModeLabels = {
    [ViewerMode.CesiumTerrain]: '3D Terrain',
    [ViewerMode.CesiumEllipsoid]: '3D Smooth',
    [ViewerMode.Leaflet]: '2D'
};

// The basemap and viewer setting panel
const SettingPanel = observer(createReactClass({
    displayName: 'SettingPanel',

    propTypes: {
        terria: PropTypes.object.isRequired,
        // allBaseMaps: PropTypes.array,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            activeMap: this.props.terria.baseMap ? this.props.terria.baseMap.name : '(None)'
        };
    },

    selectBaseMap(baseMap, event) {
        event.stopPropagation();
        this.props.terria.baseMap = baseMap.catalogItem;
        // this.props.terria.baseMapContrastColor = baseMap.contrastColor;

        // We store the user's chosen basemap for future use, but it's up to the instance to decide
        // whether to use that at start up.
        // this.props.terria.setLocalProperty('basemap', baseMap.catalogItem.name);
    },

    mouseEnterBaseMap(baseMap) {
        this.setState({
            activeMap: baseMap.catalogItem.name
        });
    },

    mouseLeaveBaseMap() {
        this.setState({
            activeMap: this.props.terria.baseMap ? this.props.terria.baseMap.name : '(None)'
        });
    },

    selectViewer(viewer, event) {
        event.stopPropagation();
        if (viewer === ViewerMode.CesiumTerrain || viewer === ViewerMode.CesiumEllipsoid) {
            this.props.terria.terriaViewer.viewerMode = 'cesium';
        } else if (ViewerMode.Leaflet) {
            this.props.terria.terriaViewer.viewerMode = 'leaflet';
        } else {
            console.error(`Trying to select ViewerMode ${viewer} that doesn't exist`);
        }
        // We store the user's chosen viewer mode for future use.
        // this.props.terria.setLocalProperty('viewermode', newViewerMode);
        this.props.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        if (!this.props.terria.terriaViewer) {
            return null;
        }

        const that = this;
        const currentViewer = this.props.terria.viewerMode;
        // const currentBaseMap = this.props.terria.baseMap ? this.props.terria.baseMap.name : '(None)';

        const dropdownTheme = {
            outer: Styles.settingPanel,
            inner: Styles.dropdownInner,
            btn: Styles.btnDropdown,
            icon: 'map'
        };

        const viewerModes = [];

        if (this.props.terria.configParameters.useCesiumIonTerrain || this.props.terria.configParameters.cesiumTerrainUrl) {
            viewerModes.push(ViewerMode.CesiumTerrain);
        }

        viewerModes.push(
            ViewerMode.CesiumEllipsoid,
            ViewerMode.Leaflet
        );

        return (
            <MenuPanel theme={dropdownTheme} btnTitle="Change view" btnText="Map" viewState={this.props.viewState}
                       smallScreen={this.props.viewState.useSmallScreenInterface}>
                <div className={classNames(Styles.viewer, DropdownStyles.section)}>
                    <label className={DropdownStyles.heading}> Map View </label>
                    <ul className={Styles.viewerSelector}>
                        <For each="viewerMode" of={viewerModes}>
                            <li key={viewerMode} className={Styles.listItem}>
                                <button onClick={that.selectViewer.bind(this, viewerMode)}
                                        className={classNames(Styles.btnViewer, {[Styles.isActive]: viewerMode === currentViewer})}>
                                    {viewerModeLabels[viewerMode]}
                                </button>
                            </li>
                        </For>
                    </ul>
                </div>
                {/* <div className={classNames(Styles.baseMap, DropdownStyles.section)}>
                    <label className={DropdownStyles.heading}> Base Map </label>
                    <label className={DropdownStyles.subHeading}>{this.state.activeMap}</label>
                    <ul className={Styles.baseMapSelector}>
                        <For each="baseMap" index="i" of={this.props.allBaseMaps}>
                            <li key={i} className={Styles.listItem}>
                                <button
                                    className={classNames(Styles.btnBaseMap, {[Styles.isActive]: baseMap.catalogItem.name === currentBaseMap })}
                                    onClick={that.selectBaseMap.bind(this, baseMap)}
                                    onMouseEnter={that.mouseEnterBaseMap.bind(this, baseMap)}
                                    onMouseLeave={that.mouseLeaveBaseMap.bind(this, baseMap)}
                                    onFocus={that.mouseEnterBaseMap.bind(this, baseMap)}>
                                    {baseMap.catalogItem.name === currentBaseMap ? <Icon glyph={Icon.GLYPHS.selected }/>: null }
                                    <img alt={baseMap.catalogItem.name} src={baseMap.image}/>
                                </button>
                            </li>
                        </For>
                    </ul>
                </div> */}
            </MenuPanel>
        );
    },
}));

module.exports = SettingPanel;

'use strict';

import React from 'react';
import classNames from 'classnames';

import ViewerMode from '../../../Models/ViewerMode';
import ObserveModelMixin from '../../ObserveModelMixin';
import DropdownPanel from './DropdownPanel.jsx';
import Icon from "../../Icon.jsx";

import Styles from './setting-panel.scss';
import DropdownStyles from './dropdown-panel.scss';

// The basemap and viewer setting panel
const SettingPanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewerModes: React.PropTypes.array,
        allBaseMaps: React.PropTypes.array,
        viewState: React.PropTypes.object.isRequired
    },

    getDefaultProps() {
        return {
            viewerModes: ['3D Terrain', '3D Smooth', '2D'],
            allBaseMaps: []
        };
    },

    getInitialState() {
        return {
            activeMap: this.props.terria.baseMap.name
        };
    },

    selectBaseMap(baseMap, event) {
        event.stopPropagation();
        this.props.terria.baseMap = baseMap.catalogItem;
        this.props.terria.baseMapContrastColor = baseMap.contrastColor;

        // We store the user's chosen basemap for future use, but it's up to the instance to decide
        // whether to use that at start up.
        this.props.terria.setLocalProperty('basemap', baseMap.catalogItem.name);
    },

    mouseEnterBaseMap(baseMap) {
        this.setState({
            activeMap: baseMap.catalogItem.name
        });
    },

    mouseLeaveBaseMap() {
        this.setState({
            activeMap: this.props.terria.baseMap.name
        });
    },

    selectViewer(viewer, event) {
        event.stopPropagation();
        switch (viewer) {
            case 0:
                this.props.terria.viewerMode = ViewerMode.CesiumTerrain;
                break;
            case 1:
                this.props.terria.viewerMode = ViewerMode.CesiumEllipsoid;
                break;
            case 2:
                this.props.terria.viewerMode = ViewerMode.Leaflet;
                break;
            default:
                return;
        }
    },

    render() {
        const that = this;
        const currentViewer = this.props.terria.viewerMode;
        const currentBaseMap = this.props.terria.baseMap.name;

        const dropdownTheme = {
            outer: Styles.settingPanel,
            inner: Styles.dropdownInner,
            btn: Styles.btnDropdown,
            icon: 'sphere'
        };

        return (
            <DropdownPanel theme={dropdownTheme} btnTitle="Change view" btnText="Map" viewState={this.props.viewState}>
                <div className={classNames(Styles.viewer, DropdownStyles.section)}>
                    <label className={DropdownStyles.heading}> Map View </label>
                    <ul className={Styles.viewerSelector}>
                        <For each="viewerMode" of={this.props.viewerModes} index="i">
                            <li key={i} className={Styles.listItem}>
                                <button onClick={that.selectViewer.bind(this, i)}
                                        className={classNames(Styles.btnViewer, {[Styles.isActive]: i === currentViewer})}>
                                    {viewerMode}
                                </button>
                            </li>
                        </For>
                    </ul>
                </div>
                <div className={classNames(Styles.baseMap, DropdownStyles.section)}>
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
                                    {baseMap.catalogItem.name === currentBaseMap ? <Icon glyph={Icon.GLYPHS.selected }/>: <Icon glyph={Icon.GLYPHS.radioOff}/>}
                                    <img alt={baseMap.catalogItem.name} src={baseMap.image}/>
                                </button>
                            </li>
                        </For>
                    </ul>
                </div>
            </DropdownPanel>
        );
    }
});

module.exports = SettingPanel;

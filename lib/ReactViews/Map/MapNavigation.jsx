'use strict';

import React from 'react';

import Compass from './Navigation/Compass.jsx';
import MyLocation from './Navigation/MyLocation.jsx';
import MeasureTool from './Navigation/MeasureTool.jsx';
import ZoomControl from './Navigation/ZoomControl.jsx';
import SettingPanel from './Panels/SettingPanel.jsx';
import SharePanel from './Panels/SharePanel/SharePanel.jsx';

import FullScreenButton from './Navigation/FullScreenButton.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import ViewerMode from '../../Models/ViewerMode';

import Styles from './map-navigation.scss';

// The map navigation region
const MapNavigation = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired,
        allBaseMaps: React.PropTypes.array,
    },

    render() {
        return (
            <div className={Styles.mapNavigation}>
                <ul className={Styles.menu}>
                    <li className={Styles.menuItem}>
                        <FullScreenButton terria={this.props.terria} viewState={this.props.viewState} />
                    </li>
                    <li className={Styles.menuItem}>
                        <SettingPanel terria={this.props.terria} allBaseMaps={this.props.allBaseMaps}/>
                    </li>
                    <li className={Styles.menuItem}>
                        <SharePanel terria={this.props.terria}/>
                    </li>
                    <li className={Styles.menuItem}>
                        <div><a className={Styles.btnAboutLink} href='#' title='about'> About </a></div>
                    </li>
                </ul>
                <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
                    <Compass terria={this.props.terria}/>
                </If>
                <MyLocation terria={this.props.terria}/>
                <MeasureTool terria={this.props.terria}/>
                <ZoomControl terria={this.props.terria}/>
            </div>
        );
    }
});

export default MapNavigation;

'use strict';
import React from 'react';
import SettingPanel from './SettingPanel.jsx';
import Compass from './Compass.jsx';
import ZoomControl from './ZoomControl.jsx';
import SharePanel from './SharePanel.jsx';
import FullScreenButton from './FullScreenButton.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from './ObserveModelMixin';
import ViewerMode from '../Models/ViewerMode';

// The map navigation region
// This component could probably be put in index.js of nationalmap?
const MapNavigation = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        allBaseMaps: React.PropTypes.array,
        terriaViewer: React.PropTypes.object
    },

    render() {
        let compass = null;
        // show compass if we are in cesium mode
        if (this.props.terria.viewerMode !== ViewerMode.Leaflet) {
            compass = <Compass terria={this.props.terria} />;
        }
        return (<div className='map-navigation'>
              <ul className='list-reset flex map-navigation__menu'>
              <li><SettingPanel terria= {this.props.terria} allBaseMaps = {this.props.allBaseMaps} terriaViewer={this.props.terriaViewer}/></li>
              <li><FullScreenButton terria={this.props.terria} /></li>
              <li><SharePanel terria={this.props.terria}/></li>
              <li><a className='btn btn-map about-link__button' href='#'> About </a></li>
              </ul>
              {compass}
              <ZoomControl terria={this.props.terria} />
              </div>);
    }
});
module.exports = MapNavigation;

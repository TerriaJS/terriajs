'use strict';
import React from 'react';
import SettingPanel from './SettingPanel.jsx';
import Compass from './Compass.jsx';
import ZoomControl from './ZoomControl.jsx';
import SharePanel from './SharePanel.jsx';
import FullScreenButton from './FullScreenButton.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import ViewerMode from '../Models/ViewerMode';

// The map navigation region
const MapNavigation = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        allBaseMaps: React.PropTypes.array,
        terriaViewer: React.PropTypes.object
    },

    render() {
        return (<div className='map-navigation'>
              <ul className='map-navigation__menu'>
                <li><SettingPanel terria= {this.props.terria} allBaseMaps = {this.props.allBaseMaps} terriaViewer={this.props.terriaViewer}/></li>
                <li><FullScreenButton terria={this.props.terria} /></li>
                <li><SharePanel terria={this.props.terria}/></li>
                <li><a className='btn btn--map about-link__button' href='#' title='about'> About </a></li>
              </ul>
              {(this.props.terria.viewerMode !== ViewerMode.Leaflet) && <Compass terria={this.props.terria} />}
              <ZoomControl terria={this.props.terria} />
              </div>);
    }
});
module.exports = MapNavigation;

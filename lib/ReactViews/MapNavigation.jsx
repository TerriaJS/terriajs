'use strict';
const React = require('react');
const SettingPanel = require('./SettingPanel.jsx');
const Compass = require('./Compass.jsx');
const ZoomControl = require('./ZoomControl.jsx');
const SharePanel = require('./SharePanel.jsx');
const FullScreenButton = require('./FullScreenButton.jsx');
const defined = require('terriajs-cesium/Source/Core/defined');

// The map navigation region
// This component could probably be put in index.js of nationalmap?
const MapNavigation = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        allBaseMaps: React.PropTypes.array,
        terriaViewer: React.PropTypes.object
    },

    render() {
        let compass = null;
        // show compass if we are in cesium mode
        if (defined(this.props.terria.cesium)) {
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

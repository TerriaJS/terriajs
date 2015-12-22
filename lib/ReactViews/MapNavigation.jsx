'use strict';
var React = require('react');
var SettingPanel = require('./SettingPanel.jsx'),
    Compass = require('./Compass.jsx'),
    ZoomControl = require('./ZoomControl.jsx'),
    SharePanel = require('./SharePanel.jsx'),
    FullScreenButton = require('./FullScreenButton.jsx'),
    defined = require('terriajs-cesium/Source/Core/defined');

// The map navigation region
// This component could probably be put in index.js of nationalmap?
var MapNavigation = React.createClass({
    propTypes: {
      terria: React.PropTypes.object,
      allBaseMaps: React.PropTypes.array,
      terriaViewer: React.PropTypes.object
    },

    render: function() {
        var compass = null;
        //show compass if we are in cesium mode
        if (defined(this.props.terria.cesium)){
          compass = <Compass terria={this.props.terria} />;
        }
        return (<div className='map-navigation'>
                  <ul className='list-reset flex map-navigation__menu'>
                  <li><SettingPanel terria= {this.props.terria} allBaseMaps = {this.props.allBaseMaps} terriaViewer={this.props.terriaViewer}/></li>
                  <li><SharePanel terria={this.props.terria}/></li>
                  <li><FullScreenButton terria={this.props.terria} /></li>
                  </ul>
                  {compass}
                  <ZoomControl terria={this.props.terria} />
                  </div>);
    }
});
module.exports = MapNavigation;

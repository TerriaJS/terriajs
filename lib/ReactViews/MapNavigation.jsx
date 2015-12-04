'use strict';
var SettingPanel = require('./SettingPanel.jsx'),
    Compass = require('./Compass.jsx'),
    ZoomControl = require('./ZoomControl.jsx'),
    SharePanel = require('./SharePanel.jsx'),
    FullScreenButton = require('./FullScreenButton.jsx');

var MapNavigation = React.createClass({
    render: function() {
        console.log(this.props);
        return (<div className='map-navigation'>
                  <ul className='list-reset flex map-navigation__menu'>
                  <li><SettingPanel terria= {this.props.terria} allBaseMaps = {this.props.allBaseMaps} terriaViewer={this.props.terriaViewer}/></li>
                  <li><SharePanel terria={this.props.terria}/></li>
                  <li><FullScreenButton /></li>
                  </ul><Compass terria={this.props.terria} /><ZoomControl terria={this.props.terria} /></div>);
    }
});
module.exports = MapNavigation;

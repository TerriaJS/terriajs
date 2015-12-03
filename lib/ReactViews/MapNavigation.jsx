'use strict';
var SettingPanel = require('./SettingPanel.jsx'),
    Compass = require('./Compass.jsx'),
    ZoomControl = require('./ZoomControl.jsx');

var MapNavigation = React.createClass({
    render: function() {
        console.log(this.props);
        return (<div className='map-navigation'><SettingPanel terria= {this.props.terria} allBaseMaps = {this.props.allBaseMaps} terriaViewer={this.props.terriaViewer}/><Compass terria={this.props.terria} /><ZoomControl terria={this.props.terria} /></div>);
    }
});
module.exports = MapNavigation;

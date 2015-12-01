'use strict';
var SettingPanel = require('./SettingPanel.jsx'),
    Compass = require('./Compass.jsx');

var MapNavigation = React.createClass({

  render: function() {
    console.log(this.props);
    return (<div className='map-navigation'><SettingPanel terria= {this.props.terria} allBaseMaps = {this.props.allBaseMaps} terriaViewer={this.props.terriaViewer}/><Compass /></div>);
  }
});
module.exports = MapNavigation;

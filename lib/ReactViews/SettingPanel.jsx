'use strict';
var ViewerMode = require('../Models/ViewerMode');

var SettingPanel = React.createClass({
  getDefaultProps: function() {
    return {
      viewerModes: ['2D', '3D Smooth', '3D Terrain'],
      allBaseMaps: []
    };
  },

  getInitialState: function() {
    return {
      isOpen: false
    };
  },

  togglePanel: function(){
    this.setState({
      isOpen: !this.state.isOpen
    });
  },

  selectBaseMap: function(baseMap, event){
    this.props.terria.baseMap = baseMap.catalogItem;
    this.props.terriaViewer.updateBaseMap();
  },

  selectViewer: function(viewer, event){
    switch(viewer) {
        case 0:
            this.props.terria.viewerMode = ViewerMode.Leaflet;
            break;
        case 1:
            this.props.terria.viewerMode = ViewerMode.CesiumEllipsoid;
            break;
        case 2:
            this.props.terria.viewerMode = ViewerMode.CesiumTerrain;
            break;
        default:
            return false;
    }
    this.props.terriaViewer.updateViewer();
  },

  render: function(){
    var that = this;
    return (
      <div className ='setting-panel'>
      <button onClick={this.togglePanel} className='setting-panel__button btn btn-setting' title='change settings'><i className="icon icon-sphere"></i></button>
        <div aria-hidden={!this.state.isOpen} className ='setting-panel-inner'>
        <button onClick={this.togglePanel} className="btn right" title="Close settings panel"><i className="icon icon-close"></i></button>
        <ul className='setting-panel__viewer-selector list-reset clearfix'>
          {this.props.viewerModes.map(function(viewerMode, i){
              return ( <li key ={i} className={viewerMode + ' col col-4'}><button onClick={that.selectViewer.bind(this,i)} className='btn'> {viewerMode} </button> </li>)
          }, this)}
        </ul>
        <label> {this.state.baseMapSelectorlabel} </label>
        <ul className='setting-panel__basemap-selector list-reset clearfix'>
        {this.props.allBaseMaps.map(function(baseMap, i){
              return ( <li key ={i} className='basemap col col-4'><button className='btn' onClick={that.selectBaseMap.bind(this,baseMap)}><img alt={baseMap.catalogItem.name} src ={baseMap.image}/>{baseMap.catalogItem.name}</button> </li>)
          }, this)}
        </ul>
       </div>
      </div>
      )
  }
})

module.exports = SettingPanel;

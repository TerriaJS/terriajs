'use strict';
var ViewerMode = require('../Models/ViewerMode');

var SettingPanel = React.createClass({
    getDefaultProps: function() {
        return {
            viewerModes: ['3D Terrain', '3D Smooth', '2D'],
            allBaseMaps: []
        };
    },
    getInitialState: function() {
        return {
            isOpen: false
        };
    },

    togglePanel: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    selectBaseMap: function(baseMap, event) {
        this.props.terria.baseMap = baseMap.catalogItem;
        this.props.terriaViewer.updateBaseMap();
        terriaViewerUpdate.raiseEvent();
    },

    selectViewer: function(viewer, event) {
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
                return false;
        }
        this.props.terriaViewer.updateViewer();
        terriaViewerUpdate.raiseEvent();
    },

    render: function() {
        var that = this;
        var currentViewer = this.props.terria.viewerMode;
        var currentBaseMap = this.props.terria.baseMap.name;

        //To do : aria-hidden={!this.state.isOpen}
        return (
            <div className ={'setting-panel ' + (this.state.isOpen? 'is-open': '')}>
      <button onClick={this.togglePanel} className='setting-panel__button btn btn-setting' title='change settings'><i className="icon icon-sphere"></i></button>
        <div className ='setting-panel-inner'>
        <div className='setting-panel-section setting-panel__viewer'>
        <label className='setting-panel__label'> Map View </label>
        <ul className='setting-panel__viewer-selector list-reset clearfix'>
          {this.props.viewerModes.map(function(viewerMode, i){
              return ( <li key ={i} className='col col-4'><button onClick={that.selectViewer.bind(this,i)} className={'btn btn-viewer ' + (i === currentViewer ? 'is-active' : '')}>{viewerMode}</button></li>)
          }, this)}
        </ul>
        </div>
        <div className='setting-panel-section setting-panel__basemap'>
        <label className='setting-panel__label'> Base Map </label>
        <ul className='setting-panel__basemap-selector list-reset clearfix'>
        {this.props.allBaseMaps.map(function(baseMap, i){
              return ( <li key ={i} className='basemap col col-4'><button className={'btn btn-basemap ' + (baseMap.catalogItem.name === currentBaseMap ? 'is-active' : '')} onClick={that.selectBaseMap.bind(this,baseMap)}><img alt={baseMap.catalogItem.name} src ={baseMap.image}/>{baseMap.catalogItem.name}</button></li>)
          }, this)}
        </ul>
        </div>
       </div>
      </div>
        )
    }
})

module.exports = SettingPanel;

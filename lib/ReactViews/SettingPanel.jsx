'use strict';
const React = require('react');
const ViewerMode = require('../Models/ViewerMode');
const ObserveModelMixin = require('./ObserveModelMixin');

// The basemap and viewer setting panel
const SettingPanel = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        terriaViewer: React.PropTypes.object,
        viewerModes: React.PropTypes.array,
        allBaseMaps: React.PropTypes.array
    },

    getDefaultProps() {
        return {
            viewerModes: ['3D Terrain', '3D Smooth', '2D'],
            allBaseMaps: []
        };
    },
    getInitialState() {
        return {
            isOpen: false,
            activeMap: this.props.terria.baseMap.name
        };
    },

    togglePanel() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    selectBaseMap(baseMap) {
        this.props.terria.baseMap = baseMap.catalogItem;
        this.props.terriaViewer.updateBaseMap();
    },

    mouseEnterBaseMap(baseMap) {
        this.setState({
            activeMap: baseMap.catalogItem.name
        });
    },

    mouseLeaveBaseMap() {
        this.setState({
            activeMap: this.props.terria.baseMap.name
        });
    },

    selectViewer(viewer) {
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
        default: return false;
        }
        this.props.terriaViewer.updateViewer();
        // window.terriaViewerUpdate.raiseEvent();
    },

    render() {
        const that = this;
        const currentViewer = this.props.terria.viewerMode;
        const currentBaseMap = this.props.terria.baseMap.name;

        // To do : aria-hidden={!this.state.isOpen}
        return (
            <div className ={'map-nav-panel setting-panel ' + (this.state.isOpen ? 'is-open' : '')}>
              <button onClick={this.togglePanel} className='setting-panel__button btn btn-map' title='change settings'><i className="icon icon-sphere"></i></button>
                <div className ='setting-panel-inner'>
                <div className='setting-panel-section setting-panel__viewer'>
                <label className='setting-panel__label'> Map View </label>
                <ul className='setting-panel__viewer-selector list-reset clearfix'>
                    {this.props.viewerModes.map((viewerMode, i) => {
                        return (<li key ={i} className='col col-4'><button onClick={that.selectViewer.bind(this, i)} className={'btn btn-viewer ' + (i === currentViewer ? 'is-active' : '')}>{viewerMode}</button></li>);
                    }, this)}
                </ul>
                </div>
                <div className='setting-panel-section setting-panel__basemap'>
                    <label className='label setting-panel__label'> Base Map </label>
                    <label className='label active-map__label'>{this.state.activeMap}</label>
                    <ul className='setting-panel__basemap-selector list-reset clearfix'>
                        {this.props.allBaseMaps.map((baseMap, i) => {
                            return (<li key ={i} className='basemap col col-4'><button className={'btn btn-basemap ' + (baseMap.catalogItem.name === currentBaseMap ? 'is-active' : '')} onClick={that.selectBaseMap.bind(this, baseMap)} onMouseEnter={that.mouseEnterBaseMap.bind(this, baseMap)} onMouseLeave={that.mouseLeaveBaseMap.bind(this, baseMap)}><img alt={baseMap.catalogItem.name} src ={baseMap.image}/></button></li>);
                        }, this)}
                    </ul>
                </div>
            </div>
      </div>
            );
    }
});

module.exports = SettingPanel;

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

    componentWillMount() {
        window.addEventListener('click', this.closeDropDownWhenClickOtherPlaces);
    },

    componentWillUnmount() {
        window.removeEventListener('click', this.closeDropDownWhenClickOtherPlaces);
    },

    closeDropDownWhenClickOtherPlaces() {
        this.setState({
            isOpen: false
        });
    },

    togglePanel(e) {
        e.stopPropagation();
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    selectBaseMap(baseMap, event) {
        event.stopPropagation();
        this.props.terria.baseMap = baseMap.catalogItem;
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

    selectViewer(viewer, event) {
        event.stopPropagation();
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
            return;
        }
    },

    render() {
        const that = this;
        const currentViewer = this.props.terria.viewerMode;
        const currentBaseMap = this.props.terria.baseMap.name;

        return (
            <div className ={'setting-panel ' + (this.state.isOpen ? 'is-open' : '')} aria-hidden={!this.state.isOpen}>
              <button type='button' onClick={this.togglePanel} className='setting-panel__button btn btn--map' title='change settings'></button>
                <div className ='setting-panel__inner'>
                <div className='setting-panel__section setting-panel__viewer'>
                <label className='label label--setting-panel'> Map View </label>
                <ul className='setting-panel__viewer-selector'>
                    {this.props.viewerModes.map((viewerMode, i) => {
                        return (<li key ={i}><button type='button' onClick={that.selectViewer.bind(this, i)} className={'btn btn--viewer ' + (i === currentViewer ? 'is-active' : '')}>{viewerMode}</button></li>);
                    }, this)}
                </ul>
                </div>
                <div className='setting-panel__section setting-panel__basemap'>
                    <label className='label label--setting-panel'> Base Map </label>
                    <label className='label label--active-map'>{this.state.activeMap}</label>
                    <ul className='setting-panel__basemap-selector'>
                        {this.props.allBaseMaps.map((baseMap, i) => {
                            return (<li key ={i}><button type='button' className={'btn btn--basemap ' + (baseMap.catalogItem.name === currentBaseMap ? 'is-active' : '')}
                                                         onClick={that.selectBaseMap.bind(this, baseMap)}
                                                         onMouseEnter={that.mouseEnterBaseMap.bind(this, baseMap)}
                                                         onMouseLeave={that.mouseLeaveBaseMap.bind(this, baseMap)}>
                                                         <img alt={baseMap.catalogItem.name} src ={baseMap.image}/>
                                                         </button></li>);
                        }, this)}
                    </ul>
                </div>
            </div>
      </div>
            );
    }
});

module.exports = SettingPanel;

'use strict';
import React from 'react';
import ViewerMode from '../../../Models/ViewerMode';
import ObserveModelMixin from '../../ObserveModelMixin';
import DropdownPanel from './DropdownPanel.jsx';

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
            activeMap: this.props.terria.baseMap.name
        };
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

        // To do : aria-hidden={!this.state.isOpen}
        return (
            <DropdownPanel btnClass="btn--map btn--sphere" btnTitle="Change view" className="setting-panel" btnText="Map">
                <div className='setting-panel__viewer dd-panel__section'>
                    <label className='label label--setting-panel'> Map View </label>
                    <ul className='setting-panel__viewer-selector'>
                        <For each="viewerMode" of={this.props.viewerModes} index="i">
                            <li key={i}>
                                <button onClick={that.selectViewer.bind(this, i)}
                                        className={'btn btn--viewer ' + (i === currentViewer ? 'is-active' : '')}>{viewerMode}</button>
                            </li>
                        </For>
                    </ul>
                </div>
                <div className='setting-panel__basemap dd-panel__section'>
                    <label className='label label--setting-panel'> Base Map </label>
                    <label className='label label--active-map'>{this.state.activeMap}</label>
                    <ul className='setting-panel__basemap-selector'>
                        {this.props.allBaseMaps.map((baseMap, i) => {
                            return (<li key={i}>
                                <button
                                    className={'btn btn--basemap ' + (baseMap.catalogItem.name === currentBaseMap ? 'is-active' : '')}
                                    onClick={that.selectBaseMap.bind(this, baseMap)}
                                    onMouseEnter={that.mouseEnterBaseMap.bind(this, baseMap)}
                                    onMouseLeave={that.mouseLeaveBaseMap.bind(this, baseMap)}
                                    onFocus={that.mouseEnterBaseMap.bind(this, baseMap)}>
                                    <img alt={baseMap.catalogItem.name} src={baseMap.image}/>
                                </button>
                            </li>);
                        }, this)}
                    </ul>
                </div>
            </DropdownPanel>
        );
    }
});

module.exports = SettingPanel;

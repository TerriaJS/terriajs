'use strict';

import Dropdown from '../Generic/Dropdown';
import FileInput from '../FileInput.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';

import {handleUrl, handleFile} from './addDataFns';

// Local and remote data have different dataType options
const remoteDataType = [
    {
        value: 'auto',
        name: 'Auto-detect (recommended)'
    },
    {
        value: 'wms-getCapabilities',
        name: 'Web Map Service (WMS) Server'
    },
    {
        value: 'wmts-getCapabilities',
        name: 'Web Map Tile Service (WMTS) Server'
    },
    {
        value: 'wfs-getCapabilities',
        name: 'Web Feature Service (WFS) Server'
    },
    {
        value: 'esri-group',
        name: 'Esri ArcGIS Server'
    },
    {
        value: 'open-street-map',
        name: 'Open Street Map Server'
    },
    {
        value: 'geojson',
        name: 'GeoJSON'
    },
    {
        value: 'kml',
        name: 'KML or KMZ'
    },
    {
        value: 'csv',
        name: 'CSV'
    },
    {
        value: 'czml',
        name: 'CZML'
    },
    {
        value: 'gpx',
        name: 'GPX'
    },
    {
        value: 'other',
        name: 'Other (use conversion service)'
    },
];

const localDataType = [
    {
        value: 'auto',
        name: 'Auto-detect (recommended)'
    },
    {
        value: 'geojson',
        name: 'GeoJSON'
    },
    {
        value: 'kml',
        name: 'KML or KMZ'
    },
    {
        value: 'csv',
        name: 'CSV'
    },
    {
        value: 'czml',
        name: 'CZML'
    },
    {
        value: 'gpx',
        name: 'GPX'
    },
    {
        value: 'other',
        name: 'Other (use conversion service)'
    },
];

/**
 * Add data panel in modal window -> My data tab
 */
const AddData = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        updateCatalog: React.PropTypes.func,
        viewState: React.PropTypes.object,
        allowDropInitFiles: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            allowDropInitFiles: true
        };
    },

    getInitialState() {
        return {
            localDataType: localDataType[0], // By default select the first item (auto)
            remoteDataType: remoteDataType[0],
            activeTab: 'local', // By default local data tab is active
            remoteUrl: undefined // By default there's no remote url
        };
    },

    selectLocalOption(option) {
        this.setState({
            localDataType: option
        });
    },

    selectRemoteOption(option) {
        this.setState({
            remoteDataType: option
        });
    },

    changeTab(active) {
        this.setState({
            activeTab: active
        });
    },

    onRemoteUrlChange(event) {
        this.setState({
            remoteUrl: event.target.value
        });
    },

    onFinishDroppingFile() {
        this.props.viewState.isDraggingDroppingFile = false;
    },

    renderTabs() {
        return (
            <ul className='add-data-tablist tablist'>
                <li className='tablist--local'>
                    <button
                        type='button'
                        onClick={this.changeTab.bind(null, 'local')}
                        className={'btn btn--add-data-tab btn-transparent ' + (this.state.activeTab === 'local' ? 'is-active' : '')}>
                        ADD LOCAL
                    </button>
                </li>
                <li className='tablist--local'>
                    <button
                        type='button'
                        onClick={this.changeTab.bind(null, 'web')}
                        className={'btn btn--add-data-tab btn-transparent ' + (this.state.activeTab === 'web' ? 'is-active' : '')}>
                        ADD WEB DATA
                    </button>
                </li>
            </ul>
        );
    },

    renderPanels() {
        const dropdownTheme = {
            dropdown: 'add-data__dropdown',
            list: 'add-data__list',
            isOpen: '__dropdown-list--is-open'
        };

        return (
            <div className='tab-panels'>
                <section aria-hidden={this.state.activeTab === 'local' ? 'false' : 'true'}
                         className={'tab-panel panel--local ' + (this.state.activeTab === 'local' ? 'is-active' : '')}>
                    <label className='label'><strong>Step 1:</strong> Select type of file to add: </label>
                    <Dropdown options={localDataType} selected={this.state.localDataType}
                              selectOption={this.selectLocalOption} matchWidth={true} theme={dropdownTheme}/>
                    <label className='label'><strong>Step 2:</strong> Select a local data file to add: </label>
                    <FileInput accept=".csv,.kml" onChange={handleFile.bind(this.props.terria, this.props.allowDropInitFiles, this.state.localDataType)}/>
                </section>
                <section aria-hidden={this.state.activeTab === 'web' ? 'false' : 'true'}
                         className={'tab-panel panel--web ' + (this.state.activeTab === 'web' ? 'is-active' : '')}>
                    <label className='label'><strong>Step 1:</strong> Select type of file to add: </label>
                    <Dropdown options={remoteDataType} selected={this.state.remoteDataType}
                              selectOption={this.selectRemoteOption} matchWidth={true} theme={dropdownTheme}/>
                    <label className='label'><strong>Step 2:</strong> Enter the URL of the data file or web service:
                    </label>
                    <form className='url-input'>
                        <input value={this.state.remoteUrl} onChange={this.onRemoteUrlChange} className='field'
                               type='text' placeholder='e.g. http://data.gov.au/geoserver/wms'/>
                        <button type='button' onClick={handleUrl.bind(this.props.terria, this.state.remoteDataType, this.state.remoteUrl)} className="btn btn--add-url btn-transparent">
                            Add
                        </button>
                    </form>
                </section>
            </div>
        );
    },

    render() {
        return (
            <div className='add-data-inner'>
                {this.renderTabs()}
                {this.renderPanels()}
            </div>
        );
    }
});

module.exports = AddData;

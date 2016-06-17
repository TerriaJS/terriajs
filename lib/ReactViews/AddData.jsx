'use strict';
import addUserCatalogMember from '../Models/addUserCatalogMember';
import ArcGisCatalogGroup from '../Models/ArcGisCatalogGroup';
import ArcGisMapServerCatalogItem from '../Models/ArcGisMapServerCatalogItem';
import createCatalogItemFromFileOrUrl from '../Models/createCatalogItemFromFileOrUrl';
import Dropdown from './Generic/Dropdown';
import FileInput from './FileInput.jsx';
import handleFile from '../Core/handleFile';
import ObserveModelMixin from './ObserveModelMixin';
import OpenStreetMapCatalogItem from '../Models/OpenStreetMapCatalogItem';
import React from 'react';
import WebFeatureServiceCatalogGroup from '../Models/WebFeatureServiceCatalogGroup';
import WebMapServiceCatalogGroup from '../Models/WebMapServiceCatalogGroup';
import WebMapTileServiceCatalogGroup from '../Models/WebMapTileServiceCatalogGroup';


const wfsUrlRegex = /\bwfs\b/i;

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

    handleUploadFile(e){
        handleFile(e, this.props.terria, that.props.updateCatalog);
    },

    handleUrl(e) {
        const url = this.state.remoteUrl;
        e.preventDefault();
        this.props.terria.analytics.logEvent('addDataUrl', url);
        const that = this;
        let promise;
        if (that.state.remoteDataType.value === 'auto') {
            const wmsThenWfs = [loadWms, loadWfs];
            const wfsThenWms = [loadWfs, loadWms];
            const others = [loadWmts, loadMapServer, loadMapServerLayer, loadFile];

            let loadFunctions;

            // Does this look like a WFS URL?  If so, try that first (before WMS).
            // This accounts for the fact that a single URL often works as both WMS and WFS.
            if (wfsUrlRegex.test(url)) {
                loadFunctions = wfsThenWms.concat(others);
            } else {
                loadFunctions = wmsThenWfs.concat(others);
            }

            promise = loadAuto(that, loadFunctions);
        } else if (that.state.remoteDataType.value === 'wms-getCapabilities') {
            promise = loadWms(that);
        } else if (that.state.remoteDataType.value === 'wfs-getCapabilities') {
            promise = loadWfs(that);
        } else if (that.state.remoteDataType.value === 'esri-group') {
            promise = loadMapServer(that).otherwise(() => {
                return loadMapServerLayer(that);
            });
        } else if (that.state.remoteDataType.value === 'open-street-map') {
            promise = loadOpenStreetMapServer(that);
        } else {
            promise = loadFile(that);
        }

        addUserCatalogMember(this.props.terria, promise).then(() => {
            const userCatalog = that.props.terria.catalog.userAddedDataGroup;
            that.props.updateCatalog(userCatalog);
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
                    <button type='button' onClick={this.changeTab.bind(null, 'local')} className={'btn btn--add-data-tab btn-transparent ' + (this.state.activeTab === 'local' ? 'is-active' : '')}>ADD LOCAL DATA</button>
                </li>
                <li className='tablist--local'>
                    <button type='button' onClick={this.changeTab.bind(null, 'web')} className={'btn btn--add-data-tab btn-transparent ' + (this.state.activeTab === 'web' ? 'is-active' : '')}>ADD WEB DATA</button>
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
            <section aria-hidden = {this.state.activeTab === 'local' ? 'false' : 'true'} className={'tab-panel panel--local ' + (this.state.activeTab === 'local' ? 'is-active' : '')}>
                <label className='label'><strong>Step 1:</strong> Select type of file to add: </label>
                <Dropdown options={localDataType} selected={this.state.localDataType} selectOption={this.selectLocalOption} matchWidth={true} theme={dropdownTheme} />
                <label className='label'><strong>Step 2:</strong> Select a local data file to add: </label>
                <FileInput accept=".csv,.kml" onChange={this.handleFile} />
            </section>
            <section aria-hidden = {this.state.activeTab === 'web' ? 'false' : 'true'} className={'tab-panel panel--web ' + (this.state.activeTab === 'web' ? 'is-active' : '')}>
                <label className='label'><strong>Step 1:</strong> Select type of file to add: </label>
                <Dropdown options={remoteDataType} selected={this.state.remoteDataType} selectOption={this.selectRemoteOption} matchWidth={true} theme={dropdownTheme} />
                <label className='label'><strong>Step 2:</strong> Enter the URL of the data file or web service: </label>
                <form className='url-input'>
                    <input value={this.state.remoteUrl} onChange={this.onRemoteUrlChange} className='field' type='text' placeholder='e.g. http://data.gov.au/geoserver/wms'/>
                    <button type='button' onClick={this.handleUrl} className="btn btn--add-url btn-transparent">Add</button>
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
        </div>);
    }
});

/**
 * Loads data, automatically determining the format.
 *
 * @returns {Promise}
 */
function loadAuto(viewModel, loadFunctions, index) {
    index = 0;
    const loadFunction = loadFunctions[index];

    return loadFunction(viewModel).otherwise(function() {
        return loadAuto(viewModel, loadFunctions, index + 1);
    });
}

/**
 * Loads a Web Map Service catalog group.
 *
 * @returns {Promise}
 */
function loadWms(viewModel) {
    const wms = new WebMapServiceCatalogGroup(viewModel.props.terria);
    wms.name = viewModel.state.remoteUrl;
    wms.url = viewModel.state.remoteUrl;

    return wms.load().then(function() {
        return wms;
    });
}

/**
 * Loads a Web Feature Service catalog group.
 *
 * @returns {Promise}
 */
function loadWfs(viewModel) {
    const wfs = new WebFeatureServiceCatalogGroup(viewModel.props.terria);
    wfs.name = viewModel.state.remoteUrl;
    wfs.url = viewModel.state.remoteUrl;

    return wfs.load().then(function() {
        return wfs;
    });
}

/**
 * Loads a Web Map Tile Service catalog group.
 *
 * @returns {Promise}
 */
function loadWmts(viewModel) {
    const wmts = new WebMapTileServiceCatalogGroup(viewModel.props.terria);
    wmts.name = viewModel.state.remoteUrl;
    wmts.url = viewModel.state.remoteUrl;

    return wmts.load().then(function() {
        return wmts;
    });
}

/**
 * Loads an ArcGis catalog group.
 *
 * @returns {Promise.<T>}
 */
function loadMapServer(viewModel) {
    const mapServer = new ArcGisCatalogGroup(viewModel.props.terria);
    mapServer.name = viewModel.state.remoteUrl;
    mapServer.url = viewModel.state.remoteUrl;

    return mapServer.load().then(function() {
        return mapServer;
    });
}

/**
 * Loads a single ArcGis layer.
 *
 * @returns {Promise.<T>}
 */
function loadMapServerLayer(viewModel) {
    const mapServer = new ArcGisMapServerCatalogItem(viewModel.props.terria);
    mapServer.name = viewModel.state.remoteUrl;
    mapServer.url = viewModel.state.remoteUrl;
    return mapServer.load().then(function() {
        return mapServer;
    });
}

/**
 * Loads an item from a open street map server.
 *
 * @param viewModel
 * @returns {Promise.<T>}
 */
function loadOpenStreetMapServer(viewModel) {
    const openStreetMapServer = new OpenStreetMapCatalogItem(viewModel.props.terria);
    openStreetMapServer.name = viewModel.state.remoteUrl;
    openStreetMapServer.url = viewModel.state.remoteUrl;

    return openStreetMapServer.load().then(function() {
        return openStreetMapServer;
    });
}

/**
 * Loads a catalog item from a file.
 */
function loadFile(viewModel) {
    return createCatalogItemFromFileOrUrl(viewModel.props.terria, viewModel.state.remoteUrl, viewModel.state.remoteDataType, true);
}

module.exports = AddData;

'use strict';
var React = require('react');
var Dropdown = require('./Dropdown.jsx');
var FileInput = require('./FileInput.jsx');
var OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
var defined = require('terriajs-cesium/Source/Core/defined');
var createCatalogItemFromFileOrUrl = require('../Models/createCatalogItemFromFileOrUrl');
var addUserCatalogMember = require('../Models/addUserCatalogMember');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var WebFeatureServiceCatalogGroup = require('../Models/WebFeatureServiceCatalogGroup');
var WebMapServiceCatalogGroup = require('../Models/WebMapServiceCatalogGroup');
var WebMapTileServiceCatalogGroup = require('../Models/WebMapTileServiceCatalogGroup');
var ArcGisCatalogGroup = require('../Models/ArcGisCatalogGroup');
var ArcGisMapServerCatalogItem = require('../Models/ArcGisMapServerCatalogItem');
var wfsUrlRegex = /\bwfs\b/i;


var remoteDataType = [
                {value: 'auto', name: 'Auto-detect (recommended)'},
                {value: 'wms-getCapabilities', name: 'Web Map Service (WMS) Server'},
                {value: 'wmts-getCapabilities', name:'Web Map Tile Service (WMTS) Server'},
                {value: 'wfs-getCapabilities', name: 'Web Feature Service (WFS) Server'},
                {value: 'esri-group', name: 'Esri ArcGIS Server'},
                {value: 'open-street-map', name: 'Open Street Map Server'},
                {value: 'geojson', name: 'GeoJSON'},
                {value: 'kml', name: 'KML or KMZ'},
                {value: 'csv', name: 'CSV'},
                {value: 'czml', name: 'CZML'},
                {value: 'gpx', name: 'GPX'},
                {value: 'other', name:'Other (use conversion service)'},
                ];

var localDataType = [
                {value: 'auto', name: 'Auto-detect (recommended)'},
                {value: 'geojson', name: 'GeoJSON'},
                {value: 'kml', name: 'KML or KMZ'},
                {value: 'csv', name: 'CSV'},
                {value: 'czml', name: 'CZML'},
                {value: 'gpx', name: 'GPX'},
                {value: 'other', name:'Other (use conversion service)'},
                ];

var AddData = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        updateCatalog: React.PropTypes.func
    },

    getInitialState: function() {
        return {
            localDataType: localDataType[0],
            remoteDataType: remoteDataType[0],
            activeTab: 'local',
            remoteUrl: undefined
        };
    },
    selectLocalOption: function(option){
        this.setState({
            localDataType: option
        });
    },

    selectRemoteOption: function(option){
        this.setState({
            remoteDataType: option
        });
    },

    changeTab: function(active){
        this.setState({
            activeTab: active
        });
    },

    handleFile: function(e){
        var that = this;
        var files = e.target.files;
        if (!defined(files)) {
            console.log('file api not supported');
        }

        if (files.length > 0) {
            var promises = [];

            for (var i = 0; i < files.length; ++i) {
                var file = files[i];
                this.props.terria.analytics.logEvent('uploadFile', 'browse', file.name);
                promises.push(addUserCatalogMember( this.props.terria, createCatalogItemFromFileOrUrl( this.props.terria, file, this.state.localDataType.value, true)));
                }
            when.all(promises, function() {
                var userCatalog = that.props.terria.catalog.userAddedDataGroup;
                that.props.updateCatalog(userCatalog);
            });
        }
    },

    handleUrl: function(e) {
        var url = this.state.remoteUrl;
        e.preventDefault();
        this.props.terria.analytics.logEvent('addDataUrl', url);
        var that = this;
        var promise;
        if (that.state.remoteDataType.value === 'auto') {
            var wmsThenWfs = [loadWms, loadWfs];
            var wfsThenWms = [loadWfs, loadWms];
            var others = [loadWmts, loadMapServer, loadMapServerLayer, loadFile];

            var loadFunctions;

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
            promise = loadMapServer(that).otherwise(function() {
                return loadMapServerLayer(that);
            });
        } else if (that.state.remoteDataType.value === 'open-street-map') {
            promise = loadOpenStreetMapServer(that);
        } else {
            promise = loadFile(that);
        }

        addUserCatalogMember( this.props.terria, promise).then(function() {
            var userCatalog = that.props.terria.catalog.userAddedDataGroup;
                that.props.updateCatalog(userCatalog);
        });
    },

    onRemoteUrlChange: function(event){
        this.setState({
            remoteUrl: event.target.value
        });
    },

    render: function() {
        return (<div className='add-data clearfix'>
                <ul className='list-reset row relative'>
                  <li className='col col-6'>
                    <button onClick={this.changeTab.bind(null, 'local')} className={'btn btn-data-upload ' + (this.state.activeTab === 'local' ? 'is-active' : '')}>ADD LOCAL DATA</button>
                    <div aria-hidden = {this.state.activeTab === 'local' ? 'false' : 'true'} className='mydata-panel_data-tab-section'>
                    <label className='block mt1 mb1'> <strong className='block'>Step 1:</strong> Select type of file to add: </label>
                    <Dropdown options={localDataType} selected={this.state.localDataType} selectOption={this.selectLocalOption} />
                    <label className='block mt1 mb1'> <strong className='block'>Step 2:</strong> Select a local data file to add: </label>
                    <FileInput accept=".csv,.kml" onChange={this.handleFile} />
                    </div>
                  </li>
                  <li className='col col-6'>
                    <button onClick={this.changeTab.bind(null, 'web')} className={'btn btn-data-upload ' + (this.state.activeTab === 'web' ? 'is-active' : '')}>ADD WEB DATA</button>
                    <div aria-hidden = {this.state.activeTab === 'web' ? 'false' : 'true'} className='mydata-panel_data-tab-section'>
                    <label className='block mt1 mb1'> <strong className='block'>Step 1:</strong> Select type of file to add: </label>
                    <Dropdown options={remoteDataType} selected={this.state.remoteDataType} selectOption={this.selectRemoteOption}/>
                    <label className='block mt1 mb1'> <strong className='block'>Step 2:</strong> Enter the URL of the data file or web service: </label>
                    <form>
                        <input value={this.state.remoteUrl} onChange={this.onRemoteUrlChange} className='field' type='text' placeholder='e.g. http://data.gov.au/geoserver/wms'/>
                        <button onClick={this.handleUrl} className="btn btn-add-url">Add</button>
                    </form>
                     </div>
                  </li>
                </ul>
                </div>);
    }
});

function loadAuto(viewModel, loadFunctions, index) {
    index = 0;
    var loadFunction = loadFunctions[index];

    return loadFunction(viewModel).otherwise(function() {
        return loadAuto(viewModel, loadFunctions, index + 1);
    });
}

function loadWms(viewModel) {
    var wms = new WebMapServiceCatalogGroup(viewModel.props.terria);
    wms.name = viewModel.state.remoteUrl;
    wms.url = viewModel.state.remoteUrl;

    return wms.load().then(function() {
        return wms;
    });
}

function loadWfs(viewModel) {
    var wfs = new WebFeatureServiceCatalogGroup(viewModel.props.terria);
    wfs.name = viewModel.state.remoteUrl;
    wfs.url = viewModel.state.remoteUrl;

    return wfs.load().then(function() {
        return wfs;
    });
}

function loadWmts(viewModel) {
    var wmts = new WebMapTileServiceCatalogGroup(viewModel.props.terria);
    wmts.name = viewModel.state.remoteUrl;
    wmts.url = viewModel.state.remoteUrl;

    return wmts.load().then(function() {
        return wmts;
    });
}


function loadMapServer(viewModel) {
    var mapServer = new ArcGisCatalogGroup(viewModel.props.terria);
    mapServer.name = viewModel.state.remoteUrl;
    mapServer.url = viewModel.state.remoteUrl;

    return mapServer.load().then(function() {
        return mapServer;
    });
}

function loadMapServerLayer(viewModel) {
    var mapServer = new ArcGisMapServerCatalogItem(viewModel.props.terria);
    mapServer.name = viewModel.state.remoteUrl;
    mapServer.url = viewModel.state.remoteUrl;
    return mapServer.load().then(function() {
        return mapServer;
    });
}

function loadOpenStreetMapServer(viewModel) {
    var openStreetMapServer = new OpenStreetMapCatalogItem(viewModel.props.terria);
    openStreetMapServer.name = viewModel.state.remoteUrl;
    openStreetMapServer.url = viewModel.state.remoteUrl;

    return openStreetMapServer.load().then(function() {
        return openStreetMapServer;
    });
}


function loadFile(viewModel) {
    return createCatalogItemFromFileOrUrl(viewModel.props.terria, viewModel.state.remoteUrl, viewModel.state.remoteDataType, true);
}


module.exports = AddData;

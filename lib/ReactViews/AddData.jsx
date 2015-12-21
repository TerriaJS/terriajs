'use strict';
var React = require('react');
var Dropdown = require('./Dropdown.jsx');
var FileInput = require('./FileInput.jsx');
var defined = require('terriajs-cesium/Source/Core/defined');
var createCatalogItemFromFileOrUrl = require('../Models/createCatalogItemFromFileOrUrl');
var addUserCatalogMember = require('../Models/addUserCatalogMember');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var dataType = [
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

var AddData = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            localDataType: dataType[0],
            remoteDataType: dataType[0],
            activeTab: 'local'
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
        var files = e.target.files;
        if (!defined(files)) {
            console.log('file api not supported');
        }

        if (files.length > 0) {
            var promises = [];

            for (var i = 0; i < files.length; ++i) {
                var file = files[i];
                this.props.terria.analytics.logEvent('uploadFile', 'browse', file.name);
                promises.push(addUserCatalogMember( this.terria, createCatalogItemFromFileOrUrl( this.props.terria, file, this.state.localDataType.value, true)));
                }
            when.all(promises, function() {
                console.log('completed');
            });

        }
    },

    render: function() {
        return (<div className='add-data clearfix'>
                <ul className='list-reset row relative'>
                  <li className='col col-6'>
                    <button onClick={this.changeTab.bind(null, 'local')} className={'btn btn-data-upload ' + (this.state.activeTab === 'local' ? 'is-active' : '')}>ADD LOCAL DATA</button>
                    <div aria-hidden = {this.state.activeTab === 'local' ? 'false' : 'true'} className='mydata-panel_data-tab-section'>
                    <Dropdown options={dataType} selected={this.state.localDataType} selectOption={this.selectLocalOption} /><FileInput accept=".csv,.kml" onChange={this.handleFile} />
                    </div>
                  </li>
                  <li className='col col-6'>
                    <button onClick={this.changeTab.bind(null, 'web')} className={'btn btn-data-upload ' + (this.state.activeTab === 'web' ? 'is-active' : '')}>ADD WEB DATA</button>
                    <div aria-hidden = {this.state.activeTab === 'web' ? 'false' : 'true'} className='mydata-panel_data-tab-section'>
                    <Dropdown options={dataType} selected={this.state.remoteDataType} selectOption={this.selectRemoteOption}/>
                      <input  className='field' type='text' placeholder='e.g. http://data.gov.au/geoserver/wms'/>
                     </div>
                  </li>
                </ul>
                </div>);
    }
});
module.exports = AddData;

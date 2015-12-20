'use strict';
var React = require('react');
var Dropdown = require('./Dropdown.jsx');

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
            remoteDataType: dataType[0]
        };
    },
    render: function() {
        return (<div>
                <h2 className='m0 p0'> Add Data </h2>
                <p> Add data to the map from your local system or from elsewhere on the web.</p>
                <ul className='list-reset row relative'>
                  <li className='col col-6 is-active'>
                    <button className='btn btn-data-upload'> Local file</button>
                    <div aria-hidden = 'false' className='mydata-panel_data-tab-section'>
                    <Dropdown options={dataType} selected={this.state.localDataType} />
                      <input className='btn'  type='file'/>
                    </div>
                  </li>
                  <li className='col col-6'>
                    <button className='btn btn-data-upload'> Web Service</button>
                    <div aria-hidden = 'true' className='mydata-panel_data-tab-section'>
                    <Dropdown options={dataType} selected={this.state.remoteDataType} />
                      <input  className='field' type='text' placeholder='e.g. http://data.gov.au/geoserver/wms'/>
                     </div>
                  </li>
                </ul>
                </div>);
    }
});
module.exports = AddData;

'use strict';

var React = require('react');
var Terria = require('../Models/Terria');
var TerriaViewer = require('./TerriaViewer.js');
var ViewerMode = require('../Models/ViewerMode');
var CameraView = require('../Models/CameraView');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var GeoJsonCatalogItem = require('../Models/GeoJsonCatalogItem');
var OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
var Terria = require('../Models/Terria');
var TerriaViewer = require('../ViewModels/TerriaViewer');
var ViewerMode = require('../Models/ViewerMode');
var WebMapServiceCatalogItem = require('../Models/WebMapServiceCatalogItem');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var createCatalogMemberFromType = require('../Models/createCatalogMemberFromType');


var DataPreviewMap = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    componentWillMount: function(){
        var terria = this.props.terria;

        this.terriaPreview = new Terria({
            appName: terria.appName + 'preview',
            supportEmail: terria.supportEmail,
            baseUrl: terria.baseUrl,
            cesiumBaseUrl: terria.cesiumBaseUrl
        });

        this.terriaPreview.viewerMode = ViewerMode.Leaflet;
        this.terriaPreview.homeView = terria.homeView;
        this.terriaPreview.initialView = new CameraView(terria.currentViewer.getCurrentExtent());
        this.terriaPreview.regionMappingDefinitionsUrl = terria.regionMappingDefinitionsUrl;

         // TODO: we shouldn't hard code the base map here. (copyed from branch analyticswithcharts)
        var positron = new OpenStreetMapCatalogItem(this.terriaPreview);
        positron.name = 'Positron (Light)';
        positron.url = 'http://basemaps.cartocdn.com/light_all/';
        positron.attribution = '© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0';
        positron.opacity = 1.0;
        positron.subdomains = ['a','b','c','d'];
        this.terriaPreview.baseMap = positron;
    },

    componentWillReceiveProps: function(nextProp){
        var previewed = nextProp.previewed;
        if(defined(previewed.type)){
            var type = previewed.type;
            var serializedCatalogItem = previewed.serializeToJson();
            var catalogItem = createCatalogMemberFromType(type, this.terriaPreview);
            catalogItem.updateFromJson(serializedCatalogItem);
            catalogItem.isEnabled = true;
        };
    },

    shouldComponentUpdate: function(){
        return false;
    },

    render: function() {
        var that = this;
        return (<div className='terria-preview' ref={function(previewContainer) {
                  if (previewContainer !== null) {
                     TerriaViewer.create(that.terriaPreview, {
                            mapContainer: previewContainer
                    });
                  }
              }}>
            </div>);
    }
});
module.exports = DataPreviewMap;

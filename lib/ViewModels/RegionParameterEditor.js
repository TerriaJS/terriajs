'use strict';

/*global require*/
var CameraView = require('../Models/CameraView');
var CsvCatalogItem = require('../Models/CsvCatalogItem');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var GeoJsonCatalogItem = require('../Models/GeoJsonCatalogItem');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
var Terria = require('../Models/Terria');
var TerriaViewer = require('../ViewModels/TerriaViewer');
var ViewerMode = require('../Models/ViewerMode');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var RegionParameterEditor = function(catalogFunction, parameter, parameterValues) {
    this.catalogFunction = catalogFunction;
    this.parameter = parameter;
    this._lastPickedFeatures = undefined;
    this._loadingRegionProvider = undefined;
    this._selectedRegionCatalogItem = undefined;
    this._parameterValues = parameterValues;

    var terria = this.catalogFunction.terria;
    this.terriaForRegionSelection = new Terria({
        appName: terria.appName,
        supportEmail: terria.supportEmail,
        baseUrl: terria.baseUrl,
        cesiumBaseUrl: terria.cesiumBaseUrl
    });

    this.terriaForRegionSelection.viewerMode = ViewerMode.Leaflet;
    this.terriaForRegionSelection.homeView = terria.homeView;
    this.terriaForRegionSelection.initialView = new CameraView(terria.currentViewer.getCurrentExtent());
    this.terriaForRegionSelection.regionMappingDefinitionsUrl = terria.regionMappingDefinitionsUrl;

    // TODO: we shouldn't hard code the base map here.
    var positron = new OpenStreetMapCatalogItem(this.terriaForRegionSelection);
    positron.name = 'Positron (Light)';
    positron.url = 'http://basemaps.cartocdn.com/light_all/';
    positron.attribution = '© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0';
    positron.opacity = 1.0;
    positron.subdomains=['a','b','c','d'];
    this.terriaForRegionSelection.baseMap = positron;

    knockout.defineProperty(this, 'value', {
        get: function() {
            return parameterValues[parameter.id];
        },
        set: function(value) {
            parameterValues[parameter.id] = value;
        }
    });

    knockout.defineProperty(this, 'regionProvider', {
        get: function() {
            return parameter.getRegionProvider(parameterValues);
        }
    });

    knockout.defineProperty(this, 'displayValue', {
        get: function() {
            var region = this.value;
            if (!defined(region)) {
                return 'None Selected';
            }

            if (defined(region.name)) {
                return region.name + ' (' + region.id + ')';
            } else {
                return region.id;
            }
        }
    });

    var that = this;
    knockout.getObservable(this.terriaForRegionSelection, 'pickedFeatures').subscribe(function() {
        var pickedFeatures = that.terriaForRegionSelection.pickedFeatures;
        that._lastPickedFeatures = pickedFeatures;
        when(pickedFeatures.allFeaturesAvailablePromise, function() {
            if (pickedFeatures !== that._lastPickedFeatures || pickedFeatures.features.length === 0) {
                return;
            }

            var feature = pickedFeatures.features[0];
            that.value = that.parameter.findRegionByID(feature.properties[that.regionProvider.regionProp], that._parameterValues);

            if (defined(that._selectedRegionCatalogItem)) {
                that._selectedRegionCatalogItem.isEnabled = false;
                that._selectedRegionCatalogItem = undefined;
            }

            if (defined(feature.data) && feature.data.type === 'Feature') {
                that._selectedRegionCatalogItem = new GeoJsonCatalogItem(that.terriaForRegionSelection);
                that._selectedRegionCatalogItem.data = feature.data;
                that._selectedRegionCatalogItem.isEnabled = true;
            }
        });
    });

    var catalogItem;

    function addRegionLayer() {
        if (defined(that._selectedRegionCatalogItem)) {
            that._selectedRegionCatalogItem.isEnabled = false;
            that._selectedRegionCatalogItem = undefined;
        }

        if (!defined(that.regionProvider)) {
            return;
        }

        that._loadingRegionProvider = that.regionProvider;

        that.regionProvider.loadRegionIDs().then(function() {
            if (that.regionProvider !== that._loadingRegionProvider) {
                return;
            }

            if (defined(catalogItem)) {
                catalogItem.isEnabled = false;
                catalogItem = undefined;
            }

            var dummyCsv = that.regionProvider.regionType + '\n';

            var regions = that.regionProvider.regions;
            for (var i = 0; i < regions.length; ++i) {
                dummyCsv += regions[i].id + '\n';
            }

            catalogItem = new CsvCatalogItem(that.terriaForRegionSelection);
            catalogItem.tableStyle = {
                colorMap: [
                    {offset: 0.0, color: 'rgba(0,127,127,1.0)'}
                ]
            };
            catalogItem.data = dummyCsv;
            catalogItem.isEnabled = true;

            that._loadingRegionProvider = undefined;
        });
    }

    knockout.getObservable(that, 'regionProvider').subscribe(addRegionLayer);
    addRegionLayer();
};

RegionParameterEditor.prototype.show = function(container) {
    var elements = loadView(require('fs').readFileSync(__dirname + '/../Views/RegionParameterEditor.html', 'utf8'), container, this);

    var firstElement = elements[0];
    var mapContainer = firstElement.getElementsByClassName('parameter-editor-map')[0];
    var uiContainer = firstElement.getElementsByClassName('parameter-editor-map-ui')[0];

    if (!mapContainer || !uiContainer) {
        throw new DeveloperError('Elements with class parameter-editor-map and parameter-editor-map-ui are missing from the first element in RegionParameterEditor.html.');
    }

    TerriaViewer.create(this.terriaForRegionSelection, {
        mapContainer: mapContainer,
        uiContainer: uiContainer
    });
};

module.exports = RegionParameterEditor;

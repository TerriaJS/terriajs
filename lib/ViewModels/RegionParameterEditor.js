'use strict';

/*global require*/
var CameraView = require('../Models/CameraView');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var GeoJsonCatalogItem = require('../Models/GeoJsonCatalogItem');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var ModelError = require('../Models/ModelError');
var OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
var RegionProviderList = require('../Map/RegionProviderList');
var Terria = require('../Models/Terria');
var TerriaViewer = require('../ViewModels/TerriaViewer');
var ViewerMode = require('../Models/ViewerMode');
var WebMapServiceCatalogItem = require('../Models/WebMapServiceCatalogItem');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var RegionParameterEditor = function(catalogFunction, parameter, parameterValues) {
    this.catalogFunction = catalogFunction;
    this.parameter = parameter;
    this.regionProvider = undefined;
    this._lastPickedFeatures = undefined;
    this._loadingRegionProvider = undefined;
    this._selectedRegionCatalogItem = undefined;

    knockout.track(this, ['regionProvider']);

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

    knockout.defineProperty(this, 'requiredRegionType', {
        get: function() {
            var requiredRegionType = parameter.regionType;
            if (typeof requiredRegionType !== 'string') {
                var regionTypeParameter = requiredRegionType.parameter;
                if (!defined(regionTypeParameter)) {
                    return [];
                }
                requiredRegionType = parameterValues[regionTypeParameter];
            }
            return requiredRegionType;
        }
    });

    knockout.defineProperty(this, 'displayValue', {
        get: function() {
            var regionValue = this.value;
            if (!defined(that.regionProvider)) {
                return regionValue;
            }

            var region = that.regionProvider.regions.filter(function(region) {
                return region.id === regionValue;
            })[0];
            if (defined(region) && defined(region.name)) {
                return region.name + ' (' + regionValue + ')';
            } else {
                return regionValue;
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
            that.value = feature.properties[that.regionProvider.regionProp];

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

    RegionProviderList.fromUrl(terria.regionMappingDefinitionsUrl).then(function(regionProviderList) {
        var catalogItem;

        function addRegionLayer() {
            var regionProvider = regionProviderList.regionProviders.filter(function(item) { return item.regionType === that.requiredRegionType; })[0];
            if (!regionProvider) {
                throw new ModelError({
                    title: 'Missing region type definition',
                    message: 'Could not find a region definition for region type ' + that.requiredRegionType + '.'
                });
            }

            that._loadingRegionProvider = regionProvider;

            regionProvider.loadRegionIDs().then(function() {
                if (regionProvider !== that._loadingRegionProvider) {
                    return;
                }

                if (defined(catalogItem)) {
                    catalogItem.isEnabled = false;
                    catalogItem = undefined;
                }

                catalogItem = new WebMapServiceCatalogItem(that.terriaForRegionSelection);
                catalogItem.url = regionProvider.server;
                catalogItem.layers = regionProvider.layerName;
                catalogItem.isEnabled = true;

                that.regionProvider = regionProvider;
                that._loadingRegionProvider = undefined;
            });
        }

        knockout.getObservable(that, 'requiredRegionType').subscribe(addRegionLayer);
        addRegionLayer();
    });
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

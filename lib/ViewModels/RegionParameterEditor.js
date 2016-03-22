'use strict';

/*global require*/
var CameraView = require('../Models/CameraView');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var GeoJsonCatalogItem = require('../Models/GeoJsonCatalogItem');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
var Terria = require('../Models/Terria');
var TerriaViewer = require('../ViewModels/TerriaViewer');
var ViewerMode = require('../Models/ViewerMode');
var WebMapServiceCatalogItem = require('../Models/WebMapServiceCatalogItem');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var RegionParameterEditor = function(options) {
    this.catalogFunction = options.catalogFunction;
    this.parameter = options.parameter;
    this._lastPickedFeatures = undefined;
    this._loadingRegionProvider = undefined;
    this._selectedRegionCatalogItem = undefined;
    this._parameterValues = options.parameterValues;

    this.autocompleteVisible = false;
    this._displayValue = undefined;
    this._regionNames = [];

    knockout.track(this, ['autocompleteVisible', '_displayValue', '_regionNames']);

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

    knockout.defineProperty(this, 'matchingOptions', {
        get: function() {
            var displayValue = this._displayValue;
            if (!defined(displayValue)) {
                this.autocompleteVisible = false;
                return;
            }

            displayValue = displayValue.toLowerCase();

            var regions = this.regionProvider.regions;
            var regionNames = this._regionNames;

            var result = [];

            for (var i = 0; i < regions.length; ++i) {
                var name = regionNames[i];
                var region = this.region
                if (name && name.toLowerCase().indexOf(displayValue) >= 0) {
                    result.push({
                        name: name,
                        id: regions[i].id,
                        FID: regions[i].FID,
                        realRegion: regions[i]
                    });
                }
            }

            this.autocompleteVisible = result.length > 0 && result.length < 100;

            return result;
        }
    });

    knockout.defineProperty(this, 'value', {
        get: function() {
            return this.parameter.getValue(this._parameterValues);
        },
        set: function(value) {
            if (defined(value) && defined(value.realRegion)) {
                value = value.realRegion;
            }
            this._parameterValues[this.parameter.id] = value;
            this._displayValue = undefined;

            updateMapFromValue(this);
        }
    });

    knockout.defineProperty(this, 'regionProvider', {
        get: function() {
            return this.parameter.getRegionProvider(this._parameterValues);
        }
    });

    knockout.defineProperty(this, 'displayValue', {
        get: function() {
            var region = this.value;
            if (!defined(region)) {
                return this._displayValue;
            }

            var index = this.regionProvider.regions.indexOf(region);
            if (index >= 0 && this._regionNames[index]) {
                return this._regionNames[index]
            } else {
                return region.id;
            }
        },
        set: function(value) {
            this.autocompleteVisible = true;
            this.value = undefined;
            this._displayValue = value;
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
            that._lastRegionFeature = feature.data;
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

        when.all([that.regionProvider.loadRegionIDs(), that.regionProvider.loadRegionNames()]).then(function() {
            if (that.regionProvider !== that._loadingRegionProvider) {
                return;
            }

            that._regionNames = that.regionProvider.regionNames;

            if (defined(catalogItem)) {
                catalogItem.isEnabled = false;
                catalogItem = undefined;
            }

            catalogItem = new WebMapServiceCatalogItem(that.terriaForRegionSelection);
            catalogItem.url = that.regionProvider.server;
            catalogItem.layers = that.regionProvider.layerName;
            catalogItem.parameters = {
                styles: 'border_black_fill_aqua'
            };
            catalogItem.isEnabled = true;

            that._loadingRegionProvider = undefined;
        });
    }

    knockout.getObservable(this, 'regionProvider').subscribe(addRegionLayer);
    addRegionLayer();

    updateMapFromValue(this);
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

RegionParameterEditor.prototype.selectRegion = function(region) {
    this.value = region;
};

function updateMapFromValue(parameterEditor) {
    if (!defined(parameterEditor.regionProvider)) {
        return;
    }

    var value = parameterEditor.value;
    var parameter = parameterEditor.parameter;
    var parameterValues = parameterEditor._parameterValues;

    var that = parameterEditor;
    parameterEditor.regionProvider.getRegionFeature(parameterEditor.catalogFunction.terria, value, parameterEditor._lastRegionFeature).then(function(feature) {
        if (parameterValues[parameter.id] !== value) {
            // Value has already changed.
            return;
        }

        if (defined(that._selectedRegionCatalogItem)) {
            that._selectedRegionCatalogItem.isEnabled = false;
            that._selectedRegionCatalogItem = undefined;
        }

        if (defined(feature) && feature.type === 'Feature') {
            that._selectedRegionCatalogItem = new GeoJsonCatalogItem(that.terriaForRegionSelection);
            that._selectedRegionCatalogItem.data = feature;
            that._selectedRegionCatalogItem.isEnabled = true;
            that._selectedRegionCatalogItem.zoomTo();
        }
    }).otherwise(function() {
        if (parameterValues[parameter.id] !== value) {
            // Value has already changed.
            return;
        }

        if (defined(that._selectedRegionCatalogItem)) {
            that._selectedRegionCatalogItem.isEnabled = false;
            that._selectedRegionCatalogItem = undefined;
        }
    });
}

module.exports = RegionParameterEditor;

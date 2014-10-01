'use strict';

/*global require,L,URI,$*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var Color = require('../../third_party/cesium/Source/Core/Color');
var ColorMaterialProperty = require('../../third_party/cesium/Source/DataSources/ColorMaterialProperty');
var combine = require('../../third_party/cesium/Source/Core/combine');
var ConstantProperty = require('../../third_party/cesium/Source/DataSources/ConstantProperty');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var GeoJsonDataSource = require('../../third_party/cesium/Source/DataSources/GeoJsonDataSource');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var corsProxy = require('../corsProxy');
var DataSourceMetadataViewModel = require('./DataSourceMetadataViewModel');
var DataSourceMetadataItemViewModel = require('./DataSourceMetadataItemViewModel');
var GeoDataSourceViewModel = require('./GeoDataSourceViewModel');
var ImageryLayerDataSourceViewModel = require('./ImageryLayerDataSourceViewModel');
var inherit = require('../inherit');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');

var lineAndFillPalette = {
    minimumRed : 0.4,
    minimumGreen : 0.4,
    minimumBlue : 0.4,
    maximumRed : 0.9,
    maximumGreen : 0.9,
    maximumBlue : 0.9,
    alpha : 1.0
};

var pointPalette = {
    minimumRed : 0.6,
    minimumGreen : 0.6,
    minimumBlue : 0.6,
    maximumRed : 1.0,
    maximumGreen : 1.0,
    maximumBlue : 1.0,
    alpha : 1.0
};

/**
 * A {@link GeoDataSourceViewModel} representing GeoJSON feature data.
 *
 * @alias GeoJsonDataSourceViewModel
 * @constructor
 * @extends GeoDataSourceViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 * @param {String} [url] The URL from which to retrieve the GeoJSON data.
 */
var GeoJsonDataSourceViewModel = function(context, url) {
    GeoDataSourceViewModel.call(this, context);

    this._cesiumDataSource = undefined;

    this._needsLoad = true;
    this._loadedGeoJson = undefined;

    /**
     * Gets or sets the URL from which to retrieve GeoJSON data.  This property is ignored if
     * {@link GeoJsonDataSourceViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the GeoJSON data, represented as an object literal (not a string).
     * This property is observable.
     * @type {Object}
     */
    this.data = undefined;

    knockout.track(this, ['_needsLoad', '_loadedGeoJson', 'url', 'data']);

    /**
     * Gets the loaded GeoJSON as an object literal (not a string).  This property is undefined if the
     * data is not yet loaded.  This property is observable.
     * @memberOf GeoJsonDataSourceViewModel
     * @instance
     * @name loadedGeoJson
     * @type {Object}
     */
    knockout.defineProperty(this, 'loadedGeoJson', {
        get : function() {
            if (this._needsLoad) {
                this._needsLoad = false;

                var that = this;

                if (defined(this.data)) {
                    updateViewModelFromData(this, this.data);
                    loadGeoJsonInCesium(that);
                } else if (defined(this.url) && this.url.length > 0) {
                    loadJson(this.url).then(function(json) {
                        updateViewModelFromData(that, json);
                        loadGeoJsonInCesium(that);
                    }).otherwise(function(e) {
                        // TODO: need to standard way of handling errors like this.
                    });
                }
            }

            return this._loadedGeoJson;
        }
    });
};

function updateViewModelFromData(viewModel, geoJson) {
    // If this GeoJSON data is an object literal with a single property, treat that
    // property as the name of the data source, and the property's value as the
    // actual GeoJSON.
    var numProperties = 0;
    var propertyName;
    for (propertyName in geoJson) {
        if (geoJson.hasOwnProperty(propertyName)) {
            ++numProperties;
            if (numProperties > 1) {
                break; // no need to count past 2 properties.
            }
        }
    }

    var name;
    if (numProperties === 1) {
        name = propertyName;
        geoJson = geoJson[propertyName];

        if (!defined(viewModel.name) || viewModel.name.length === 0 || viewModel.name === viewModel.url) {
            viewModel.name = name;
        }
    }

    viewModel._loadedGeoJson = geoJson;
}

GeoJsonDataSourceViewModel.prototype = inherit(GeoDataSourceViewModel.prototype);

defineProperties(GeoJsonDataSourceViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @type {String}
     */
    type : {
        get : function() {
            return 'geojson';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GeoJSON'.
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'GeoJSON';
        }
    },

    metadata : {
        get : function() {
            // TODO: maybe return the FeatureCollection's properties?
            return undefined;
        }
    }
});

/**
 * Updates the GeoJSON data item from a JSON object-literal description of it.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
 GeoJsonDataSourceViewModel.prototype.updateFromJson = function(json) {
    this.name = defaultValue(json.name, 'Unnamed Item');
    this.description = defaultValue(json.description, '');
    this.legendUrl = json.legendUrl;
    this.dataUrl = json.dataUrl;
    this.dataUrlType = defaultValue(json.dataUrlType, 'direct');
    this.dataCustodian = defaultValue(json.dataCustodian, 'Unknown');
    this.metadataUrl = json.metadataUrl;

    this.url = defaultValue(json.url, '');

    if (defined(json.rectangle)) {
        this.rectangle = Rectangle.fromDegrees(json.rectangle[0], json.rectangle[1], json.rectangle[2], json.rectangle[3]);
    } else {
        this.rectangle = Rectangle.MAX_VALUE;
    }
};

GeoJsonDataSourceViewModel.prototype.enableInCesium = function() {
    if (defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var viewer = this.context.cesiumViewer;

    this._cesiumDataSource = new GeoJsonDataSource(this.name);

    loadGeoJsonInCesium(this);
};

GeoJsonDataSourceViewModel.prototype.disableInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this.isShown = false;
    this._cesiumDataSource = undefined;
};

GeoJsonDataSourceViewModel.prototype.showInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.cesiumViewer.dataSources;
    if (dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._cesiumDataSource);
};

GeoJsonDataSourceViewModel.prototype.hideInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.cesiumViewer.dataSources;
    if (!dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._cesiumDataSource, false);
};

GeoJsonDataSourceViewModel.prototype.enableInLeaflet = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('Data item is already enabled.');
    }

    var map = this.context.leafletMap;

    var options = {
        layers : this.layers,
        opacity : this.alpha,
        bounds : rectangleToLatLngBounds(this.rectangle)
    };

    options = combine(this.parameters, options);

    this._imageryLayer = new L.tileLayer.wms(proxyUrl(this.context, this.url), options);
    map.addLayer(this._imageryLayer);
};

GeoJsonDataSourceViewModel.prototype.disableInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('Data item is not enabled.');
    }

    var map = this.context.leafletMap;

    map.removeLayer(this._imageryLayer);
    this._imageryLayer = undefined;
};

function proxyUrl(context, url) {
    if (defined(context.corsProxy) && context.corsProxy.shouldUseProxy(url)) {
        return context.corsProxy.getURL(url);
    }

    return url;
}

function loadGeoJsonInCesium(viewModel) {
    if (!(viewModel._cesiumDataSource instanceof GeoJsonDataSource) || !defined(viewModel.loadedGeoJson)) {
        return;
    }

    var fillPolygons = false;
    var pointColor = getRandomColor(pointPalette, viewModel.name);
    var lineColor = getRandomColor(lineAndFillPalette, viewModel.name);
    var fillColor = Color.clone(lineColor);
    fillColor.alpha = 0.75;

    var pointSize = 10;
    var lineWidth = 2;

    var dataSource = viewModel._cesiumDataSource;
    dataSource.load(viewModel.loadedGeoJson).then(function() {
        var entities = dataSource.entities.entities;

        for (var i = 0; i < entities.length; ++i) {
            var entity = entities[i];
            var material;

            // Update default point/line/polygon
            var point = entity.point;
            if (defined(point)) {
                point.color = new ConstantProperty(pointColor);
                point.pixelSize = new ConstantProperty(pointSize);
                point.outlineColor = new ConstantProperty(Color.BLACK);
                point.outlineWidth = new ConstantProperty(1);
            }

            var polyline = entity.polyline;
            if (defined(polyline)) {
                material = new ColorMaterialProperty();
                material.color = new ConstantProperty(lineColor);
                polyline.material = material;
                polyline.width = new ConstantProperty(lineWidth);
            }

            var polygon = entity.polygon;
            if (defined(polygon)) {
                polygon.fill = new ConstantProperty(fillPolygons);
                polygon.outline = new ConstantProperty(true);

                material = new ColorMaterialProperty();
                material.color = new ConstantProperty(fillColor);
                polygon.material = material;
            }
        }
    });
}

// Get a random color for the data based on the passed seed (usually dataset name)
function getRandomColor(palette, seed) {
    if (defined(seed)) {
        if (typeof seed === 'string') {
            var val = 0;
            for (var i = 0; i < seed.length; i++) {
                val += seed.charCodeAt(i);
            }
            seed = val;
        }
        CesiumMath.setRandomNumberSeed(seed);
    }
    return Color.fromRandom(palette);
}

module.exports = GeoJsonDataSourceViewModel;

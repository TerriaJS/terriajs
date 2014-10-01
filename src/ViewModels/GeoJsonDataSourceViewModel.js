'use strict';

/*global require,L,URI,$*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var combine = require('../../third_party/cesium/Source/Core/combine');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');

var corsProxy = require('../corsProxy');
var DataSourceMetadataViewModel = require('./DataSourceMetadataViewModel');
var DataSourceMetadataItemViewModel = require('./DataSourceMetadataItemViewModel');
var GeoDataSourceViewModel = require('./GeoDataSourceViewModel');
var ImageryLayerDataSourceViewModel = require('./ImageryLayerDataSourceViewModel');
var inherit = require('../inherit');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');

/**
 * A {@link ImageryLayerDataSourceViewModel} representing a layer from a Web Map Service (WMS) server.
 *
 * @alias WebMapServiceDataSourceViewModel
 * @constructor
 * @extends GeoDataSourceViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 * @param {String} [url] The URL from which to retrieve the GeoJSON data.
 */
var GeoJsonDataSourceViewModel = function(context, url) {
    GeoDataSourceViewModel.call(this, context);

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
     * data is not yet loaded.
     * @name loadedGeoJson
     * @type {Object}
     */
    knockout.defineProperty(this, 'loadedGeoJson', {
        get : function() {
            if (this._needsLoad) {
                this._needsLoad = false;

                if (defined(this.data)) {
                    this._loadedGeoJson = this.data;
                } else if (defined(this.url) && this.url.length > 0) {
                    loadJson(this.url).then(function(json) {
                        this._loadedGeoJson = json;
                    }).otherwise(function(e) {
                        // TODO: need to standard way of handling errors like this.
                    });
                }
            }

            return this._loadedGeoJson;
        }
    });
};

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
 * Updates the WMS data item from a JSON object-literal description of it.
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
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('Data item is already enabled.');
    }

    var scene = this.context.cesiumScene;

    var imageryProvider = new WebMapServiceImageryProvider({
        url : proxyUrl(this.context, this.url),
        layers : this.layers,
        getFeatureInfoAsGeoJson : this.getFeatureInfoAsGeoJson,
        getFeatureInfoAsXml : this.getFeatureInfoAsXml,
        parameters : this.parameters
    });

    this._imageryLayer = new ImageryLayer(imageryProvider, {
        alpha : this.alpha,
        rectangle : this.rectangle
    });

    scene.imageryLayers.add(this._imageryLayer);
};

GeoJsonDataSourceViewModel.prototype.disableInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('Data item is not enabled.');
    }

    var scene = this.context.cesiumScene;

    scene.imageryLayers.remove(this._imageryLayer);
    this._imageryLayer = undefined;
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

function requestMetadata(viewModel) {
    var result = new DataSourceMetadataViewModel();

    result.isLoading = true;

    result.promise = loadXML(proxyUrl(viewModel.context, viewModel.metadataUrl)).then(function(capabilities) {
        var json = $.xml2json(capabilities);

        if (json.Service) {
            populateMetadataGroup(result.serviceMetadata, json.Service);
        } else {
            result.serviceErrorMessage = 'Service information not found in GetCapabilities operation response.';
        }

        var layer;
        if (defined(json.Capability)) {
            layer = findLayer(json.Capability.Layer, viewModel.layers);
        }
        if (layer) {
            populateMetadataGroup(result.dataSourceMetadata, layer);
        } else {
            result.dataSourceErrorMessage = 'Layer information not found in GetCapabilities operation response.';
        }

        result.isLoading = false;
    }).otherwise(function() {
        result.dataSourceErrorMessage = 'An error occurred while invoking the GetCapabilities service.';
        result.serviceErrorMessage = 'An error occurred while invoking the GetCapabilities service.';
        result.isLoading = false;
    });

    return result;
}

function findLayer(startLayer, name) {
    if (startLayer.Name === name || startLayer.Title === name) {
        return startLayer;
    }

    var layers = startLayer.Layer;
    if (!defined(layers)) {
        return undefined;
    }

    var found = findLayer(layers, name);
    for (var i = 0; !found && i < layers.length; ++i) {
        var layer = layers[i];
        found = findLayer(layer, name);
    }

    return found;
}

function populateMetadataGroup(metadataGroup, sourceMetadata) {
    if (typeof sourceMetadata === 'string' || sourceMetadata instanceof Array) {
        return;
    }

    for (var name in sourceMetadata) {
        if (sourceMetadata.hasOwnProperty(name)) {
            var value = sourceMetadata[name];

            var dest;
            if (name === 'BoundingBox' && value instanceof Array) {
                for (var i = 0; i < value.length; ++i) {
                    var subValue = value[i];

                    dest = new DataSourceMetadataItemViewModel();
                    dest.name = name + ' (' + subValue.CRS + ')';
                    dest.value = subValue;

                    populateMetadataGroup(dest, subValue);

                    metadataGroup.items.push(dest);
                }
            } else {
                dest = new DataSourceMetadataItemViewModel();
                dest.name = name;
                dest.value = value;

                populateMetadataGroup(dest, value);

                metadataGroup.items.push(dest);
            }
        }
    }
}

module.exports = GeoJsonDataSourceViewModel;

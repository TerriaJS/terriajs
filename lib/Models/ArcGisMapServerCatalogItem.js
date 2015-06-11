'use strict';

/*global require*/
var URI = require('URIjs');

var ArcGisMapServerImageryProvider = require('terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var MetadataItem = require('./MetadataItem');
var overrideProperty = require('../Core/overrideProperty');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from an Esri ArcGIS MapServer.
 *
 * @alias ArcGisMapServerCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var ArcGisMapServerCatalogItem = function(terria) {
    ImageryLayerCatalogItem.call(this, terria);

    this._legendUrl = undefined;

    /**
     * Gets or sets the URL of the WMS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the comma-separated list of layer IDs to show.  If this property is undefined,
     * all layers are shown.
     * @type {String}
     */
    this.layers = undefined;

    /**
     * Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing
     * a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property,
     * will be used and will simply get blurier as the user zooms in closer.
     * @type {Number}
     */
    this.maximumScale = undefined;

    /**
     * Gets or sets the MapServer metadata obtained from the server.  If this property is undefined, the data will be retrieved from the server when the
     * catalog item is enabled.
     * @type {Object}
     */
    this.mapServerData = undefined;

    knockout.track(this, ['url', 'layers', 'maximumScale', '_legendUrl']);

    // metadataUrl and legendUrl are derived from url if not explicitly specified.
    overrideProperty(this, 'metadataUrl', {
        get : function() {
            if (defined(this._metadataUrl)) {
                return this._metadataUrl;
            }

            return cleanUrl(this.url);
        },
        set : function(value) {
            this._metadataUrl = value;
        }
    });

    overrideProperty(this, 'legendUrl', {
        get : function() {
            if (defined(this._legendUrl)) {
                return this._legendUrl;
            }
            return cleanUrl(this.url) + '/legend';
        },
        set : function(value) {
            this._legendUrl = value;
        }
    });

};

inherit(ImageryLayerCatalogItem, ArcGisMapServerCatalogItem);

defineProperties(ArcGisMapServerCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf ArcGisMapServerCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'esri-mapServer';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Esri ArcGIS MapServer'.
     * @memberOf ArcGisMapServerCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Esri ArcGIS MapServer';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf ArcGisMapServerCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            if (!defined(this._metadata)) {
                this._metadata = requestMetadata(this);
            }
            return this._metadata;
        }
    }
});

ArcGisMapServerCatalogItem.prototype._createImageryProvider = function() {
    var maximumLevel;

    if (defined(this.maximumScale) && this.maximumScale > 0.0) {
        var dpi = 96; // Esri default DPI, unless we specify otherwise.
        var centimetersPerInch = 2.54;
        var centimetersPerMeter = 100;
        var dotsPerMeter = dpi * centimetersPerMeter / centimetersPerInch;
        var tileWidth = 256;

        var circumferenceAtEquator = 2 * Math.PI * Ellipsoid.WGS84.maximumRadius;
        var distancePerPixelAtLevel0 = circumferenceAtEquator / tileWidth;
        var level0ScaleDenominator = distancePerPixelAtLevel0 * dotsPerMeter;

        // 1e-6 epsilon from WMS 1.3.0 spec, section 7.2.4.6.9.
        var ratio = level0ScaleDenominator / (this.maximumScale - 1e-6);
        var levelAtMinScaleDenominator = Math.log(ratio) / Math.log(2);
        maximumLevel = levelAtMinScaleDenominator | 0;
    }

    return new ArcGisMapServerImageryProvider({
        url: cleanAndProxyUrl( this.terria, this.url),
        layers: this.layers,
        tilingScheme: new WebMercatorTilingScheme(),
        maximumLevel: maximumLevel,
        mapServerData: this.mapServerData
    });
};

function cleanAndProxyUrl(terria, url) {
    return proxyUrl(terria, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function proxyUrl(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
        return terria.corsProxy.getURL(url);
    }

    return url;
}

function requestMetadata(item) {
    var result = new Metadata();

    result.isLoading = true;

    var servicePromise = loadJson(cleanAndProxyUrl(item.terria, item.metadataUrl) + '?f=json').then(function(serviceMetadata) {
        populateMetadataGroup(result.serviceMetadata, serviceMetadata);
    }).otherwise(function() {
        result.serviceErrorMessage = 'An error occurred while invoking the ArcGIS map service.';
    });

    var dataPromise = loadJson(cleanAndProxyUrl(item.terria, item.metadataUrl) + '/layers?f=json').then(function(layerMetadata) {
        if (item.layers) {
            var layerIds = item.layers.split(', ');

            var layers = [];
            for (var i = 0; i < layerIds.length; ++i) {
                var layer = findLayer(layerMetadata.layers, layerIds[i]);
                if (defined(layer)) {
                    layers.push(layer);
                }
            }

            if (layers.length === 0) {
                result.dataSourceErrorMessage = 'No details are available.';
            } else if (layers.length === 1) {
                populateMetadataGroup(result.dataSourceMetadata, layers[0]);
            } else {
                populateMetadataGroup(result.dataSourceMetadata, layers);
            }
        } else {
            result.dataSourceErrorMessage = 'Using all layers from this service that are visible by default.  See the Service Details below.';
        }
    }).otherwise(function() {
        result.dataSourceErrorMessage = 'An error occurred while invoking the ArcGIS map service.';
    });

    result.promise = when.all([servicePromise, dataPromise]).always(function() {
        result.isLoading = false;
    });

    return result;
}

function populateMetadataGroup(metadataGroup, sourceMetadata) {
    if (typeof sourceMetadata === 'string' || sourceMetadata instanceof String) {
        return;
    }

    if (sourceMetadata instanceof Array && (sourceMetadata.length === 0 || typeof sourceMetadata[0] !== 'object')) {
        return;
    }

    for (var name in sourceMetadata) {
        if (sourceMetadata.hasOwnProperty(name)) {
            var value = sourceMetadata[name];

            var dest = new MetadataItem();
            dest.name = name;
            dest.value = value;

            populateMetadataGroup(dest, value);

            metadataGroup.items.push(dest);
        }
    }
}

function findLayer(layers, id) {
    id = id.toString();
    for (var i = 0; i < layers.length; ++i) {
        var layer = layers[i];
        if (layer.id.toString() === id.toString()) {
            return layer;
        }
    }
    return undefined;
}

module.exports = ArcGisMapServerCatalogItem;

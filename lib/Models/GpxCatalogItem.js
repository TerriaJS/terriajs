'use strict';

/*global require*/
var toGeoJSON = require('togeojson');

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');

var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var readText = require('../Core/readText');
var loadText = require('terriajs-cesium/Source/Core/loadText');


/**
 * A {@link CatalogItem} representing GPX data.
 *
 * @alias GpxCatalogItem
 * @constructor
 * @extends GeoJsonCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the GPX data.
 */
var GpxCatalogItem =  function(terria, url) {
     CatalogItem.call(this, terria);

    this._geoJsonItem = undefined;

    /**
     * Gets or sets the URL from which to retrieve GPX data.  This property is ignored if
     * {@link GpxCatalogItem#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the Gpx data, represented as a binary Blob, DOM Document, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|Document|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link GpxCatalogItem#data} was obtained.  This may be used
     * to resolve any resources linked in the Gpx file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

inherit(CatalogItem, GpxCatalogItem);

defineProperties(GpxCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf GpxCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'gpx';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf GpxCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'GPX';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf GpxCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

GpxCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

GpxCatalogItem.prototype._load = function() {
    this._geoJsonItem = new GeoJsonCatalogItem( this.terria);

    var that = this;

    if (defined(that.data)) {
        return when(that.data, function(data) {
            var promise;
            if (data instanceof Blob) {
                promise = readText(data);
            } else {
                promise = data;
            }

            return when(promise, function(text) {
                return loadGpxText(that, text);
            });
        });
    } else {
        return loadText(proxyUrl(that, that.url)).then(function(text) {
            return loadGpxText(that, text);
        }).otherwise(function() {
            errorLoading(that);
        });
    }
};

GpxCatalogItem.prototype._enable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._enable();
    }
};

GpxCatalogItem.prototype._disable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._disable();
    }
};

GpxCatalogItem.prototype._show = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._show();
    }
};

GpxCatalogItem.prototype._hide = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
    }
};


function proxyUrl(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
        return terria.corsProxy.getURL(url);
    }

    return url;
}

function loadGpxText(gpxItem, text) {

    var dom = (new DOMParser()).parseFromString(text, 'text/xml');
    var geojson = toGeoJSON.gpx(dom);

    gpxItem._geoJsonItem.data = geojson;

    return gpxItem._geoJsonItem.load().then(function() {
        gpxItem.rectangle = gpxItem._geoJsonItem.rectangle;
        gpxItem.clock = gpxItem._geoJsonItem.clock;
    });
}

function errorLoading(gpxItem) {
    var terria = gpxItem.terria;
    throw new ModelError({
        sender: gpxItem,
        title: 'Error loading GPX',
        message: '\
An error occurred while loading a GPX file.  This may indicate that the file is invalid or that it \
is not supported by '+terria.appName+'.  If you would like assistance or further information, please email us \
at <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a>.'
    });
}

module.exports = GpxCatalogItem;

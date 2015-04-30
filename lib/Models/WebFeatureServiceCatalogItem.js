'use strict';

/*global require*/
var URI = require('URIjs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');
var objectToQuery = require('terriajs-cesium/Source/Core/objectToQuery');

var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var gmlToGeoJson = require('../Map/gmlToGeoJson');
var overrideProperty = require('../Core/overrideProperty');

/**
 * A {@link CatalogItem} representing a layer from a Web Feature Service (WFS) server.
 *
 * @alias WebFeatureServiceCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var WebFeatureServiceCatalogItem = function(terria) {
     CatalogItem.call(this, terria);

    this._dataUrl = undefined;
    this._dataUrlType = undefined;
    this._metadataUrl = undefined;
    this._geoJsonItem = undefined;

    /**
     * Gets or sets the URL of the WFS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the WFS feature type names.
     * @type {String}
     */
    this.typeNames = '';

    /**
     * Gets or sets a value indicating whether we should request GeoJSON from the WFS server.  If this property
     * and {@link WebFeatureServiceCatalogItem#requestGeoJson} are both true, we'll request GeoJSON first and
     * only fall back on trying GML if the GeoJSON request fails.
     * @type {Boolean}
     * @default true
     */
    this.requestGeoJson = true;

    /**
     * Gets or sets a value indicating whether we should request GML from the WFS server.  If this property
     * and {@link WebFeatureServiceCatalogItem#requestGeoJson} are both true, we'll request GeoJSON first and
     * only fall back on trying GML if the GeoJSON request fails.
     * @type {Boolean}
     * @default true
     */
    this.requestGml = true;

    knockout.track(this, ['_dataUrl', '_dataUrlType', '_metadataUrl', 'url', 'typeNames', 'requestGeoJson', 'requestGml']);

    // dataUrl, metadataUrl, and legendUrl are derived from url if not explicitly specified.
    overrideProperty(this, 'dataUrl', {
        get : function() {
            var url = this._dataUrl;
            if (!defined(url)) {
                url = this.url;
            }

            if (this.dataUrlType === 'wfs') {
                url = cleanUrl(url) + '?service=WFS&version=1.1.0&request=GetFeature&typeName=' + this.typeNames + '&srsName=EPSG%3A4326&maxFeatures=1000';
            }

            return url;
        },
        set : function(value) {
            this._dataUrl = value;
        }
    });

    overrideProperty(this, 'dataUrlType', {
        get : function() {
            if (defined(this._dataUrlType)) {
                return this._dataUrlType;
            } else {
                return 'wfs';
            }
        },
        set : function(value) {
            this._dataUrlType = value;
        }
    });

    overrideProperty(this, 'metadataUrl', {
        get : function() {
            if (defined(this._metadataUrl)) {
                return this._metadataUrl;
            }

            return cleanUrl(this.url) + '?service=WFS&version=1.1.0&request=GetCapabilities';
        },
        set : function(value) {
            this._metadataUrl = value;
        }
    });
};

inherit(CatalogItem, WebFeatureServiceCatalogItem);

defineProperties(WebFeatureServiceCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wfs';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Web Feature Service (WFS)'.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Feature Service (WFS)';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return WebFeatureServiceCatalogItem.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return WebFeatureServiceCatalogItem.defaultSerializers;
        }
    }
});

WebFeatureServiceCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);
freezeObject(WebFeatureServiceCatalogItem.defaultUpdaters);

WebFeatureServiceCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

// Serialize the underlying properties instead of the public views of them.
WebFeatureServiceCatalogItem.defaultSerializers.dataUrl = function(wfsItem, json, propertyName) {
    json.dataUrl = wfsItem._dataUrl;
};
WebFeatureServiceCatalogItem.defaultSerializers.dataUrlType = function(wfsItem, json, propertyName) {
    json.dataUrlType = wfsItem._dataUrlType;
};
WebFeatureServiceCatalogItem.defaultSerializers.metadataUrl = function(wfsItem, json, propertyName) {
    json.metadataUrl = wfsItem._metadataUrl;
};
freezeObject(WebFeatureServiceCatalogItem.defaultSerializers);

WebFeatureServiceCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.typeNames, this.requestGeoJson, this.requestGml];
};

WebFeatureServiceCatalogItem.prototype._load = function() {
    this._geoJsonItem = new GeoJsonCatalogItem( this.terria);


    var promise;
    if (this.requestGeoJson) {
        promise = loadGeoJson(this);
    } else if (this.requestGml) {
        promise = loadGml(this);
    } else {
        return;
    }

    this._geoJsonItem.data = promise;

    var that = this;
    return that._geoJsonItem.load().then(function() {
        that.rectangle = that._geoJsonItem.rectangle;
    });
};

WebFeatureServiceCatalogItem.prototype._enable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._enable();
    }
};

WebFeatureServiceCatalogItem.prototype._disable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._disable();
    }
};

WebFeatureServiceCatalogItem.prototype._show = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._show();
    }
};

WebFeatureServiceCatalogItem.prototype._hide = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
    }
};

function loadGeoJson(wfsItem) {
    var promise = loadJson(buildGeoJsonUrl(wfsItem)).then(function(json) {
        return json;
    });

    if (wfsItem.requestGml) {
        promise = promise.otherwise(function() {
            return loadGml(wfsItem);
        });
    }

    return promise;
}

function loadGml(wfsItem) {
    return loadXML(buildGmlUrl(wfsItem)).then(function(xml) {
        return gmlToGeoJson(xml);
    });
}

function buildGeoJsonUrl(wfsItem) {
    var url = cleanAndProxyUrl(wfsItem.terria, wfsItem.url);
    return url + '?' + objectToQuery({
        service: 'WFS',
        request: 'GetFeature',
        typeName: wfsItem.typeNames,
        version: '1.1.0',
        outputFormat: 'JSON',
        srsName: 'EPSG:4326'
    });
}

function buildGmlUrl(wfsItem) {
    var url = cleanAndProxyUrl(wfsItem.terria, wfsItem.url);
    return url + '?' + objectToQuery({
        service: 'WFS',
        request: 'GetFeature',
        typeName: wfsItem.typeNames,
        version: '1.1.0',
        srsName: 'EPSG:4326'
    });
}

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

module.exports = WebFeatureServiceCatalogItem;

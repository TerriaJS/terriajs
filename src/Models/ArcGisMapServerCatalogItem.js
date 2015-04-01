'use strict';

/*global require,URI*/

var ArcGisMapServerImageryProvider = require('../../third_party/cesium/Source/Scene/ArcGisMapServerImageryProvider');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from an Esri ArcGIS MapServer.
 *
 * @alias ArcGisMapServerCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 * 
 * @param {Application} application The application.
 */
var ArcGisMapServerCatalogItem = function(application) {
    ImageryLayerCatalogItem.call(this, application);

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

    knockout.track(this, ['url', 'layers', '_legendUrl']);

    // dataUrl, metadataUrl, and legendUrl are derived from url if not explicitly specified.
    delete this.__knockoutObservables.legendUrl;
    knockout.defineProperty(this, 'legendUrl', {
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
    }
});

ArcGisMapServerCatalogItem.prototype._createImageryProvider = function() {
    return new ArcGisMapServerImageryProvider({
        url : cleanAndProxyUrl(this.application, this.url),
        layers : this.layers,
        tilingScheme : new WebMercatorTilingScheme()
    });
};

function cleanAndProxyUrl(application, url) {
    return proxyUrl(application, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function proxyUrl(application, url) {
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(url)) {
        return application.corsProxy.getURL(url);
    }

    return url;
}

module.exports = ArcGisMapServerCatalogItem;

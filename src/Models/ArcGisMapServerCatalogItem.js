'use strict';

/*global require,URI*/

var ArcGisMapServerImageryProvider = require('../../third_party/cesium/Source/Scene/ArcGisMapServerImageryProvider');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var overrideProperty = require('../Core/overrideProperty');

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

    /**
     * Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing
     * a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property,
     * will be used and will simply get blurier as the user zooms in closer.
     * @type {Number}
     */
    this.maximumScale = undefined;

    knockout.track(this, ['url', 'layers', 'maximumScale', '_legendUrl']);

    // dataUrl, metadataUrl, and legendUrl are derived from url if not explicitly specified.
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
    }
});

ArcGisMapServerCatalogItem.prototype._createImageryProvider = function() {
    var maximumLevel;

    if (defined(this.maximumScale)) {
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
        url: cleanAndProxyUrl(this.application, this.url),
        layers: this.layers,
        tilingScheme: new WebMercatorTilingScheme(),
        maximumLevel: maximumLevel
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

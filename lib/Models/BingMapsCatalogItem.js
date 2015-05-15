'use strict';

/*global require*/

var BingMapsImageryProvider = require('terriajs-cesium/Source/Scene/BingMapsImageryProvider');
var BingMapsStyle = require('terriajs-cesium/Source/Scene/BingMapsStyle');
var Credit = require('terriajs-cesium/Source/Core/Credit');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from the Bing Maps server.
 *
 * @alias BingMapsCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var BingMapsCatalogItem = function(terria) {
    ImageryLayerCatalogItem.call(this, terria);

    /**
     * Gets or sets the style of the Bing Maps map to use.
     * @type {BingMapsStyle}
     */
    this.mapStyle = BingMapsStyle.AERIAL;

    /**
     * Gets or sets the Bing Maps API key to use.  If this property is undefined,
     * {@link BingMapsApi.getKey} is used.
     * @type {String}
     */
    this.key = undefined;

    knockout.track(this, ['mapStyle', 'key']);
};

inherit(ImageryLayerCatalogItem, BingMapsCatalogItem);

defineProperties(BingMapsCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf BingMapsCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'bing-maps';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Bing Maps'.
     * @memberOf BingMapsCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Bing Maps';
        }
    }
});

BingMapsCatalogItem.prototype._createImageryProvider = function() {
    var result = new BingMapsImageryProvider({
        url: '//dev.virtualearth.net',
        mapStyle: this.mapStyle,
        key: this.key
    });

    result._credit = new Credit('Bing', undefined, 'http://www.bing.com');
    result.defaultGamma = 1.0;

    return result;
};

module.exports = BingMapsCatalogItem;

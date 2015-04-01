'use strict';

/*global require*/

var BingMapsImageryProvider = require('../../third_party/cesium/Source/Scene/BingMapsImageryProvider');
var BingMapsStyle = require('../../third_party/cesium/Source/Scene/BingMapsStyle');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from the Bing Maps server.
 *
 * @alias BingMapsCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 * 
 * @param {Application} application The application.
 */
var BingMapsCatalogItem = function(application) {
    ImageryLayerCatalogItem.call(this, application);

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
    return new BingMapsImageryProvider({
        url: '//dev.virtualearth.net',
        mapStyle: this.mapStyle,
        key: this.key
    });
};

module.exports = BingMapsCatalogItem;

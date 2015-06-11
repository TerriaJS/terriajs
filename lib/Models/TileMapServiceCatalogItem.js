'use strict';

/*global require*/

var TileMapServiceImageryProvider = require('terriajs-cesium/Source/Scene/TileMapServiceImageryProvider');
var BingMapsStyle = require('terriajs-cesium/Source/Scene/BingMapsStyle');
var Credit = require('terriajs-cesium/Source/Core/Credit');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from a tile map server.
 *
 * @alias TileMapServiceCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var TileMapServiceCatalogItem = function(terria) {
    ImageryLayerCatalogItem.call(this, terria);

    /**
     * Gets or sets the url of the tilemap server.
     * Tile coordinates will be appended to the end of this URL to retrieve them.
     * This property is observable.
     * @type {String}
     */
    this.url = undefined;

    /**
     * Gets or sets the maximum zoom level.
     * @type {Integer}
     * @default 18
     */
    this.maxZoom = 18;

    /**
     * Gets or sets the minimum zoom level.
     * @type {Integer}
     * @default 0
     */
    this.minZoom = 0;

    /**
     * Gets or sets the tile discard policy.
     * @type {TileDiscardPolicy}
     */
    this.tileDiscardPolicy = undefined;

    /**
     * Gets or sets the credit object for the tile map service.
     * @type {Credit}
     */
    this.credit = undefined;

    knockout.track(this, ['url']);
};

inherit(ImageryLayerCatalogItem, TileMapServiceCatalogItem);

defineProperties(TileMapServiceCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf TileMapServiceCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'tms';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Bing Maps'.
     * @memberOf TileMapServiceCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Tile Map Service';
        }
    }
});

TileMapServiceCatalogItem.prototype._createImageryProvider = function() {
    return new TileMapServiceImageryProvider({
        url                 : this.url,
        minimumLevel        : this.minZoom,
        maximumLevel        : this.maxZoom,
        tileDiscardPolicy   : this.tileDiscardPolicy,
        credit              : this.credit
    });
};

module.exports = TileMapServiceCatalogItem;

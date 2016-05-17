'use strict';

/*global require*/

var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');

var TerrainCatalogItem = require('./TerrainCatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link TerrainCatalogItem} representing a Cesium terrain provider.
 *
 * @alias CesiumTerrainCatalogItem
 * @constructor
 * @extends TerrainCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var CesiumTerrainCatalogItem = function(terria) {
    TerrainCatalogItem.call(this, terria);
};

inherit(TerrainCatalogItem, CesiumTerrainCatalogItem);

defineProperties(CesiumTerrainCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf CesiumTerrainCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'cesium-terrain';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Tile Map Server'.
     * @memberOf CesiumTerrainCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Cesium Terrain';
        }
    }
});

CesiumTerrainCatalogItem.prototype._createTerrainProvider = function() {
    return new CesiumTerrainProvider({
        url: this.url
    });
};

module.exports = CesiumTerrainCatalogItem;

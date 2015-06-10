'use strict';

/*global require*/

var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var TerrainCatalogItem = require('./TerrainCatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link TerrainCatalogItem} representing a cesium terrain provider.
 *
 * @alias CesiumTerrainCatalogItem
 * @constructor
 * @extends TerrainCatalogItem
 *
 * @param {Application} application The application.
 */
var CesiumTerrainCatalogItem = function(application) {
    TerrainCatalogItem.call(this, application);

    /**
     * Gets or sets the url of the cesium terrain server
     * @type {String}
     */
    this.url = '';

    knockout.track(this, ['url', '_url']);

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
            return 'ctp';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Tile Map Server'.
     * @memberOf CesiumTerrainCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Cesium Terrain Provider';
        }
    }
});

CesiumTerrainCatalogItem.prototype._enableInCesium = function() {
    if (defined(this._terrainProvider)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var options = {
        url : this.url
    };

    this._terrainProvider = new CesiumTerrainProvider(options);
};

CesiumTerrainCatalogItem.prototype._disableInCesium = function() {
    if (!defined(this._terrainProvider)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._terrainProvider = undefined;
};

CesiumTerrainCatalogItem.prototype._enableInLeaflet = function() {

};

CesiumTerrainCatalogItem.prototype._disableInLeaflet = function() {

};

module.exports = CesiumTerrainCatalogItem;

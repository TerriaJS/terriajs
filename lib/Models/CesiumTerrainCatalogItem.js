'use strict';

/*global require*/

var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
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
 * @param {Terria} terria The Terria instance.
 */
var CesiumTerrainCatalogItem = function(terria) {
    TerrainCatalogItem.call(this, terria);

    /**
     * Gets or sets the url of the cesium terrain server
     * @type {String}
     */
    this.url = undefined;

    knockout.track(this, ['url']);

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
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf CesiumTerrainCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return CesiumTerrainCatalogItem.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
CesiumTerrainCatalogItem.defaultPropertiesForSharing = clone(TerrainCatalogItem.defaultPropertiesForSharing);
CesiumTerrainCatalogItem.defaultPropertiesForSharing.push('url');
freezeObject(CesiumTerrainCatalogItem.defaultPropertiesForSharing);


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

module.exports = CesiumTerrainCatalogItem;

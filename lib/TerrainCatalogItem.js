'use strict';

/*global require*/

var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var EllipsoidTerrainProvider = require('terriajs-cesium/Source/Core/EllipsoidTerrainProvider');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');


/**
 * A {@link CatalogItem} that is added to the map as 3D terrain.
 *
 * @alias TerrainCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Application} application The application.
 */
var TerrainCatalogItem = function(application) {
    CatalogItem.call(this, application);

    this._terrainProvider = undefined;

    this.defaultProvider = new EllipsoidTerrainProvider();
};

inherit(CatalogItem, TerrainCatalogItem);

defineProperties(TerrainCatalogItem.prototype, {
    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
     * @memberOf TerrainCatalogItem.prototype
     * @type {Object}
     */
    terrainProvider : {
        get : function() {
            return this._terrainProvider;
        }
    },

    /**
     * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
     * Data sources that cannot be reordered are typically displayed above reorderable data sources.
     * @memberOf TerrainCatalogItem.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf TerrainCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf TerrainCatalogItem.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return TerrainCatalogItem.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf TerrainCatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return TerrainCatalogItem.defaultSerializers;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf TerrainCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return TerrainCatalogItem.defaultPropertiesForSharing;
        }
    }
});

TerrainCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);
freezeObject(TerrainCatalogItem.defaultUpdaters);

TerrainCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);
freezeObject(TerrainCatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
TerrainCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
TerrainCatalogItem.defaultPropertiesForSharing.push('opacity');

freezeObject(TerrainCatalogItem.defaultPropertiesForSharing);

TerrainCatalogItem.prototype._showInCesium = function() {
    if (!defined(this._terrainProvider)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.application.cesium.scene;
    scene.terrainProvider = this._terrainProvider;
};

TerrainCatalogItem.prototype._hideInCesium = function() {
    if (!defined(this._terrainProvider)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.application.cesium.scene;
    scene.terrainProvider = this.defaultProvider;

};

TerrainCatalogItem.prototype._showInLeaflet = function() {

};

TerrainCatalogItem.prototype._hideInLeaflet = function() {

};

module.exports = TerrainCatalogItem;

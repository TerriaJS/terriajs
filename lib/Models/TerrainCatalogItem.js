'use strict';

/*global require*/

var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var EllipsoidTerrainProvider = require('terriajs-cesium/Source/Core/EllipsoidTerrainProvider');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var ViewerMode = require('./ViewerMode');

/**
 * A {@link CatalogItem} that is added to the map as 3D terrain.
 *
 * @alias TerrainCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var TerrainCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    this._terrainProvider = undefined;

    /**
     * Gets the default terrain provider object associated with this data source.
     * This property is the EllipsoidTerrainProvider by default.
     * @type {TerrainProvider}
     */
    this.defaultProvider = undefined;
};

inherit(CatalogItem, TerrainCatalogItem);

defineProperties(TerrainCatalogItem.prototype, {
    /**
     * Gets the terrain provider object associated with this data source.
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
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf CesiumTerrainCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return TerrainCatalogItem.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
TerrainCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
TerrainCatalogItem.defaultPropertiesForSharing.push('_url');
freezeObject(TerrainCatalogItem.defaultPropertiesForSharing);

TerrainCatalogItem.prototype._showInCesium = function() {
    if (!defined(this._terrainProvider)) {
        throw new DeveloperError('This data source is not enabled.');
    }
    this._disableOtherTerrainItems();
    var scene = this.terria.cesium.scene;
    scene.terrainProvider = this._terrainProvider;
};

TerrainCatalogItem.prototype._hideInCesium = function() {
    if (!defined(this._terrainProvider)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.terria.cesium.scene;

    if (!defined(this.defaultProvider)) {

        if (this.terria.viewerMode === ViewerMode.CesiumTerrain) {
            scene.terrainProvider = new CesiumTerrainProvider({
                url : '//assets.agi.com/stk-terrain/v1/tilesets/world/tiles'
            });

        } else if (this.terria.viewerMode === ViewerMode.CesiumEllipsoid) {
            scene.terrainProvider = new EllipsoidTerrainProvider();
        }

    } else {
        scene.terrainProvider = this.defaultProvider;
    }

};

TerrainCatalogItem.prototype._showInLeaflet = function() {
    // Nothing to be done. Perhaps switch user to 3D or notify that 3D is required?
};

TerrainCatalogItem.prototype._hideInLeaflet = function() {
    // Nothing to be done.
};

TerrainCatalogItem.prototype._enableInCesium = function() {
    throw new DeveloperError('_enableInCesium must be implemented in the derived class.');
};

TerrainCatalogItem.prototype._disableInCesium = function() {
    throw new DeveloperError('_disableInCesium must be implemented in the derived class.');
};

TerrainCatalogItem.prototype._enableInLeaflet = function() {
    // Nothing to be done.
};

TerrainCatalogItem.prototype._disableInLeaflet = function() {
    // Nothing to be done.
};

TerrainCatalogItem.prototype._disableOtherTerrainItems = function() {
    var items = this.terria.nowViewing.items;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item instanceof TerrainCatalogItem && item !== this) {
            item.isEnabled = false;
        }
    }
};

module.exports = TerrainCatalogItem;

'use strict';

/*global require*/

var CatalogItem = require('./CatalogItem');
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var ImagerySplitDirection = require('terriajs-cesium/Source/Scene/ImagerySplitDirection');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var TerriaError = require('../Core/TerriaError');

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
    this._originalTerrainProvider = undefined;
    this._supportsSplitting = false;

    /**
     * Gets or sets a value indicating whether other primitives will be depth tested against
     * this terrain.
     * @type {Boolean}
     * @default false
     */
    this.depthTestAgainstTerrain = false;

    /**
     * Gets or sets a value indicating whether this terrain can be configured through the UI to only be
     * shown on the left or right side of the splitter control. This is useful for swiping away the surface
     * to view underground features.
     * @type {Boolean}
     * @default false
     */
    Object.defineProperty(this, 'supportsSplitting', {
        // we use Object.defineProperty here because the base class prototype defines only a getter.
        get : function() {
            return this._supportsSplitting;
        },
        set : function(value) {
            this._supportsSplitting = value;
        },
        enumerable: true
    });

    /**
     * Gets or sets the side on which to show the terrain. In a JSON init file, the valid values are
     * 'left', 'right', and 'both'.
     * @type {ImagerySplitDirection}
     * @default ImagerySplitDirection.NONE
     */
    this.splitDirection = ImagerySplitDirection.NONE;

    knockout.track(this, ['_supportsSplitting', 'splitDirection']);

    knockout.getObservable(this, 'splitDirection').subscribe(function() {
        if (this.terria.cesium && this._terrainProvider) {
            var scene = this.terria.cesium.scene;
            scene.globe.splitDirection = this.splitDirection;
            if (scene.skyAtmosphere) {
                scene.skyAtmosphere.splitDirection = this.splitDirection;
            }
            this.terria.cesium.notifyRepaintRequired();
        }
    }, this);
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
     * When a property name on the model matches the name of a property in the serializers object literal,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf TerrainCatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return TerrainCatalogItem.defaultSerializers;
        }
    }
});

TerrainCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

TerrainCatalogItem.defaultUpdaters.supportsSplitting = function(catalogItem, json, propertyName) {
    if (defined(json.supportsSplitting)) {
        catalogItem.supportsSplitting = json.supportsSplitting;
    }
};

TerrainCatalogItem.defaultUpdaters.splitDirection = function(catalogItem, json, propertyName) {
    if (!defined(json.supportsSplitting)) {
        return;
    }

    switch (json.supportsSplitting) {
        case 'left':
            catalogItem.splitDirection = ImagerySplitDirection.LEFT;
            break;
        case 'both':
            catalogItem.splitDirection = ImagerySplitDirection.NONE;
            break;
        case 'right':
            catalogItem.splitDirection = ImagerySplitDirection.RIGHT;
            break;
        default:
            catalogItem.splitDirection = json.splitDirection;
            break;
    }
};

freezeObject(TerrainCatalogItem.defaultUpdaters);

TerrainCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);
freezeObject(TerrainCatalogItem.defaultSerializers);

TerrainCatalogItem.prototype._createTerrainProvider = function() {
    throw new DeveloperError('_createTerrainProvider must be implemented in the derived class.');
};

TerrainCatalogItem.prototype._showInCesium = function() {
    this._disableOtherTerrainItems();

    var terrainProvider = this._terrainProvider = this._createTerrainProvider();
    var scene = this.terria.cesium.scene;
    this._originalTerrainProvider = scene.terrainProvider;
    scene.globe.splitDirection = this.splitDirection;
    scene.globe.depthTestAgainstTerrain = this.depthTestAgainstTerrain;

    if (scene.skyAtmosphere) {
        scene.skyAtmosphere.splitDirection = this.splitDirection;
    }

    scene.terrainProvider = terrainProvider;
};

TerrainCatalogItem.prototype._hideInCesium = function() {
    if (!defined(this._originalTerrainProvider)) {
        return;
    }

    var scene = this.terria.cesium.scene;
    scene.terrainProvider = this._originalTerrainProvider;
    scene.globe.splitDirection = ImagerySplitDirection.NONE;
    scene.globe.depthTestAgainstTerrain = false;

    if (scene.skyAtmosphere) {
        scene.skyAtmosphere.splitDirection = ImagerySplitDirection.NONE;
    }

    this._originalTerrainProvider = undefined;
    this._terrainProvider = undefined;
};

TerrainCatalogItem.prototype._showInLeaflet = function() {
    this.isShown = false;
    throw new TerriaError({
        sender: this,
        title: 'Not supported in 2D',
        message: '"' + this.name + '" cannot be show in the 2D view.  Switch to 3D and try again.'
    });
};

TerrainCatalogItem.prototype._hideInLeaflet = function() {
    // Nothing to be done.
};

TerrainCatalogItem.prototype._enableInCesium = function() {
    // Nothing to be done.
};

TerrainCatalogItem.prototype._disableInCesium = function() {
    // Nothing to be done.
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
        if (item !== this && hasTerrainProvider(item)) {
            item.isShown = false;
        }
    }
};

function hasTerrainProvider(catalogItem) {
    if (defined(catalogItem.terrainProvider)) {
        return true;
    }

    if (catalogItem.isMappable && defined(catalogItem.items)) {
        for (var i = 0; i < catalogItem.items.length; ++i) {
            if (hasTerrainProvider(catalogItem.items[i])) {
                return true;
            }
        }
    }

    return false;
}

module.exports = TerrainCatalogItem;

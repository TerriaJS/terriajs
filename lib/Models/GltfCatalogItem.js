'use strict';

/*global require*/

var clone = require('terriajs-cesium/Source/Core/clone');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var Model = require('terriajs-cesium/Source/Scene/Model');
var sampleTerrain = require('terriajs-cesium/Source/Core/sampleTerrain');
var Transforms = require('terriajs-cesium/Source/Core/Transforms');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var lowestTerrainLevel = require('../Map/lowestTerrainLevel');

/**
 * A {@link CatalogItem} that represents a glTF model to be displayed in Cesium.
 *
 * @alias GltfCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var GltfCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    this._terrainProvider = undefined;
    this._model = undefined;

    /**
     * Gets or sets the url pointing to the glTf model.
     * @type {String}
     */
    this.url = undefined;

    /**
     * Gets or sets the position of the model.
     * @type {Cartographic}
     */
    this.location = undefined;

    /**
     * Gets or sets the flag for whether the model should be .
     * @type {Boolean}
     */
    this.clampToTerrain = true;

};

inherit(CatalogItem, GltfCatalogItem);

defineProperties(GltfCatalogItem.prototype, {

    /**
     * Gets the type of data item represented by this instance.
     * @memberOf GltfCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'gltf';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'glTF Model Item'.
     * @memberOf GltfCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'glTF Model Item';
        }
    },

    /**
     * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
     * Data sources that cannot be reordered are typically displayed above reorderable data sources.
     * @memberOf GltfCatalogItem.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf GltfCatalogItem.prototype
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
     * @memberOf CesiumGltfCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return GltfCatalogItem.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
GltfCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
GltfCatalogItem.defaultPropertiesForSharing.push('url');
freezeObject(GltfCatalogItem.defaultPropertiesForSharing);

GltfCatalogItem.prototype._showInCesium = function() {
    if (!defined(this._model)) {
        throw new DeveloperError('This data source is not enabled.');
    }
    var scene = this.terria.cesium.scene;
    this._model = scene.primitives.add(this._model);
};

GltfCatalogItem.prototype._hideInCesium = function() {
    if (!defined(this._model)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.terria.cesium.scene;
    scene.primitives.remove(this._model);

};

GltfCatalogItem.prototype._showInLeaflet = function() {
    // Nothing to be done. Perhaps switch user to 3D or notify that 3D is required?
};

GltfCatalogItem.prototype._hideInLeaflet = function() {
    // Nothing to be done.
};

GltfCatalogItem.prototype._enableInCesium = function() {
    var modelMatrix = Transforms.eastNorthUpToFixedFrame(
        Cartesian3.fromRadians(
            this.location.longitude,
            this.location.latitude,
            this.location.height
        )
    );

    this._model = Model.fromGltf({
        url : this.url,
        modelMatrix : modelMatrix,
    });

    if (defined(this.terria.cesium) && this.clampToTerrain) {
        return _updateHeightFromTerrain(
            this._model,
            this.terria.cesium.viewer.terrainProvider,
            this.location
        );
    }

};

GltfCatalogItem.prototype._disableInCesium = function() {
    this._model = undefined;
};

GltfCatalogItem.prototype._enableInLeaflet = function() {
    // Nothing to be done.
};

GltfCatalogItem.prototype._disableInLeaflet = function() {
    // Nothing to be done.
};

/**
 * Finds the height from the terrain at the position of the billboard and updates the
 * billboard's position accodingly.
 * @protected
 */
function _updateHeightFromTerrain(model, terrainProvider, position) {
    var levelPromise = lowestTerrainLevel(position, terrainProvider);

    return when(levelPromise, function(level){
        var terrainPromise = sampleTerrain(terrainProvider,level,[position]);

        return when(terrainPromise, function(newPos) {
            var cartPos = Cartesian3.fromRadians(newPos[0].longitude,newPos[0].latitude,newPos[0].height);
            if (defined(model)) {
                model.modelMatrix = Transforms.eastNorthUpToFixedFrame(cartPos);
            }
        });
    });
}

module.exports = GltfCatalogItem;

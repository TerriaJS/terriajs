'use strict';

/*global require*/

var CelestialSphere = require('../Map/CelestialSphere');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defined = require('terriajs-cesium/Source/Core/defined');
var CatalogItem = require('./CatalogItem');
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
var CelestialSphereCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    this._celestialSphere = undefined;
};

inherit(CatalogItem, CelestialSphereCatalogItem);

defineProperties(CelestialSphereCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf CesiumTerrainCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'celestial-sphere';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Tile Map Server'.
     * @memberOf CesiumTerrainCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Celestial Sphere';
        }
    }
});

CelestialSphereCatalogItem.prototype._showInCesium = function() {
    var celestialSphere = this._celestialSphere = new CelestialSphere({
        image: this.url
    });
    var scene = this.terria.cesium.scene;
    scene.skyBox.push(celestialSphere);
};

CelestialSphereCatalogItem.prototype._hideInCesium = function() {
    if (!defined(this._celestialSphere)) {
        return;
    }

    var scene = this.terria.cesium.scene;
    var index = scene.skyBox.indexOf(this._celestialSphere);
    if (index >= 0) {
        scene.skyBox.splice(index, 1);
    }
};

CelestialSphereCatalogItem.prototype._showInLeaflet = function() {
    this.isShown = false;
    throw new TerriaError({
        sender: this,
        title: 'Not supported in 2D',
        message: '"' + this.name + '" cannot be show in the 2D view.  Switch to 3D and try again.'
    });
};

CelestialSphereCatalogItem.prototype._hideInLeaflet = function() {
    // Nothing to be done.
};

CelestialSphereCatalogItem.prototype._enableInCesium = function() {
// Nothing to be done.
};

CelestialSphereCatalogItem.prototype._disableInCesium = function() {
    // Nothing to be done.
};

CelestialSphereCatalogItem.prototype._enableInLeaflet = function() {
    // Nothing to be done.
};

CelestialSphereCatalogItem.prototype._disableInLeaflet = function() {
    // Nothing to be done.
};

module.exports = CelestialSphereCatalogItem;

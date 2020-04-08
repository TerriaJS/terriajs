"use strict";

/*global require*/
var i18next = require("i18next").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var CatalogItem = require("./CatalogItem");
var inherit = require("../Core/inherit");
var TerriaError = require("../Core/TerriaError");

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
};

inherit(CatalogItem, TerrainCatalogItem);

Object.defineProperties(TerrainCatalogItem.prototype, {
  /**
   * Gets the terrain provider object associated with this data source.
   * This property is undefined if the data source is not enabled.
   * @memberOf TerrainCatalogItem.prototype
   * @type {Object}
   */
  terrainProvider: {
    get: function() {
      return this._terrainProvider;
    }
  },

  /**
   * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
   * Data sources that cannot be reordered are typically displayed above reorderable data sources.
   * @memberOf TerrainCatalogItem.prototype
   * @type {Boolean}
   */
  supportsReordering: {
    get: function() {
      return false;
    }
  },

  /**
   * Gets a value indicating whether the opacity of this data source can be changed.
   * @memberOf TerrainCatalogItem.prototype
   * @type {Boolean}
   */
  supportsOpacity: {
    get: function() {
      return false;
    }
  }
});

TerrainCatalogItem.prototype._createTerrainProvider = function() {
  throw new DeveloperError(
    "_createTerrainProvider must be implemented in the derived class."
  );
};

TerrainCatalogItem.prototype._showInCesium = function() {
  this._disableOtherTerrainItems();

  var terrainProvider = (this._terrainProvider = this._createTerrainProvider());
  var scene = this.terria.cesium.scene;
  this._originalTerrainProvider = scene.terrainProvider;
  scene.terrainProvider = terrainProvider;
};

TerrainCatalogItem.prototype._hideInCesium = function() {
  if (!defined(this._originalTerrainProvider)) {
    return;
  }

  this.terria.cesium.scene.terrainProvider = this._originalTerrainProvider;
  this._originalTerrainProvider = undefined;
  this._terrainProvider = undefined;
};

TerrainCatalogItem.prototype._showInLeaflet = function() {
  this.isShown = false;
  throw new TerriaError({
    sender: this,
    title: i18next.t("models.terrainCatalog.notSupportedErrorTitle"),
    message: i18next.t("models.terrainCatalog.notSupportedErrorMessage", {
      name: this.name
    })
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

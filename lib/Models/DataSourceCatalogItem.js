"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var CatalogItem = require("./CatalogItem");
var inherit = require("../Core/inherit");

/**
 * A {@link CatalogItem} that is added to the map as a Cesium {@link DataSource}
 *
 * @alias DataSourceCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var DataSourceCatalogItem = function(terria) {
  CatalogItem.call(this, terria);
};

inherit(CatalogItem, DataSourceCatalogItem);

Object.defineProperties(DataSourceCatalogItem.prototype, {
  /**
   * Returns true if we can zoom to this item. Depends on observable properties, and so updates once loaded.
   * @memberOf DataSourceCatalogItem.prototype
   * @type {Boolean}
   */
  canZoomTo: {
    get: function() {
      return true;
    }
  },

  /**
   * Gets the data source associated with this catalog item.
   * @memberOf DataSourceCatalogItem.prototype
   * @type {DataSource}
   */
  dataSource: {
    get: function() {
      throw new DeveloperError(
        'Types derived from DataSourceCatalogItem must implement a "dataSource" property.'
      );
    }
  }
});

DataSourceCatalogItem.prototype._enable = function() {};

DataSourceCatalogItem.prototype._disable = function() {};

DataSourceCatalogItem.prototype._show = function() {
  if (!defined(this.dataSource)) {
    throw new DeveloperError("This data source is not loaded.");
  }

  var dataSources = this.terria.dataSources;
  if (dataSources.contains(this.dataSource)) {
    return;
  }

  dataSources.add(this.dataSource);
};

DataSourceCatalogItem.prototype._hide = function() {
  if (!defined(this.dataSource)) {
    throw new DeveloperError("This data source is not loaded.");
  }

  var dataSources = this.terria.dataSources;
  if (!dataSources.contains(this.dataSource)) {
    return;
  }

  dataSources.remove(this.dataSource, false);
};

DataSourceCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
  var dataSource = this.dataSource;

  globeOrMap.addDataSource({
    dataSource: dataSource
  });

  return function() {
    globeOrMap.removeDataSource({
      dataSource: dataSource
    });
  };
};

/**
 * Moves the camera so that the item's bounding rectangle is visible.  If {@link CatalogItem#rectangle} is
 * undefined or covers more than about half the world in the longitude direction, or if the data item is not enabled
 * or not shown, this method zooms to the {@link DataSourceCatalogItem#dataSource} instead.  Because the zoom may
 * happen asynchronously (for example, if the item's rectangle is not yet known), this method returns a Promise that
 * resolves when the zoom animation starts.
 * @returns {Promise} A promise that resolves when the zoom animation starts.
 */
DataSourceCatalogItem.prototype.zoomTo = function() {
  var that = this;
  return when(this.load(), function() {
    if (defined(that.nowViewingCatalogItem)) {
      return that.nowViewingCatalogItem.zoomTo();
    }

    if (defined(that.rectangle)) {
      return CatalogItem.prototype.zoomTo.call(that);
    }

    if (!defined(that.dataSource)) {
      return;
    }

    return that.terria.currentViewer.zoomTo(that.dataSource);
  });
};

module.exports = DataSourceCatalogItem;

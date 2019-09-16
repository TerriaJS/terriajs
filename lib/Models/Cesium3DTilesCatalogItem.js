"use strict";

/*global require*/

var CatalogItem = require("./CatalogItem");
var Cesium3DTileset = require("terriajs-cesium/Source/Scene/Cesium3DTileset");
var combine = require("terriajs-cesium/Source/Core/combine");
var defined = require("terriajs-cesium/Source/Core/defined");
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties");
var inherit = require("../Core/inherit");
var IonResource = require("terriajs-cesium/Source/Core/IonResource");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var raiseErrorToUser = require("./raiseErrorToUser");
var TerriaError = require("../Core/TerriaError");
var when = require("terriajs-cesium/Source/ThirdParty/when");

/**
 * A {@link CatalogItem} that is added to the map as Cesium 3D Tiles.
 *
 * @alias Cesium3DTilesCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var Cesium3DTilesCatalogItem = function(terria) {
  CatalogItem.call(this, terria);

  /**
   * Gets or sets additional options to pass to Cesium's Cesium3DTileset constructor.
   * @type {Object}
   */
  this.options = undefined;

  /**
   * Gets or sets the ID of the Cesium Ion asset to access. If this property is set, the {@link Cesium3DTilesCatalogItem#url}
   * property is ignored.
   * @type {Number}
   */
  this.ionAssetId = undefined;

  /**
   * Gets or sets the Cesium Ion access token to use to access the tileset. If not specified, the token specified
   * using the `cesiumIonAccessToken` property in `config.json` is used. This property is ignored if
   * {@link Cesium3DTilesCatalogItem#ionAssetId} is not set.
   * @type {String}
   */
  this.ionAccessToken = undefined;

  /**
   * Gets or sets the Cesium Ion access token to use to access the tileset. If not specified, the default Ion
   * server, `https://api.cesium.com/`, is used. This property is ignored if
   * {@link Cesium3DTilesCatalogItem#ionAssetId} is not set.
   * @type {String}
   */
  this.ionServer = undefined;

  this._tileset = undefined;
};

inherit(CatalogItem, Cesium3DTilesCatalogItem);

defineProperties(Cesium3DTilesCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf CesiumTerrainCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "3d-tiles";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Cesium 3D Tiles'.
   * @memberOf CesiumTerrainCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "Cesium 3D Tiles";
    }
  },

  /**
   * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
   * Data sources that cannot be reordered are typically displayed above reorderable data sources.
   * @memberOf Cesium3DTilesCatalogItem.prototype
   * @type {Boolean}
   */
  supportsReordering: {
    get: function() {
      return false;
    }
  },

  /**
   * Gets a value indicating whether the opacity of this data source can be changed.
   * @memberOf Cesium3DTilesCatalogItem.prototype
   * @type {Boolean}
   */
  supportsOpacity: {
    get: function() {
      return false;
    }
  },

  /**
   * Returns true if we can zoom to this item. Depends on observable properties, and so updates once loaded.
   * @memberOf Cesium3DTilesCatalogItem.prototype
   * @type {Boolean}
   */
  canZoomTo: {
    get: function() {
      return true;
    }
  }
});

Cesium3DTilesCatalogItem.prototype._showInCesium = function() {
  if (defined(this._tileset)) {
    this._tileset.show = true;
  }
};

Cesium3DTilesCatalogItem.prototype._hideInCesium = function() {
  if (defined(this._tileset)) {
    this._tileset.show = false;
  }
};

Cesium3DTilesCatalogItem.prototype._showInLeaflet = function() {
  this.isShown = false;
  throw new TerriaError({
    sender: this,
    title: "Not supported in 2D",
    message:
      '"' +
      this.name +
      '" cannot be show in the 2D view.  Switch to 3D and try again.'
  });
};

Cesium3DTilesCatalogItem.prototype._hideInLeaflet = function() {
  // Nothing to be done.
};

Cesium3DTilesCatalogItem.prototype._enableInCesium = function() {
  if (!defined(this._tileset)) {
    let resource = proxyCatalogItemUrl(this, this.url);
    if (defined(this.ionAssetId)) {
      resource = IonResource.fromAssetId(this.ionAssetId, {
        accessToken:
          this.ionAccessToken ||
          this.terria.configParameters.cesiumIonAccessToken,
        server: this.ionServer
      }).otherwise(e => {
        raiseErrorToUser(this.terria, e);
      });
    }

    let options = {
      show: this.isShown,
      url: resource
    };

    if (this.options) {
      options = combine(options, this.options);
    }

    this._tileset = new Cesium3DTileset(options);
  }

  const primitives = this.terria.cesium.scene.primitives;
  if (!primitives.contains(this._tileset)) {
    primitives.add(this._tileset);
  }
};

Cesium3DTilesCatalogItem.prototype._disableInCesium = function() {
  if (defined(this._tileset)) {
    this.terria.cesium.scene.primitives.removeAndDestroy(this._tileset);
    this._tileset = undefined;
  }
};

Cesium3DTilesCatalogItem.prototype._enableInLeaflet = function() {
  // Nothing to be done.
};

Cesium3DTilesCatalogItem.prototype._disableInLeaflet = function() {
  // Nothing to be done.
};

/**
 * Moves the camera so that the item's bounding rectangle is visible.  If {@link CatalogItem#rectangle} is
 * undefined or covers more than about half the world in the longitude direction, or if the data item is not enabled
 * or not shown, this method zooms to the {@link DataSourceCatalogItem#dataSource} instead.  Because the zoom may
 * happen asynchronously (for example, if the item's rectangle is not yet known), this method returns a Promise that
 * resolves when the zoom animation starts.
 * @returns {Promise} A promise that resolves when the zoom animation starts.
 */
Cesium3DTilesCatalogItem.prototype.zoomTo = function() {
  var that = this;
  return when(this.load(), function() {
    if (defined(that.nowViewingCatalogItem)) {
      return that.nowViewingCatalogItem.zoomTo();
    }

    if (defined(that.rectangle)) {
      return CatalogItem.prototype.zoomTo.call(that);
    }

    if (!defined(that._tileset)) {
      return;
    }

    return that.terria.currentViewer.zoomTo(that._tileset);
  });
};

/**
 * Syncs maximumScreenSpaceError based on quality preference of user
 *
 * Doesn't override if original option to override maximumScreenSpaceError was
 * initially set in the catalog json
 */
Cesium3DTilesCatalogItem.prototype.syncMaximumScreenSpaceError = function() {
  if (defined(this._tileset) && !this.options.maximumScreenSpaceError) {
    if (!defined(this.terria.cesium)) {
      return;
    }
    // default is 16
    // we want to reduce to 8 for higher levels of quality
    // the slider goes from [performance] 2 to 1 [quality]
    const newMaximumScreenSpaceError =
      8 * this.terria.cesium.viewer.scene.globe.maximumScreenSpaceError;
    if (this._tileset.maximumScreenSpaceError !== newMaximumScreenSpaceError) {
      this._tileset.maximumScreenSpaceError = newMaximumScreenSpaceError;
    }
  }
};

module.exports = Cesium3DTilesCatalogItem;

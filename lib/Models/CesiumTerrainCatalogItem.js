"use strict";

/*global require*/

var CesiumTerrainProvider = require("terriajs-cesium/Source/Core/CesiumTerrainProvider")
  .default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var IonResource = require("terriajs-cesium/Source/Core/IonResource").default;
var raiseErrorToUser = require("./raiseErrorToUser");

var TerrainCatalogItem = require("./TerrainCatalogItem");
var inherit = require("../Core/inherit");
var i18next = require("i18next").default;

/**
 * A {@link TerrainCatalogItem} representing a Cesium terrain provider.
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
   * Gets or sets the ID of the Cesium Ion asset to access. If this property is set, the {@link CesiumTerrainCatalogItem#url}
   * property is ignored.
   * @type {Number}
   */
  this.ionAssetId = undefined;

  /**
   * Gets or sets the Cesium Ion access token to use to access the terrain. If not specified, the token specified
   * using the `cesiumIonAccessToken` property in `config.json` is used. This property is ignored if
   * {@link CesiumTerrainCatalogItem#ionAssetId} is not set.
   * @type {String}
   */
  this.ionAccessToken = undefined;

  /**
   * Gets or sets the Cesium Ion access token to use to access the terrain. If not specified, the default Ion
   * server, `https://api.cesium.com/`, is used. This property is ignored if
   * {@link CesiumTerrainCatalogItem#ionAssetId} is not set.
   * @type {String}
   */
  this.ionServer = undefined;
};

inherit(TerrainCatalogItem, CesiumTerrainCatalogItem);

Object.defineProperties(CesiumTerrainCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf CesiumTerrainCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "cesium-terrain";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Tile Map Server'.
   * @memberOf CesiumTerrainCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.cesiumTerrain.name");
    }
  }
});

CesiumTerrainCatalogItem.prototype._createTerrainProvider = function() {
  var resource = this.url;
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

  return new CesiumTerrainProvider({
    url: resource
  });
};

module.exports = CesiumTerrainCatalogItem;

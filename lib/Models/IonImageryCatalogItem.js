"use strict";

/*global require*/

var IonImageryProvider = require("terriajs-cesium/Source/Scene/IonImageryProvider")
  .default;

var ImageryLayerCatalogItem = require("./ImageryLayerCatalogItem");
var inherit = require("../Core/inherit");
var i18next = require("i18next").default;

/**
 * A {@link ImageryLayerCatalogItem} representing an imagery layer from Cesium Ion.
 *
 * @alias IonImageryCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var IonImageryCatalogItem = function(terria) {
  ImageryLayerCatalogItem.call(this, terria);

  /**
   * Gets or sets the ID of the Cesium Ion asset to access.
   * @type {Number}
   */
  this.ionAssetId = undefined;

  /**
   * Gets or sets the Cesium Ion access token to use to access the imagery. If not specified, the token specified
   * using the `cesiumIonAccessToken` property in `config.json` is used.
   * @type {String}
   */
  this.ionAccessToken = undefined;

  /**
   * Gets or sets the Cesium Ion access token to use to access the imagery. If not specified, the default Ion
   * server, `https://api.cesium.com/`, is used.
   * @type {String}
   */
  this.ionServer = undefined;
};

inherit(ImageryLayerCatalogItem, IonImageryCatalogItem);

Object.defineProperties(IonImageryCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf UrlTemplateCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "ion-imagery";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Cesium Ion Imagery'.
   * @memberOf UrlTemplateCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.ionImagery.name");
    }
  }
});

IonImageryCatalogItem.prototype._createImageryProvider = function() {
  return new IonImageryProvider({
    assetId: this.ionAssetId,
    accessToken: this.ionAccessToken,
    server: this.ionServer
  });
};

module.exports = IonImageryCatalogItem;

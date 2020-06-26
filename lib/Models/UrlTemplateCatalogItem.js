"use strict";

/*global require*/
var i18next = require("i18next").default;
var UrlTemplateImageryProvider = require("terriajs-cesium/Source/Scene/UrlTemplateImageryProvider")
  .default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var ImageryLayerCatalogItem = require("./ImageryLayerCatalogItem");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from a mapping server that can be reached
 * via a URL template.
 *
 * @alias UrlTemplateCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var UrlTemplateCatalogItem = function(terria) {
  ImageryLayerCatalogItem.call(this, terria);

  /**
   * Gets or sets the minimum tile level to retrieve from the map data
   * This property is observable.
   * @type {String}
   */
  this.minimumLevel = 0;

  /**
   * Gets or sets the maximum tile level to retrieve from the map data
   * This property is observable.
   * @type {String}
   */
  this.maximumLevel = 25;

  /**
   * Gets or sets the attribution to display with the data
   * This property is observable.
   * @type {String}
   */
  this.attribution = undefined;

  /**
   * Gets or sets the array of subdomains, one of which will be prepended to each tile URL.
   * This property is observable.
   * @type {Array}
   */
  this.subdomains = undefined;

  /**
   * Gets or sets the tile discard policy.
   * @type {TileDiscardPolicy}
   */
  this.tileDiscardPolicy = undefined;

  knockout.track(this, [
    "minimumLevel",
    "maximumLevel",
    "attribution",
    "subdomains",
    "tileDiscardPolicy"
  ]);
};

inherit(ImageryLayerCatalogItem, UrlTemplateCatalogItem);

Object.defineProperties(UrlTemplateCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf UrlTemplateCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "url-template";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'URL Template Map Server'.
   * @memberOf UrlTemplateCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.urlTemplateMapServer.name");
    }
  }
});

UrlTemplateCatalogItem.prototype._createImageryProvider = function() {
  return new UrlTemplateImageryProvider({
    url: proxyCatalogItemUrl(this, this.url),
    maximumLevel: this.maximumLevel,
    minimumLevel: this.minimumLevel,
    credit: this.attribution,
    subdomains: this.subdomains,
    tileDiscardPolicy: this.tileDiscardPolicy,
    rectangle: this.rectangle
  });
};

module.exports = UrlTemplateCatalogItem;

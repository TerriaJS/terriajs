"use strict";

/*global require*/

const defined = require("terriajs-cesium/Source/Core/defined").default;
const inherit = require("../Core/inherit");
const knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
const proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
const Resource = require("terriajs-cesium/Source/Core/Resource").default;
const TerriaError = require("../Core/TerriaError");
const UrlTemplateCatalogItem = require("./UrlTemplateCatalogItem");
const UrlTemplateImageryProvider = require("terriajs-cesium/Source/Scene/UrlTemplateImageryProvider")
  .default;
var i18next = require("i18next").default;

/**
 * A {@link ImageryLayerCatalogItem} representing a named map from the Carto Maps API.
 * https://carto.com/developers/maps-api/
 *
 * @alias CartoMapCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
function CartoMapCatalogItem(terria) {
  UrlTemplateCatalogItem.call(this, terria);

  /**
   * Gets or sets the configuration information to pass to the Carto Maps API.
   * If not specified, empty configuration (`{}`) will be used.
   * @type {String|Object}
   */
  this.config = undefined;

  /**
   * Gets or set the authorization token to pass to the Carto Maps API.
   * @type {String}
   */
  this.auth_token = undefined;

  /**
   * Gets or sets the template URL from which to get tiles.
   * @type {String}
   */
  this.tileUrl = undefined;

  /**
   * Gets or sets the subdomains from which to get tiles.
   */
  this.tileSubdomains = undefined;

  knockout.track(this, ["tileUrl", "tileSubdomains"]);
}

inherit(UrlTemplateCatalogItem, CartoMapCatalogItem);

Object.defineProperties(CartoMapCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf CartoMapCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "carto";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'URL Template Map Server'.
   * @memberOf CartoMapCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.cartoMap.name");
    }
  }
});

CartoMapCatalogItem.prototype._load = function() {
  if (defined(this.tileUrl)) {
    return;
  }

  const queryParameters = {};
  if (this.auth_token) {
    queryParameters.auth_token = this.auth_token;
  }

  const resource = new Resource({
    url: this.url,
    headers: {
      "Content-Type": "application/json"
    },
    queryParameters: queryParameters
  });

  return resource.post(JSON.stringify(this.config || {})).then(response => {
    const map = JSON.parse(response);

    let url;
    let subdomains;

    const metadataUrl =
      map.metadata && map.metadata.url && map.metadata.url.raster;
    if (metadataUrl) {
      url = metadataUrl.urlTemplate;
      subdomains = metadataUrl.subdomains;
    } else {
      throw new TerriaError({
        sender: this,
        title: i18next.t("models.cartoMap.noUrlTitle"),
        message: i18next.t("models.cartoMap.noUrlMessage")
      });
    }

    this.tileUrl = url;

    if (!defined(this.tileSubdomains)) {
      this.tileSubdomains = subdomains;
    }
  });
};

CartoMapCatalogItem.prototype._createImageryProvider = function() {
  return new UrlTemplateImageryProvider({
    url: proxyCatalogItemUrl(this, this.tileUrl),
    maximumLevel: this.maximumLevel,
    minimumLevel: this.minimumLevel,
    credit: this.attribution,
    subdomains: this.tileSubdomains,
    tileDiscardPolicy: this.tileDiscardPolicy,
    rectangle: this.rectangle
  });
};

module.exports = CartoMapCatalogItem;

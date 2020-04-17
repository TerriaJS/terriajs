"use strict";

/*global require*/
var URI = require("urijs");

var MapboxImageryProvider = require("terriajs-cesium/Source/Scene/MapboxImageryProvider")
  .default;

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var ImageryLayerCatalogItem = require("./ImageryLayerCatalogItem");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var i18next = require("i18next").default;

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from the Mapbox server.
 *
 * @alias MapboxMapCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var MapboxCatalogItem = function(terria) {
  ImageryLayerCatalogItem.call(this, terria);

  this.url = defaultValue(this.url, "//api.mapbox.com/v4/");

  this.mapId = undefined;

  this.accessToken = undefined;

  /**
   * Gets or sets the file extension used to retrieve Open Street Map data
   * This property is observable.
   * @type {String}
   */
  this.fileExtension = "png";

  /**
   * Gets or sets the maximum tile level to retrieve from Open Street Map data
   * This property is observable.
   * @type {String}
   */
  this.maximumLevel = 25;

  knockout.track(this, ["fileExtension", "maximumLevel"]);
};

inherit(ImageryLayerCatalogItem, MapboxCatalogItem);

Object.defineProperties(MapboxCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf MapboxCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "mapbox-map";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'OpenStreet Map'.
   * @memberOf MapboxCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.mapboxMap.name");
    }
  }
});

MapboxCatalogItem.prototype._createImageryProvider = function() {
  return new MapboxImageryProvider({
    credit: this.attribution,
    url: cleanAndProxyUrl(this, this.url),
    mapId: this.mapId,
    accessToken: this.accessToken,
    format: this.fileExtension,
    maximumLevel: this.maximumLevel
  });
};

function cleanAndProxyUrl(catalogItem, url) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}

module.exports = MapboxCatalogItem;

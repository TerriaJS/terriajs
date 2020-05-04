"use strict";

/*global require*/
var URI = require("urijs");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var UrlTemplateImageryProvider = require("terriajs-cesium/Source/Scene/UrlTemplateImageryProvider")
  .default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var ImageryLayerCatalogItem = require("./ImageryLayerCatalogItem");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var WebMercatorTilingScheme = require("terriajs-cesium/Source/Core/WebMercatorTilingScheme")
  .default;
var i18next = require("i18next").default;

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from the Open Street Map server.
 *
 * @alias OpenStreetMapCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var OpenStreetMapCatalogItem = function(terria) {
  ImageryLayerCatalogItem.call(this, terria);

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

  knockout.track(this, ["fileExtension", "maximumLevel", "attribution"]);
};

inherit(ImageryLayerCatalogItem, OpenStreetMapCatalogItem);

Object.defineProperties(OpenStreetMapCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf OpenStreetMapCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "open-street-map";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'OpenStreet Map'.
   * @memberOf OpenStreetMapCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.openStreetMap.name");
    }
  }
});

OpenStreetMapCatalogItem.prototype._createImageryProvider = function() {
  var uri = new URI(this.url);

  if (defined(this.subdomains) && this.url.indexOf("{s}") < 0) {
    uri.hostname("{s}." + uri.hostname());
  }

  // Don't use URIjs to add this part of the path, because it has an annoying habit of
  // encoding the `{` and `}` characters (i.e. they become `%7B` and `%7D`)
  var templateUrl = uri.toString();
  if (templateUrl[templateUrl.length - 1] !== "/") {
    templateUrl += "/";
  }

  templateUrl += "{z}/{x}/{y}." + this.fileExtension;

  return new UrlTemplateImageryProvider({
    url: cleanAndProxyUrl(this, templateUrl),
    credit: this.attribution,
    tilingScheme: new WebMercatorTilingScheme(),
    tileWidth: 256,
    tileHeight: 256,
    minimumLevel: 0,
    maximumLevel: this.maximumLevel,
    rectangle: this.clipToRectangle ? this.rectangle : undefined,
    subdomains: this.subdomains
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

module.exports = OpenStreetMapCatalogItem;

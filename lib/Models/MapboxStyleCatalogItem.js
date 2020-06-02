"use strict";

/*global require*/
var URI = require("urijs");

var MapboxStyleImageryProvider = require("terriajs-cesium/Source/Scene/MapboxStyleImageryProvider")
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
const MapboxStyleCatalogItem = function(terria) {
  ImageryLayerCatalogItem.call(this, terria);

  /**
   * The Mapbox server url.
   * * @type {string}
   */

  this.url = defaultValue(this.url, "https://api.mapbox.com/styles/v1/");

  /**
   * The username of the map account.
   * [optional]
   * @type {string}
   */
  this.username = "mapbox";

  /**
   * 	The Mapbox Style ID.
   * 	@type {String}
   */
  this.styleId = undefined;

  /**
   * The public access token for the imagery.
   * [optional]
   * @type {String}
   */
  this.accessToken = undefined;

  /**
   * The size of the image tiles.
   * [optional]
   * @type {Number}
   * @default 512
   */
  this.tilesize = 512;

  /**
   * Determines if tiles are rendered at a @2x scale factor.
   * [optional]
   * @type {Boolean}
   */
  this.scaleFactor = undefined;

  /**
   * 	The ellipsoid. If not specified, the WGS84 ellipsoid is used.
   * [optional]
   * @type {Ellipsoid}
   */
  this.ellipsoid = undefined;

  /**
   * The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
   * [optional]
   * @type {Number}
   * @default 0
   */
  this.minimumLevel = 0;

  /**
   * The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
   * [optional]
   * @type {Number}
   */
  this.maximumLevel = undefined;

  /**
   * The rectangle, in radians, covered by the image.
   * [optional]
   * @type {Rectangle}
   * @default Rectangle.MAX_VALUE
   */
  this.rectangle = undefined;

  /**
   * A credit for the data source, which is displayed on the canvas
   * [optional]
   * @type {credit | String}
   */
  this.credit = undefined;

  knockout.track(this, [
    "styleId",
    "accessToken",
    "tilesize",
    "scaleFactor",
    "ellipsoid",
    "minimumLevel",
    "maximumLevel",
    "rectangle",
    "credit"
  ]);
};

inherit(ImageryLayerCatalogItem, MapboxStyleCatalogItem);

Object.defineProperties(MapboxStyleCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf MapboxStyleCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "mapbox-style";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'OpenStreet Map'.
   * @memberOf MapboxStyleCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.mapboxStyle.name");
    }
  }
});

MapboxStyleCatalogItem.prototype._createImageryProvider = function() {
  return new MapboxStyleImageryProvider({
    url: cleanAndProxyUrl(this, this.url),
    username: this.username,
    styleId: this.styleId,
    accessToken: this.accessToken,
    tilesize: this.tilesize,
    scaleFactor: this.scaleFactor,
    ellipsoid: this.ellipsoid,
    minimumLevel: this.minimumLevel,
    maximumLevel: this.maximumLevel,
    rectangle: this.rectangle,
    credit: this.credit
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

module.exports = MapboxStyleCatalogItem;

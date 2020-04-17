"use strict";

/*global require*/
var URI = require("urijs");
var i18next = require("i18next").default;

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadXML = require("../Core/loadXML");

var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");
var TerriaError = require("../Core/TerriaError");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var WebMapTileServiceCatalogItem = require("./WebMapTileServiceCatalogItem");

/**
 * A {@link CatalogGroup} representing a collection of layers from a Web Map Tile Service (WMTS) server.
 *
 * @alias WebMapTileServiceCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var WebMapTileServiceCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "wmts-getCapabilities");

  /**
   * Gets or sets the URL of the WMTS server.  This property is observable.
   * @type {String}
   */
  this.url = "";

  /**
   * Gets or sets a description of the custodian of the data sources in this group.
   * This property is an HTML string that must be sanitized before display to the user.
   * This property is observable.
   * @type {String}
   */
  this.dataCustodian = undefined;

  /**
   * Gets or sets the additional parameters to pass to the WMTS server when requesting images.
   * All parameter names must be entered in lowercase in order to be consistent with references in TerrisJS code.
   * If this property is undefiend, {@link WebMapTileServiceCatalogItem.defaultParameters} is used.
   * @type {Object}
   */
  this.parameters = undefined;

  /**
   * Gets or sets a hash of names of blacklisted data layers.  A layer that appears in this hash
   * will not be shown to the user.  In this hash, the keys should be the Title of the layers to blacklist,
   * and the values should be "true".  This property is observable.
   * @type {Object}
   */
  this.blacklist = undefined;

  /**
   * Gets or sets the field name to use as the primary title in the catalog view: each WMTS layer's
   * "title" (default), "identifier", or "abstract".
   * @type {String}
   */
  this.titleField = "title";

  /**
   * Gets or sets a hash of properties that will be set on each child item.
   * For example, { 'treat404AsError': false }
   */
  this.itemProperties = undefined;

  knockout.track(this, [
    "url",
    "dataCustodian",
    "parameters",
    "blacklist",
    "titleField",
    "itemProperties"
  ]);
};

inherit(CatalogGroup, WebMapTileServiceCatalogGroup);

Object.defineProperties(WebMapTileServiceCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf WebMapTileServiceCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "wmts-getCapabilities";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Tile Service (WMTS)'.
   * @memberOf WebMapTileServiceCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.webMapTileServiceCatalogGroup.wmtsServer");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf WebMapTileServiceCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return WebMapTileServiceCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
WebMapTileServiceCatalogGroup.defaultSerializers = clone(
  CatalogGroup.defaultSerializers
);

WebMapTileServiceCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

WebMapTileServiceCatalogGroup.defaultSerializers.isLoading = function(
  wmtsGroup,
  json,
  propertyName,
  options
) {};

Object.freeze(WebMapTileServiceCatalogGroup.defaultSerializers);

WebMapTileServiceCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.blacklist, this.titleField];
};

WebMapTileServiceCatalogGroup.prototype._load = function() {
  var url =
    cleanAndProxyUrl(this, this.url) +
    "?service=WMTS&request=GetCapabilities&version=1.0.0";

  var that = this;
  return loadXML(url)
    .then(function(xml) {
      // Is this really a GetCapabilities response?
      if (
        !xml ||
        !xml.documentElement ||
        xml.documentElement.localName !== "Capabilities"
      ) {
        throw new TerriaError({
          title: i18next.t(
            "models.webMapTileServiceCatalogGroup.invalidWMTSServerTitle"
          ),
          message: i18next.t(
            "models.webMapTileServiceCatalogGroup.invalidWMTSServerMessage",
            {
              email:
                '<a href="mailto:' +
                that.terria.supportEmail +
                '">' +
                that.terria.supportEmail +
                "</a>."
            }
          )
        });
      }

      var json = WebMapTileServiceCatalogItem.capabilitiesXmlToJson(xml);

      // WMTS does not have layer hierarchy like WMS.  Instead, it has a separate/optional Themes section that
      // groups layers by reference.  We currently don't support the Themes section.
      var layers;
      if (!defined(json.Contents) || !defined(json.Contents.Layer)) {
        layers = [];
      } else if (Array.isArray(json.Contents.Layer)) {
        layers = json.Contents.Layer;
      } else {
        layers = [json.Contents.Layer];
      }

      for (var i = 0; i < layers.length; ++i) {
        createWmtsDataSource(that, json, layers[i]);
      }
    })
    .otherwise(function(e) {
      throw new TerriaError({
        sender: that,
        title: i18next.t(
          "models.webMapTileServiceCatalogGroup.groupNotAvailableTitle"
        ),
        message: i18next.t(
          "models.webMapTileServiceCatalogGroup.groupNotAvailableMessage",
          {
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>.",
            appName: that.terria.appName
          }
        )
      });
    });
};

function cleanAndProxyUrl(catalogGroup, url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");

  var cleanedUrl = uri.toString();
  return proxyCatalogItemUrl(catalogGroup, cleanedUrl, "1d");
}

function getNameFromLayer(wmtsGroup, layer) {
  if (wmtsGroup.titleField === "name") {
    return layer.Identifier;
  } else if (wmtsGroup.titleField === "abstract") {
    return layer.Abstract;
  } else {
    return layer.Title;
  }
}

function createWmtsDataSource(wmtsGroup, capabilities, layer) {
  var result = new WebMapTileServiceCatalogItem(wmtsGroup.terria);

  result.name = getNameFromLayer(wmtsGroup, layer);
  result.url = wmtsGroup.url;
  result.layer = layer.Identifier;

  result.updateFromCapabilities(capabilities, true, layer);

  if (typeof wmtsGroup.itemProperties === "object") {
    result.updateFromJson(wmtsGroup.itemProperties);
  }

  wmtsGroup.add(result);

  return result;
}

module.exports = WebMapTileServiceCatalogGroup;

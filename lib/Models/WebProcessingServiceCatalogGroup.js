"use strict";

/*global require*/
var CatalogGroup = require("./CatalogGroup");
var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var inherit = require("../Core/inherit");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadXML = require("../Core/loadXML");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var URI = require("urijs");
var WebProcessingServiceCatalogFunction = require("./WebProcessingServiceCatalogFunction");
var xml2json = require("../ThirdParty/xml2json");
var i18next = require("i18next").default;

/**
 * A catalog group that is populated by querying available processes from a Web Processing Service (WPS)
 * server.
 *
 * @alias WebProcessingServiceCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
function WebProcessingServiceCatalogGroup(terria) {
  CatalogGroup.call(this, terria);

  /**
   * Gets or sets the URL of the WPS server.  This property is observable.
   * @type {String}
   */
  this.url = "";

  /**
   * If true, WPS Execute with a key-value pair GET request, otherwise WPS Execute with an XML encoded POST request.
   * @type {Boolean}
   * @default false
   */
  this.executeWithHttpGet = false;

  /**
   * Gets or sets a hash of properties that will be set on each child item.
   * For example, { "treat404AsError": false }
   * @type {Object}
   */
  this.itemProperties = undefined;

  knockout.track(this, ["url", "itemProperties", "executeWithHttpGet"]);
}

inherit(CatalogGroup, WebProcessingServiceCatalogGroup);

Object.defineProperties(WebProcessingServiceCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf WebProcessingServiceCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "wps-getCapabilities";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Processing Service (WPS)'.
   * @memberOf WebProcessingServiceCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.webProcessingService.wpsServer");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf WebProcessingServiceCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return WebProcessingServiceCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
WebProcessingServiceCatalogGroup.defaultSerializers = clone(
  CatalogGroup.defaultSerializers
);
WebProcessingServiceCatalogGroup.defaultSerializers.items = function(
  wpsGroup,
  json,
  propertyName,
  options
) {};
WebProcessingServiceCatalogGroup.defaultSerializers.isLoading = function(
  wpsGroup,
  json,
  propertyName,
  options
) {};
Object.freeze(WebProcessingServiceCatalogGroup.defaultSerializers);

WebProcessingServiceCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.itemProperties];
};

WebProcessingServiceCatalogGroup.prototype._load = function() {
  var uri = new URI(this.url).search({
    service: "WPS",
    request: "GetCapabilities",
    version: "1.0.0"
  });

  var url = proxyCatalogItemUrl(this, uri.toString(), "0s");

  var that = this;
  return loadXML(url).then(function(xml) {
    var json = xml2json(xml);

    var processOfferings = json.ProcessOfferings;
    if (!defined(processOfferings)) {
      return;
    }

    var processes = processOfferings.Process;
    if (!defined(processes)) {
      return;
    }

    if (!Array.isArray(processes)) {
      processes = [processes];
    }

    for (var i = 0; i < processes.length; ++i) {
      var process = processes[i];

      var catalogFunction = new WebProcessingServiceCatalogFunction(
        that.terria
      );
      catalogFunction.url = that.url;
      catalogFunction.name = process.Title;
      catalogFunction.identifier = process.Identifier;
      catalogFunction.executeWithHttpGet = that.executeWithHttpGet;

      if (defined(process.Abstract)) {
        catalogFunction.description = process.Abstract;
      }

      if (typeof that.itemProperties === "object") {
        catalogFunction.updateFromJson(that.itemProperties);
      }

      that.items.push(catalogFunction);
    }
  });
};

module.exports = WebProcessingServiceCatalogGroup;

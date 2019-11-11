"use strict";

/*global require*/
var URI = require("urijs");

var clone = require("terriajs-cesium/Source/Core/clone");
var defined = require("terriajs-cesium/Source/Core/defined");
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties");
var freezeObject = require("terriajs-cesium/Source/Core/freezeObject");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout");
var loadJson = require("../Core/loadJson");
var when = require("terriajs-cesium/Source/ThirdParty/when");
var threddsCrawler = require("thredds-catalog-crawler");

var TerriaError = require("../Core/TerriaError");
var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var replaceUnderscores = require("../Core/replaceUnderscores");
var WebMapServiceCatalogGroup = require("./WebMapServiceCatalogGroup");

/**
 * A {@link CatalogGroup} representing a collection of layers from a THREDDS catalog.
 * Eg. http://dapds00.nci.org.au/thredds/catalog/fx3/gbr4/catalog.xml
 *
 * @alias ThreddsCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var ThreddsCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "thredds-catalog");

  /**
   * Gets or sets the URL of the Thredds Catalog.  This property is observable.
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
   * Gets or sets a hash of properties that will be set on each child item.
   * For example, { 'treat404AsError': false }
   */
  this.itemProperties = undefined;

  knockout.track(this, ["url", "dataCustodian", "blacklist", "itemProperties"]);
};

inherit(CatalogGroup, ThreddsCatalogGroup);

defineProperties(ThreddsCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf ThreddsCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "thredds-catalog";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'THREDDS Catalog'.
   * @memberOf ThreddsCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "THREDDS Catalog";
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object lieral,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf ThreddsCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return ThreddsCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
ThreddsCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

ThreddsCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

ThreddsCatalogGroup.defaultSerializers.isLoading = function(
  threddsCatalog,
  json,
  propertyName,
  options
) {};

freezeObject(ThreddsCatalogGroup.defaultSerializers);

ThreddsCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url];
};

ThreddsCatalogGroup.prototype._load = function() {
  return loadThreddsServer(this);
};

function loadThreddsServer(catalogGroup) {
  return threddsCrawler(catalogGroup.url, {
    proxy: catalogGroup.terria.corsProxy.baseProxyUrl
  })
    .then(function(catalog) {
      catalog.loadAllNestedCatalogs();
      const datasets = catalog.getAllChildDatasets();
      for (var i = 0; i < datasets.length; i++) {
        if (datasets[i].wmsUrl !== null) {
          const wms = new WebMapServiceCatalogGroup(catalogGroup.terria);
          wms.name = datasets[i].name;
          wms.url = datasets[i].wmsUrl;
          wms.itemProperties = catalogGroup.itemProperties;
          catalogGroup.items.push(wms);
        }
      }
    })
    .catch(function(err) {
      throw new TerriaError({
        title: "Invalid THREDDS server",
        message:
          '\
An error occurred while crawling this THREDDS server. \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:' +
          catalogGroup.terria.supportEmail +
          '">' +
          catalogGroup.terria.supportEmail +
          "</a>.</p>"
      });
    });
}

module.exports = ThreddsCatalogGroup;

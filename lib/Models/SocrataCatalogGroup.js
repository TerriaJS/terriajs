"use strict";

/*global require*/

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var formatError = require("terriajs-cesium/Source/Core/formatError").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadJson = require("../Core/loadJson");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var inherit = require("../Core/inherit");

var WebMapServiceCatalogItem = require("./WebMapServiceCatalogItem");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var CatalogGroup = require("./CatalogGroup");
var TerriaError = require("../Core/TerriaError");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of layers from a [Socrata](http://Socrata.org) server. Only spatial layers with a defined Map
 * visualisation are shown, using WMS.
 *
 * @alias SocrataCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var SocrataCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "socrata");

  /**
   * Gets or sets the URL of the Socrata server.  This property is observable.
   * @type {String}
   */
  this.url = "";
  /**
   * Gets or sets the filter query to pass to Socrata when querying the available data sources and their groups.  Each string in the
   * array is passed to Socrata as an independent search string and the results are concatenated to create the complete list.
   * @type {String[]}
   */
  this.filterQuery = ["limitTo=MAPS"];

  /**
   * Gets or sets a description of the custodian of the data sources in this group.
   * This property is an HTML string that must be sanitized before display to the user.
   * This property is observable.
   * @type {String}
   */
  this.dataCustodian = undefined;

  /**
   * Gets or sets a value indicating how datasets should be grouped.  Valid values are:
   * * `none` - Datasets are put in a flat list; they are not grouped at all.
   * * `category` - Datasets are grouped according to their category in Socrata.
   * @type {String}
   */
  this.groupBy = "category";

  knockout.track(this, ["url", "filterQuery", "dataCustodian", "category"]);
};

inherit(CatalogGroup, SocrataCatalogGroup);

Object.defineProperties(SocrataCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf SocrataCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "socrata";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf SocrataCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.socrataServer.name");
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf SocrataCatalogGroup.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return SocrataCatalogGroup.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf SocrataCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return SocrataCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
SocrataCatalogGroup.defaultUpdaters = clone(CatalogGroup.defaultUpdaters);

Object.freeze(SocrataCatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
SocrataCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

SocrataCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

SocrataCatalogGroup.defaultSerializers.isLoading = function(
  socrataGroup,
  json,
  propertyName,
  options
) {};

SocrataCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.filterQuery, this.groupBy, this.dataCustodian];
};

SocrataCatalogGroup.prototype._load = function() {
  if (!defined(this.url) || this.url.length === 0) {
    return undefined;
  }

  var that = this;

  var promises = [];
  for (var i = 0; i < this.filterQuery.length; i++) {
    // Socrata always has CORS enabled, but we may proxy anyway in IE9 or if we want to cache.
    var url = proxyCatalogItemUrl(
      that,
      this.url + "/api/search/views?" + this.filterQuery[i],
      "1d"
    );

    var promise = loadJson(url);

    promises.push(promise);
  }

  return when
    .all(promises)
    .then(function(queryResults) {
      if (!defined(queryResults)) {
        return;
      }
      var allResults = queryResults[0];
      for (var p = 1; p < queryResults.length; p++) {
        allResults.result.results = allResults.result.results.concat(
          queryResults[p].result.results
        );
      }

      populateGroupFromResults(that, allResults);
    })
    .otherwise(function(e) {
      throw new TerriaError({
        sender: that,
        title: that.name,
        message: i18next.t("models.socrataServer.retrieveErrorMessage", {
          email:
            '<a href="mailto:' +
            that.terria.supportEmail +
            '">' +
            that.terria.supportEmail +
            "</a>.",
          formatError: formatError(e)
        })
      });
    });
};

function populateGroupFromResults(socrataGroup, json) {
  var items = json.results;
  for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
    var item = items[itemIndex].view;

    var geo = item.metadata.geo;
    // Currently we only support spatial layers, which are identified by a geo {} object. TODO support other kinds of layers?
    if (!geo || !defined(item.childViews)) {
      // items without a 'childViews' seem to be themselves child views
      continue;
    }
    var id = item.category
      ? socrataGroup.uniqueId + "/" + item.category + "/" + item.id
      : socrataGroup.uniqueId + "/" + item.id;

    var newItem = socrataGroup.terria.catalog.shareKeyIndex[id];

    var alreadyExists = defined(newItem);
    if (!alreadyExists) {
      // Socrata is currently transitioning from a Geoserver/OWS tiling system to a "new backend" with GeoJSON download but no
      // reliable public tiling endpoint.
      if (item.newBackend) {
        newItem = new GeoJsonCatalogItem(socrataGroup.terria);
        // We have to choose a number of features to truncate to. We can go as high as 50,000 but in the case of Melbourne's
        // urban forest canopies dataset, the file becomes 71MB.
        newItem.url =
          socrataGroup.url +
          "/resource/" +
          item.childViews[0] +
          ".geojson" +
          "?$limit=10000";
      } else {
        newItem = new WebMapServiceCatalogItem(socrataGroup.terria);
        newItem.url = socrataGroup.url + geo.owsUrl;
        newItem.layers = geo.layers;
        if (geo.namespace) {
          // Socrata gives us a list of layers like 'geo_foo,geo_bar', but we need to prepend them with the WMS namespace.
          newItem.layers =
            geo.namespace +
            ":" +
            newItem.layers.replace(/,/g, "," + geo.namespace + ":");
        }
        if (geo.bboxCrs === "EPSG:4326" && defined(geo.bbox)) {
          var parts = geo.bbox.split(",");
          if (parts.length === 4) {
            newItem.rectangle = Rectangle.fromDegrees(
              parts[0],
              parts[1],
              parts[2],
              parts[3]
            );
          }
        }
      }
    }

    newItem.name = item.name;
    newItem.id = id;

    if (defined(item.description)) {
      newItem.info.push({
        name: i18next.t("models.socrataServer.description"),
        content: item.description
      });
    }
    if (defined(item.license) && defined(item.license.name)) {
      newItem.info.push({
        name: i18next.t("models.socrataServer.licence"),
        content:
          (item.license.logoUrl
            ? "<img src=" +
              socrataGroup.url +
              "/" +
              item.license.logoUrl +
              " /> &nbsp;"
            : "") +
          (item.license.termsLink
            ? '<a href="' +
              item.license.termsLink +
              '">' +
              item.license.name +
              "</a>"
            : item.license.name)
      });
    }
    if (item.columns.length > 0) {
      newItem.info.push({
        name: i18next.t("models.socrataServer.attributes"),
        content: item.columns
          .map(function(e) {
            return e.name;
          })
          .join()
      });
    }
    if (defined(item.tags) && item.tags.length > 0) {
      newItem.info.push({
        name: i18next.t("models.socrataServer.tags"),
        content: item.tags.join()
      });
    }

    newItem.dataUrlType = "direct"; // should really be landingpage or something
    newItem.dataUrl = socrataGroup.url + "/resource/" + item.id;

    if (defined(socrataGroup.dataCustodian)) {
      newItem.dataCustodian = socrataGroup.dataCustodian;
    } else {
      newItem.dataCustodian = item.attribution; // not quite right
    }

    if (socrataGroup.groupBy === "category" && defined(item.category)) {
      var existingGroup = socrataGroup.findFirstItemByName(item.category);
      if (!defined(existingGroup)) {
        existingGroup = new CatalogGroup(socrataGroup.terria);
        existingGroup.name = item.category;
        existingGroup.id = item.category;
        socrataGroup.add(existingGroup);
      }
      existingGroup.add(newItem);
    } else {
      socrataGroup.add(newItem);
    }
  }
}

module.exports = SocrataCatalogGroup;

"use strict";

/*global require*/
var URI = require("urijs");
var i18next = require("i18next").default;

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadJson = require("../Core/loadJson");

var TerriaError = require("../Core/TerriaError");
var CatalogGroup = require("./CatalogGroup");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");

/**
 * A {@link CatalogGroup} representing a collection of individual features from a Web Feature
 * Service (WFS) server. By contrast to a WebFeatureServiceCatalogGroup, which creates one
 * WebFeatureServiceCatalogItem per feature *type* (eg, one item for rivers, one for lakes),
 * this group creates one WebFeatureServiceCatalogItem per *feature* (eg, one item for each
 * individual river).
 *
 * @alias WfsFeaturesCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var WfsFeaturesCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "wfs-getCapabilities");

  /**
   * Gets or sets the URL of the WFS server.  This property is observable.
   * @type {String}
   */
  this.url = "";

  /**
   * Gets or sets the WFS feature type names.
   * @type {String}
   */
  this.typeNames = "";

  /**
   * Gets or sets the name of the WFS attribute from which to derive the names of the catalog items in this group.
   * This property must be set.
   * This property is observable.
   * @type {String}
   */
  this.nameProperty = undefined;

  /**
   * Gets or sets whether to use WFS "feature ID" for retrieving features. On by default, disable to handle
   * ID-less features on some servers. When disabled, nameProperty is used for matching features, and will give
   * incorrect results if its values are not unique.
   * @type {Boolean}
   */
  this.useFeatureID = true;

  /**
   * Gets or sets the name of the property by which to group the catalog items in this group.  If this property
   * is undefined, all catalog items are added at the top level.  This property is observable.
   * @type {String}
   */
  this.groupByProperty = undefined;

  /**
   * Gets or sets a description of the custodian of the data sources in this group.
   * This property is an HTML string that must be sanitized before display to the user.
   * This property is observable.
   * @type {String}
   */
  this.dataCustodian = undefined;

  /**
   * Gets or sets a hash of names of blacklisted data layers.  A layer that appears in this hash
   * will not be shown to the user.  In this hash, the keys should be the Title of the layers to blacklist,
   * and the values should be "true".  This property is observable.
   * @type {Object}
   */
  this.blacklist = undefined;

  /**
   * Gets or sets a hash of properties that will be set on each child item.
   * For example, { 'treat404AsError': false }
   */
  this.itemProperties = undefined;

  knockout.track(this, [
    "url",
    "typeNames",
    "nameProperty",
    "groupByProperty",
    "dataCustodian",
    "blacklist"
  ]);
};

inherit(CatalogGroup, WfsFeaturesCatalogGroup);

Object.defineProperties(WfsFeaturesCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf WfsFeaturesCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "wfs-features-group";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Group of features in a Web Feature Service (WFS) Server'.
   * @memberOf WfsFeaturesCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.wfsFeatures.featuresGroup");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf WfsFeaturesCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return WfsFeaturesCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
WfsFeaturesCatalogGroup.defaultSerializers = clone(
  CatalogGroup.defaultSerializers
);

WfsFeaturesCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

WfsFeaturesCatalogGroup.defaultSerializers.isLoading = function(
  wfsGroup,
  json,
  propertyName,
  options
) {};

Object.freeze(WfsFeaturesCatalogGroup.defaultSerializers);

WfsFeaturesCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [
    this.url,
    this.typeNames,
    this.nameProperty,
    this.groupByProperty,
    this.blacklist
  ];
};

WfsFeaturesCatalogGroup.prototype._load = function() {
  var url = new URI(cleanAndProxyUrl(this, this.url))
    .addQuery({
      service: "WFS",
      version: "1.1.0",
      request: "GetFeature",
      typeName: this.typeNames,
      outputFormat: "JSON",
      propertyName:
        this.nameProperty +
        (defined(this.groupByProperty) ? "," + this.groupByProperty : "")
    })
    .toString();

  var that = this;
  return loadJson(url)
    .then(function(json) {
      // Is this really a GetCapabilities response?
      if (
        !json ||
        json.type !== "FeatureCollection" ||
        !defined(json.features)
      ) {
        throw new TerriaError({
          title: i18next.t("models.wfsFeatures.queryErrorTitle"),
          message: i18next.t("models.wfsFeatures.queryErrorMessage", {
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>."
          })
        });
      }

      var groups = {};

      var features = json.features;
      for (var i = 0; i < features.length; ++i) {
        var feature = features[i];

        var name = feature.properties[that.nameProperty];

        if (that.blacklist && that.blacklist[name]) {
          console.log(
            "Provider Feedback: Filtering out " +
              name +
              " (" +
              feature.id +
              ") because it is blacklisted."
          );
          continue;
        }

        var item = new GeoJsonCatalogItem(that.terria);
        item.name = name;
        var uri = new URI(cleanAndProxyUrl(that, that.url)).addQuery({
          service: "WFS",
          version: "1.1.0",
          request: "GetFeature",
          typeName: that.typeNames,
          outputFormat: "JSON"
        });
        if (that.useFeatureID) {
          uri.addQuery({ featureID: feature.id });
        } else {
          uri.addQuery({
            cql_filter:
              that.nameProperty +
              "='" +
              feature.properties[that.nameProperty] +
              "'"
          });
        }
        item.url = uri.toString();

        if (typeof that.itemProperties === "object") {
          item.updateFromJson(that.itemProperties);
        }

        var group = that;
        if (
          defined(that.groupByProperty) &&
          defined(feature.properties[that.groupByProperty])
        ) {
          group = groups[feature.properties[that.groupByProperty]];
          if (!defined(group)) {
            group = groups[
              feature.properties[that.groupByProperty]
            ] = new CatalogGroup(that.terria);
            group.name = feature.properties[that.groupByProperty];
            that.add(group);
          }
        }
        group.add(item);
      }
    })
    .otherwise(function(e) {
      throw new TerriaError({
        title: i18next.t("models.wfsFeatures.groupNotAvailableTitle"),
        message: i18next.t("models.wfsFeatures.groupNotAvailableMessage", {
          appName: that.terria.appName,
          email:
            '<a href="mailto:' +
            that.terria.supportEmail +
            '">' +
            that.terria.supportEmail +
            "</a>."
        })
      });
    });
};

function cleanUrl(url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}

function cleanAndProxyUrl(catalogGroup, url) {
  var cleanedUrl = cleanUrl(url);
  return proxyCatalogItemUrl(catalogGroup, cleanedUrl, "1d");
}

module.exports = WfsFeaturesCatalogGroup;

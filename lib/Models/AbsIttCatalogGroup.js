"use strict";

/*global require*/
var URI = require("urijs");

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadJson = require("../Core/loadJson");
var objectToQuery = require("terriajs-cesium/Source/Core/objectToQuery")
  .default;

var AbsIttCatalogItem = require("./AbsIttCatalogItem");
var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");
var TerriaError = require("../Core/TerriaError");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of items from an Australian Bureau of Statistics
 * (ABS) ITT server, formed by querying for all the codes in a given dataset and concept.
 *
 * @alias AbsIttCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var AbsIttCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "abs-itt-by-concept");

  /**
   * Gets or sets the URL of the ABS ITT API, typically http://stat.abs.gov.au/itt/query.jsp.
   * This property is observable.
   * @type {String}
   */
  this.url = undefined;

  /**
   * Gets or sets the filter for the ABS dataset.  You can obtain a list of all datasets by querying
   * http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetList (or equivalent).  This property
   * is observable.
   * @type {String[]}
   */
  this.filter = undefined;

  /**
   * Gets or sets the styling for the abs data.  This property is observable.
   * @type {object}
   * @default undefined
   */
  // this.tableStyle = undefined;

  /**
   * Gets or sets the URL of a JSON file containing human-readable names of Australian Bureau of Statistics concept codes.
   * @type {String}
   */
  this.conceptNamesUrl = undefined;

  /**
   * Gets or sets the start of a URL of a csv file containing the total number of people in each region, eg.
   * SA4,Tot_P_M,Tot_P_F,Tot_P_P
   * 101,100000,23450,123450
   * 102,130000,100000,234560
   * The region code and '.csv' are appended to the end of this URL for the request, eg.
   * 'data/2011Census_TOT_' -> 'data/2011Census_TOT_SA4.csv' (and other region types).
   * @type {String}
   */
  this.regionPopulationsUrlPrefix = undefined;

  /**
   * Gets or sets a description of the custodian of the data sources in this group.
   * This property is an HTML string that must be sanitized before display to the user.
   * This property is observable.
   * @type {String}
   */
  this.dataCustodian = undefined;

  /**
   * Gets or sets a hash of names of blacklisted datasets.  A dataset that appears in this hash
   * will not be shown to the user.  In this hash, the keys should be the name of the dataset to blacklist,
   * and the values should be "true".  This property is observable.
   * @type {Object}
   */
  this.blacklist = undefined;

  /**
   * Gets or sets a hash of names of whitelisted datasets.  A dataset that doesn't appears in this hash
   * will not be shown to the user.  In this hash, the keys should be the name of the dataset to blacklist,
   * and the values should be "true".  This property is observable.
   * @type {Object}
   */
  this.whitelist = undefined;

  /**
   * Gets or sets a hash of properties that will be set on each child item.
   * For example, { 'treat404AsError': false }
   */
  this.itemProperties = undefined;

  knockout.track(this, [
    "url",
    "filter",
    "dataCustodian",
    "blacklist",
    "whitelist",
    "itemProperties"
  ]);
};

inherit(CatalogGroup, AbsIttCatalogGroup);

Object.defineProperties(AbsIttCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf AbsIttCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "abs-itt-dataset-list";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf AbsIttCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.abs.nameGroup");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf AbsIttCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return AbsIttCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
AbsIttCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

AbsIttCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

Object.freeze(AbsIttCatalogGroup.defaultSerializers);

AbsIttCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.blacklist, this.whitelist];
};

AbsIttCatalogGroup.prototype._load = function() {
  var baseUrl = cleanAndProxyUrl(this, this.url);
  var parameters = {
    method: "GetDatasetList",
    format: "json"
  };

  var that = this;

  var url = baseUrl + "?" + objectToQuery(parameters);

  return loadJson(url)
    .then(function(json) {
      var datasets = json.datasets;

      var p;

      var blacklistWildcardTerms = [];
      for (p in that.blacklist) {
        if (that.blacklist.hasOwnProperty(p)) {
          if (p[0] === "?") {
            blacklistWildcardTerms.push(p.substring(1));
          }
        }
      }

      var whitelistWildcardTerms = [];
      for (p in that.whitelist) {
        if (that.whitelist.hasOwnProperty(p)) {
          if (p[0] === "?") {
            whitelistWildcardTerms.push(p.substring(1));
          }
        }
      }

      for (var i = 0; i < datasets.length - 1; ++i) {
        var dataset = datasets[i];

        var w;

        //apply blacklist
        var blacklist =
          defined(that.blacklist) &&
          defined(that.blacklist[dataset.description]);
        for (w = 0; w < blacklistWildcardTerms.length && !blacklist; w++) {
          if (dataset.id.indexOf(blacklistWildcardTerms[w]) !== -1) {
            blacklist = true;
          }
        }
        //now apply whitelist
        for (w = 0; w < whitelistWildcardTerms.length && !blacklist; w++) {
          if (dataset.id.indexOf(whitelistWildcardTerms[w]) === -1) {
            blacklist = true;
          }
        }
        if (
          defined(that.whitelist) &&
          defined(that.whitelist[dataset.description])
        ) {
          blacklist = true;
        }
        if (blacklist) {
          console.log(
            "Provider Feedback: Filtering out " +
              dataset.description +
              " (" +
              dataset.id +
              ") because it is blacklisted."
          );
          continue;
        }

        that.add(createItemForDataset(that, dataset));
      }
    })
    .otherwise(function(e) {
      console.log(e.message);
      throw new TerriaError({
        sender: that,
        title: i18next.t("models.abs.groupNotAvailableTitle"),
        message: i18next.t("models.abs.groupNotAvailableMessage", {
          email:
            '<a href="mailto:' +
            that.terria.supportEmail +
            '">' +
            that.terria.supportEmail +
            "</a>"
        })
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

function createItemForDataset(absGroup, dataset) {
  var result = new AbsIttCatalogItem(absGroup.terria);

  result.name = dataset.description;
  result.description = dataset.description;
  result.dataCustodian = absGroup.dataCustodian;
  result.url = absGroup.url;
  result.datasetId = dataset.id;
  result.filter = absGroup.filter;
  result.conceptNamesUrl = absGroup.conceptNamesUrl;
  result.regionPopulationsUrlPrefix = absGroup.regionPopulationsUrlPrefix;
  // result.tableStyle = absGroup.tableStyle;  // TODO: do we need to be able to define TableStyle on the group?

  if (typeof absGroup.itemProperties === "object") {
    result.updateFromJson(absGroup.itemProperties);
  }

  return result;
}

module.exports = AbsIttCatalogGroup;

"use strict";

/*global require*/
var CatalogFunction = require("./CatalogFunction");
var CsvCatalogItem = require("./CsvCatalogItem");
var defined = require("terriajs-cesium/Source/Core/defined").default;

var extendLoad = require("./extendLoad");
var inherit = require("../Core/inherit");
var invokeTerriaAnalyticsService = require("./invokeTerriaAnalyticsService");
var TerriaError = require("../Core/TerriaError");
var RegionDataParameter = require("./RegionDataParameter");
var RegionParameter = require("./RegionParameter");
var RegionTypeParameter = require("./RegionTypeParameter");
var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var updateRectangleFromRegion = require("./updateRectangleFromRegion");
var i18next = require("i18next").default;
/**
 * A Terria Spatial Inference function to identify regions that are _most like_ a given region according to a
 * given set of characteristics.
 *
 * @alias PlacesLikeMeCatalogfunction
 * @constructor
 * @extends CatalogFunction
 *
 * @param {Terria} terria The Terria instance.
 */
var PlacesLikeMeCatalogfunction = function(terria) {
  CatalogFunction.call(this, terria);

  this.url = undefined;
  this.name = i18next.t("models.placesLikeMe.regionsLikeThisName");
  this.description = i18next.t(
    "models.placesLikeMe.regionsLikeThisDescription"
  );

  this._regionTypeParameter = new RegionTypeParameter({
    terria: this.terria,
    catalogFunction: this,
    id: "regionType",
    name: i18next.t("models.placesLikeMe.regionTypeName"),
    description: i18next.t("models.placesLikeMe.regionTypeDescription")
  });

  this._regionParameter = new RegionParameter({
    terria: this.terria,
    catalogFunction: this,
    id: "region",
    name: i18next.t("models.placesLikeMe.regionName"),
    description: i18next.t("models.placesLikeMe.regionDescription"),
    regionProvider: this._regionTypeParameter
  });

  this._dataParameter = new RegionDataParameter({
    terria: this.terria,
    catalogFunction: this,
    id: "data",
    name: i18next.t("models.placesLikeMe.characteristics"),
    description: i18next.t("models.placesLikeMe.characteristicsDescription"),
    regionProvider: this._regionTypeParameter
  });

  this._parameters = [
    this._regionTypeParameter,
    this._regionParameter,
    this._dataParameter
  ];
};

inherit(CatalogFunction, PlacesLikeMeCatalogfunction);

Object.defineProperties(PlacesLikeMeCatalogfunction.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf PlacesLikeMeCatalogfunction.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "places-like-me-function";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Spatial Detailing'.
   * @memberOf PlacesLikeMeCatalogfunction.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.placesLikeMe.name");
    }
  },

  /**
   * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
   * @memberOf PlacesLikeMeCatalogfunction
   * @type {CatalogProcessParameters[]}
   */
  parameters: {
    get: function() {
      return this._parameters;
    }
  }
});

PlacesLikeMeCatalogfunction.prototype._load = function() {};

/**
 * Invokes the function.
 * @return {ResultPendingCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
PlacesLikeMeCatalogfunction.prototype.invoke = function() {
  var region = this._regionParameter.value;
  var data = this._dataParameter.getRegionDataValue();

  if (!defined(region)) {
    throw new TerriaError({
      title: i18next.t("models.placesLikeMe.regioNotSelectedName"),
      message: i18next.t("models.placesLikeMe.regioNotSelectedDescription")
    });
  }

  var regionProvider = this._regionTypeParameter.value;

  var request = {
    algorithm: "placeslikeme",
    boundaries_name: regionProvider.regionType,
    region_codes: data.regionCodes,
    columns: data.columnHeadings,
    table: data.table,
    parameters: {
      query: region.id
    }
  };

  var regionIndex = regionProvider.regions.indexOf(region);

  var regionName = region.id;
  if (regionIndex >= 0) {
    regionName = regionProvider.regionNames[regionIndex] || regionName;
  }

  var name = i18next.t("models.placesLikeMe.placesLike", {
    regionName: regionName
  });

  var that = this;
  return invokeTerriaAnalyticsService(
    this.terria,
    name,
    this.url,
    request
  ).then(function(invocationResult) {
    var result = invocationResult.result;

    var csv = regionProvider.aliases[0] + ",Likeness\n";

    var likeness = result.likeness;
    if (data.regionCodes.length !== likeness.length) {
      throw new RuntimeError(i18next.t("models.placesLikeMe.likenessesError"));
    }

    for (var i = 0; i < data.regionCodes.length; ++i) {
      csv += data.regionCodes[i] + "," + Math.pow(likeness[i], 3) + "\n"; // Note: to bring out contrast, we are taking the cube of the likeness. Remove.
    }

    var catalogItem = new CsvCatalogItem(that.terria);
    catalogItem.name = name;
    catalogItem.data = csv;
    catalogItem.dataUrl = invocationResult.url;
    catalogItem.tableStyle.colorBins = 40;
    catalogItem.tableStyle.colorMap = [
      { color: "rgba(255,255,255,1.00)", offset: 0 },
      { color: "rgba(191, 191, 255, 1.0)", offset: 0.5 },
      { color: "rgba(0, 0, 255, 1.0)", offset: 1 }
    ];
    // {"color": "rgba(255,255,255,1.00)", "offset": 0},
    // {"color": "rgba(0,0,255,1.0)", "offset": 1}
    var description =
      'This is the result of invoking "' +
      that.name +
      '" at ' +
      invocationResult.startDate +
      " with these parameters:\n\n";
    description +=
      " * " +
      regionProvider.regionType +
      " Region: " +
      regionName +
      " (" +
      region.id +
      ")\n";
    description +=
      " * Characteristics: " + data.columnHeadings.join(", ") + "\n";

    catalogItem.description = description;

    extendLoad(catalogItem, function() {
      return updateRectangleFromRegion(catalogItem, regionProvider, region);
    });

    catalogItem.isEnabled = true;
  });
};

module.exports = PlacesLikeMeCatalogfunction;

"use strict";

/*global require*/
var BooleanParameter = require("./BooleanParameter");
var CatalogFunction = require("./CatalogFunction");
var CsvCatalogItem = require("./CsvCatalogItem");

var inherit = require("../Core/inherit");
var invokeTerriaAnalyticsService = require("./invokeTerriaAnalyticsService");
var RegionDataParameter = require("./RegionDataParameter");
var RegionTypeParameter = require("./RegionTypeParameter");
var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var i18next = require("i18next").default;

/**
 * A Terria Spatial Inference function to predicts the characteristics of fine-grained regions by learning and
 * exploiting correlations of coarse-grained data with Census characteristics.
 *
 * @alias SpatialDetailingCatalogFunction
 * @constructor
 * @extends CatalogFunction
 *
 * @param {Terria} terria The Terria instance.
 */
var SpatialDetailingCatalogFunction = function(terria) {
  CatalogFunction.call(this, terria);

  this.url = undefined;
  this.name = i18next.t("models.spatialDetailing.name");
  this.description = i18next.t("models.spatialDetailing.description");

  this._regionTypeToPredictParameter = new RegionTypeParameter({
    terria: this.terria,
    catalogFunction: this,
    id: "regionTypeToPredict",
    name: i18next.t("models.spatialDetailing.regionTypeToPredictName"),
    description: i18next.t(
      "models.spatialDetailing.regionTypeToPredictDescription"
    )
  });

  this._coarseDataRegionTypeParameter = new RegionTypeParameter({
    terria: this.terria,
    catalogFunction: this,
    id: "coarseDataRegionType",
    name: i18next.t("models.spatialDetailing.coarseDataRegionTypeName"),
    description: i18next.t(
      "models.spatialDetailing.coarseDataRegionTypeDescription"
    )
  });

  this._isMeanAggregationParameter = new BooleanParameter({
    terria: this.terria,
    catalogFunction: this,
    id: "isMeanAggregation",
    name: i18next.t("models.spatialDetailing.aggregationName"),
    description: i18next.t("models.spatialDetailing.aggregationDescription"),
    trueName: i18next.t("models.spatialDetailing.aggregationTrueName"),
    trueDescription: i18next.t(
      "models.spatialDetailing.aggregationTrueDescription"
    ),
    falseName: i18next.t("models.spatialDetailing.aggregationFalseName"),
    falseDescription: i18next.t(
      "models.spatialDetailing.aggregationFalseDescription"
    ),
    defaultValue: true
  });

  this._dataParameter = new RegionDataParameter({
    terria: this.terria,
    catalogFunction: this,
    id: "data",
    name: i18next.t("models.spatialDetailing.characteristicToPredictName"),
    description: i18next.t(
      "models.spatialDetailing.characteristicToPredictDescription"
    ),
    regionProvider: this._coarseDataRegionTypeParameter,
    singleSelect: true
  });

  this._parameters = [
    this._coarseDataRegionTypeParameter,
    this._regionTypeToPredictParameter,
    this._isMeanAggregationParameter,
    this._dataParameter
  ];
};

inherit(CatalogFunction, SpatialDetailingCatalogFunction);

Object.defineProperties(SpatialDetailingCatalogFunction.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf SpatialDetailingCatalogFunction.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "spatial-detailing-function";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Spatial Detailing'.
   * @memberOf SpatialDetailingCatalogFunction.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.spatialDetailing.name");
    }
  },

  /**
   * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
   * @memberOf SpatialDetailingCatalogFunction
   * @type {CatalogProcessParameters[]}
   */
  parameters: {
    get: function() {
      return this._parameters;
    }
  }
});

SpatialDetailingCatalogFunction.prototype._load = function() {};

/**
 * Invokes the process.
 * @return {AsyncProcessResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
SpatialDetailingCatalogFunction.prototype.invoke = function() {
  var value = this._dataParameter.getRegionDataValue();

  var request = {
    algorithm: "spatialdetailing",
    boundaries_name: this._coarseDataRegionTypeParameter.value.regionType.replace(
      /_2011$/,
      ""
    ),
    region_codes: value.regionCodes,
    columns: value.columnHeadings[0],
    table: value.singleSelectValues,
    parameters: {
      disagg_boundaries_name: this._regionTypeToPredictParameter.value.regionType.replace(
        /_2011$/,
        ""
      ),
      mean_agg: this._isMeanAggregationParameter.value
    }
  };

  var predictedCharacteristic;
  var data = this._dataParameter.value;
  for (var characteristicName in data) {
    if (data.hasOwnProperty(characteristicName) && data[characteristicName]) {
      predictedCharacteristic = characteristicName;
      break;
    }
  }

  var name = i18next.t("models.spatialDetailing.spatialDetailingOf", {
    of: value.columnHeadings[0],
    at: this._regionTypeToPredictParameter.value.regionType
  });

  var that = this;
  return invokeTerriaAnalyticsService(
    this.terria,
    name,
    this.url,
    request
  ).then(function(invocationResult) {
    var result = invocationResult.result;
    var csv =
      that._regionTypeToPredictParameter.value.aliases[0] +
      ",Predicted " +
      predictedCharacteristic +
      " (Quality: " +
      result.Quality +
      "),Lower bound of 95% confidence interval,Upper bound of 95% confidence interval\n";

    var predictedValues = result.disagg_mean;
    var predictedRegions = result.disagg_regions;
    var confidenceUpper = result.disagg_95conf_upper;
    var confidenceLower = result.disagg_95conf_lower;

    if (predictedValues.length !== predictedRegions.length) {
      throw new RuntimeError(
        i18next.t("models.spatialDetailing.wrongNumberOfElements")
      );
    }

    for (var i = 0; i < predictedRegions.length; ++i) {
      csv +=
        predictedRegions[i] +
        "," +
        predictedValues[i] +
        "," +
        confidenceLower[i] +
        "," +
        confidenceUpper[i] +
        "\n";
    }

    var catalogItem = new CsvCatalogItem(that.terria);
    catalogItem.name = name;
    catalogItem.data = csv;
    catalogItem.dataUrl = invocationResult.url;

    var description =
      'This is the result of invoking "' +
      that.name +
      '" at ' +
      invocationResult.startDate +
      " with these parameters:\n\n";
    description +=
      " * Region type to predict: " +
      that._regionTypeToPredictParameter.value.regionType +
      "\n";
    description +=
      " * Coarse data region type: " +
      that._coarseDataRegionTypeParameter.value.regionType +
      "\n";

    if (that._isMeanAggregationParameter.value) {
      description += " * Treat values as a mean aggregation.\n";
    } else {
      description += " * Treat values as a sum aggregation.\n";
    }

    description +=
      " * Predicted characteristic: " + value.columnHeadings[0] + "\n";

    catalogItem.description = description;

    return catalogItem.loadAndEnable();
  });
};

module.exports = SpatialDetailingCatalogFunction;

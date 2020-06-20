"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var RegionDataValue = require("./RegionDataValue");
var RegionTypeParameter = require("./RegionTypeParameter");

/**
 * A parameter that specifies a set of characteristics for regions of a particular type.
 *
 * @alias RegionDataParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {RegionProvider|RegionTypeParameter} options.regionProvider The {@link RegionProvider} from which a region may be selected.  This may also
 *                                                                    be a {@link RegionTypeParameter} that specifies the type of region.
 * @param {Boolean} [options.singleSelect] True if only one characteristic may be selected; false if any number of characteristics may be selected.
 */
var RegionDataParameter = function(options) {
  if (!defined(options) || !defined(options.regionProvider)) {
    throw new DeveloperError("options.regionProvider is required.");
  }

  FunctionParameter.call(this, options);

  this._regionProvider = options.regionProvider;
  this.singleSelect = defaultValue(options.singleSelect, false);

  knockout.track(this, ["_regionProvider"]);
};

inherit(FunctionParameter, RegionDataParameter);

Object.defineProperties(RegionDataParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof RegionDataParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "regionData";
    }
  },

  /**
   * Gets or sets the value of this parameter.  The value is an object where the keys are column names and
   * the values are arrays containing the data values in that column.
   * @memberof RegionDataParameter.prototype
   * @member {Object} value
   */

  /**
   * Gets the region provider indicating the type of region that this property holds data for.
   * @memberof RegionDataParameter.prototype
   * @type {RegionProvider}
   */
  regionProvider: {
    get: function() {
      return RegionTypeParameter.resolveRegionProvider(this._regionProvider);
    }
  }
});

RegionDataParameter.prototype.getEnabledItemsWithMatchingRegionType = function() {
  var result = [];

  var nowViewingItems = this.terria.nowViewing.items;
  var regionProvider = this.regionProvider;

  for (var i = 0; i < nowViewingItems.length; ++i) {
    var item = nowViewingItems[i];
    if (
      defined(item.regionMapping) &&
      defined(item.regionMapping.regionDetails) &&
      item.regionMapping.regionDetails.length > 0 &&
      item.regionMapping.regionDetails[0].regionProvider === regionProvider
    ) {
      result.push(item);
    }
  }

  return result;
};

/**
 * Gets the selected region codes, column headings, and data table for this parameter.
 *
 * @return {RegionDataValue} The value.
 */
RegionDataParameter.prototype.getRegionDataValue = function() {
  var regionProvider = this.regionProvider;

  var regionCodes = [];
  var regionCodeHash = {};
  var columns = [];

  var columnData;
  var regionRow;
  var regions;

  var value = this.value;

  for (var columnName in value) {
    if (value.hasOwnProperty(columnName)) {
      columnData = value[columnName];
      if (!columnData || columnData.regionProvider !== regionProvider) {
        continue;
      }

      columns.push(columnName);

      regions = columnData.regionColumn.values;

      for (var i = 0; i < regions.length; ++i) {
        regionRow = regionCodeHash[regions[i]];
        if (!defined(regionRow)) {
          regionRow = regionCodeHash[regions[i]] = regionCodes.length;
          regionCodes.push(regions[i]);
        }
      }
    }
  }

  var table;
  var singleSelectValues;
  var columnIndex;
  var rowIndex;
  var regionColumn;
  var valueColumn;
  var values;

  if (this.singleSelect) {
    singleSelectValues = [];
    for (columnIndex = 0; columnIndex < columns.length; ++columnIndex) {
      columnData = value[columns[columnIndex]];
      if (!columnData || columnData.regionProvider !== regionProvider) {
        continue;
      }

      regionColumn = columnData.regionColumn;
      regions = regionColumn.values;
      valueColumn = columnData.valueColumn;
      values = valueColumn.values;

      for (rowIndex = 0; rowIndex < regionCodes.length; ++rowIndex) {
        regionRow = regionCodeHash[regions[rowIndex]];
        singleSelectValues[regionRow] = values[rowIndex] || 0.0; // TODO: don't replace nulls with 0.0
      }
    }
  } else {
    table = [];
    for (columnIndex = 0; columnIndex < columns.length; ++columnIndex) {
      columnData = value[columns[columnIndex]];
      if (!columnData) {
        continue;
      }

      regionColumn = columnData.regionColumn;
      regions = regionColumn.values;
      valueColumn = columnData.valueColumn;
      values = valueColumn.values;

      for (rowIndex = 0; rowIndex < regionCodes.length; ++rowIndex) {
        regionRow = regionCodeHash[regions[rowIndex]];
        var row = table[regionRow];
        if (!defined(row)) {
          row = table[regionRow] = [];
        }
        row[columnIndex] = values[rowIndex] || 0.0; // TODO: don't replace nulls with 0.0
      }
    }
  }

  return new RegionDataValue(regionCodes, columns, table, singleSelectValues);
};

module.exports = RegionDataParameter;

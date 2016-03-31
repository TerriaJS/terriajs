'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');
var RegionDataValue = require('./RegionDataValue');
var RegionProvider = require('../Map/RegionProvider');
var RegionTypeParameter = require('./RegionTypeParameter');

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
        throw new DeveloperError('options.regionProvider is required.');
    }

    FunctionParameter.call(this, options);

    this.regionProvider = options.regionProvider;
    this.singleSelect = defaultValue(options.singleSelect, false);
};

inherit(FunctionParameter, RegionDataParameter);

defineProperties(RegionDataParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof RegionDataParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'regionData';
        }
    }
});

/**
 * Gets the current {@link RegionProvider} definining the possible regions that may be selected with this parameter.
 * @param {Object} [parameterValues] The current values of the parameters to the {@link CatalogFunction}.  This parameter is ignored if
 *                                   {@link RegionParameter#regionProvider} is a {@link RegionProvider}, but it is required when
 *                                   {@link RegionParameter#regionProvider} is a {@link RegionTypeParameter}.
 * @return {RegionProvider} The region provider.
 */
RegionDataParameter.prototype.getRegionProvider = function(parameterValues) {
    if (this.regionProvider instanceof RegionProvider) {
        return this.regionProvider;
    } else if (this.regionProvider instanceof RegionTypeParameter) {
        return parameterValues[this.regionProvider.id];
    } else {
        return undefined;
    }
};

RegionDataParameter.prototype.getEnabledItemsWithMatchingRegionType = function(parameterValues) {
    var result = [];

    var nowViewingItems = this.terria.nowViewing.items;
    var regionProvider = this.getRegionProvider(parameterValues);

    for (var i = 0; i < nowViewingItems.length; ++i) {
        var item = nowViewingItems[i];
        if (defined(item.regionMapping) &&
            defined(item.regionMapping.regionDetails) &&
            item.regionMapping.regionDetails.length > 0 &&
            item.regionMapping.regionDetails[0].regionProvider === regionProvider) {
            result.push(item);
        }
    }

    return result;
};

/**
 * Gets the selected region codes, column headings, and data table for this parameter.
 *
 * @param {Object} parameterValues The value of the parameters to the function.  The value is extracted from a parameter named {@link RegionDataParameter#id}.
 * @return {RegionDataValue} The value.
 */
RegionDataParameter.prototype.getValue = function(parameterValues) {
    var regionProvider = this.getRegionProvider(parameterValues);

    var regionCodes = [];
    var regionCodeHash = {};
    var columns = [];

    var columnData;
    var regionRow;
    var regions;

    var value = parameterValues[this.id];

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

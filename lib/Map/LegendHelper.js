'use strict';

/*global require*/
var Color = require('terriajs-cesium/Source/Core/Color');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');

var ColorMap = require('../Map/ColorMap');
var formatNumberToLocale = require('../Core/formatNumberToLocale');
var Legend = require('../Map/Legend');
var TableStyle = require('../Models/TableStyle');
var VarType = require('../Map/VarType');

var simplestats = require('simple-statistics');

var defaultScalarColorMap = [
    {offset: 0.0, color: 'rgba(239,210,193,1.0)'},
    {offset: 0.25, color: 'rgba(221,139,116,1.0)'},
    {offset: 0.5, color: 'rgba(255,127,46,1.0)'},
    {offset: 0.75, color: 'rgba(255,65,43,1.0)'},
    {offset: 1.0, color: 'rgba(111,0,54,1.0)'}
];

var defaultEnumColorCodes = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999']; // From ColorBrewer2.org
var defaultColorArray = [32, 32, 32, 255];  // Used if no selected variable.

/**
 * Legends for table columns depend on both the table style and the selected column.
 * This class brings the two together to generate a legend.
 * Its key output is legendUrl.
 * 
 * @alias LegendHelper
 * @constructor
 *
 * @param {TableColumn} tableColumn The column whose values inform the legend.
 * @param {TableStyle} [tableStyle] The styling for the table.
 * @param {RegionProvider} [regionProvider] The region provider, if region mapped. Used if no table column set.
 */
var LegendHelper = function(tableColumn, tableStyle, regionProvider) {
    this.tableColumn = tableColumn;
    this.tableStyle = defined(tableStyle) ? tableStyle : new TableStyle();  // instead of defaultValue, so new object only created if needed.
    this._legend = undefined;  // we could make a getter for this if it is ever needed.
    this._colorGradient = undefined;
    this._binColors = undefined;
    this._regionProvider = regionProvider;
    this._nullColorArray = defined(this.tableStyle.nullColor) ? getColorArrayFromCssColorString(this.tableStyle.nullColor) : defaultColorArray;

    this.tableStyle.colorBins = defaultValue(this.tableStyle.colorBins, 7);
    this.tableStyle.legendTicks = defaultValue(this.tableStyle.legendTicks, 0);
    this.tableStyle.scale = defaultValue(this.tableStyle.scale, 1);
};

/**
 * Generates intermediate variables (such as _colorGradient, _binColors) and saves the legend.
 * This could be exposed in an API if needed.
 */
function generateLegend(legendHelper) {
    var colorMap;
    var colorBins;
    var tableColumn = legendHelper.tableColumn;
    if (!defined(legendHelper.tableStyle.colorMap)) {
        // There is no colorMap defined, so set a good default.
        if (!defined(tableColumn) || (tableColumn.type === VarType.ENUM)) {
            // If no table column is active, color it as if it were an ENUM with the maximum available colors.
            // Recall tableStyle.colorBins is the number of bins.
            if (defined(tableColumn)) {
                colorBins = Math.min(tableColumn.values.length, defaultEnumColorCodes.length);
            } else {
                colorBins = defaultEnumColorCodes.length;
            }
            var colorMapArray = defaultEnumColorCodes.slice(0, colorBins);
            colorMap = new ColorMap(colorMapArray);
        } else {
            colorMap = defaultScalarColorMap;
        }
    } else {
        colorMap = legendHelper.tableStyle.colorMap;
    }

    legendHelper._colorGradient = buildColorGradient(colorMap);
    legendHelper._binColors = buildBinColors(legendHelper, colorBins);
    var legendProps = buildLegendProps(legendHelper, colorMap);

    if (defined(legendProps)) {
        legendHelper._legend = new Legend(legendProps);
    } else {
        legendHelper._legend = null; // use null so that we know it tried and failed, so don't try again.
    }
}

/**
 * Returns the legendUrl for this legend.  Can be called directly after instantiation.
 * @return {LegendUrl} The Legend URL object for the legend, with its url being a base64-encoded PNG.
 */
LegendHelper.prototype.legendUrl = function() {
    if (!defined(this._legend)) {
        generateLegend(this);
    }
    if (definedNotNull(this._legend)) {
        return this._legend.getLegendUrl();
    }
};

/**
 * Convert a value to a fractional value, eg. in a column that ranges from 0 to 100, 20 -> 0.2.
 * TableStyle can override the minimum and maximum of the range.
 * @param  {Number} value The value.
 * @return {Number} The fractional value.
 */
function getFractionalValue(legendHelper, value) {
    var minValue = legendHelper.tableStyle.minDisplayValue || legendHelper.tableColumn.minimumValue;
    var maxValue = legendHelper.tableStyle.maxDisplayValue || legendHelper.tableColumn.maximumValue;
    var f = (maxValue === minValue) ? 0 : (value - minValue) / (maxValue - minValue);
    if (legendHelper.tableStyle.clampDisplayValue) {
        f = Math.max(0.0, Math.min(1.0, f));
    }
    return f;
}

/**
 * Maps an absolute value to a scale, based on tableStyle.
 * @param  {Number} [value] The absolute value.
 * @return {Number} The scale.
 */
LegendHelper.prototype.getScaleFromValue = function(value) {
    var scale = this.tableStyle.scale;
    if (this.tableStyle.scaleByValue && defined(value)) {
        var fractionalValue = getFractionalValue(this, value);
        if (defined(fractionalValue) && fractionalValue === fractionalValue) { // testing for NaN
            scale = scale * (fractionalValue + 0.5);
        }
    }
    return scale;
};

/**
 * Maps an absolute value to a color array, based on the legend.
 * @param  {Number} [value] The absolute value.
 * @return {Number[]} The color, as an array [r, g, b, a].
 *         If the value is null, use the nullColor.
 *         If no value is provided, or no color bins are defined, use the nullColor.
 */
LegendHelper.prototype.getColorArrayFromValue = function(value) {
    if (value === null) {
        return this._nullColorArray;
    }
    if (!defined(value) || !defined(this._binColors) || (this._binColors.length === 0)) {
        return this._nullColorArray;
    }
    var i = 0;
    while (i < this._binColors.length - 1 && value > this._binColors[i].upperBound) {
        i++;
    }
    if (!defined(this._binColors[i])) { // is this actually possible given the checks above?
        console.log('Bad bin ' + i);
        return [0, 0, 0, 0];
    }
    return this._binColors[i].colorArray;
};

/**
 * Maps an absolute value to a Color, based on the legend.
 * @param  {Number} [value] The absolute value.
 * @return {Color} The color. If no value is provided, uses a default color.
 */
LegendHelper.prototype.getColorFromValue = function(value) {
    return colorArrayToColor(this.getColorArrayFromValue(value));
};

/**
 * A helper function to convert an array to a color.
 * @param  {Array} [colorArray] An array of RGBA values from 0 to 255. Even alpha is 0-255. Defaults to [32, 0, 200, 255].
 * @return {Color} The Color object.
 */
function colorArrayToColor(colorArray) {
    return new Color(colorArray[0]/255, colorArray[1]/255, colorArray[2]/255, colorArray[3]/255);
}

function getColorArrayFromCssColorString(cssString) {
    var canvas = document.createElement("canvas");
    if (!defined(canvas)) {
        return defaultColorArray; // Failed
    }
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = cssString;
    ctx.fillRect(0, 0, 2, 2);
    return ctx.getImageData(0, 0, 1, 1).data;
}

function buildColorGradient(colorMap) {
    if (!defined(colorMap)) {
        return;
    }
    var canvas = document.createElement("canvas");
    if (!defined(canvas)) {
        return;
    }
    var w = canvas.width = 64;
    var h = canvas.height = 256;
    var ctx = canvas.getContext('2d');

    // Create Linear Gradient
    var linGrad = ctx.createLinearGradient(0, 0, 0, h - 1);
    for (var i = 0; i < colorMap.length; i++) {
        linGrad.addColorStop(colorMap[i].offset, colorMap[i].color);
    }
    ctx.fillStyle = linGrad;
    ctx.fillRect(0, 0, w, h);

    var colorGradient = ctx.getImageData(0, 0, 1, 256);
    return colorGradient;
}

function getColorArrayFromColorGradient(colorGradient, fractionalPosition) {
    var colorIndex = Math.floor(fractionalPosition * (colorGradient.data.length / 4 - 1)) * 4;
    return [
        colorGradient.data[colorIndex],
        colorGradient.data[colorIndex + 1],
        colorGradient.data[colorIndex + 2],
        colorGradient.data[colorIndex + 3]
    ];
}

/**
 * Builds and returns an array describing the legend colors.
 * Each element is an object with keys "color" and "upperBound", eg.
 * [ { color: [r, g, b, a], upperBound: 20 } , { color: [r, g, b, a]: upperBound: 80 } ]
 * 
 * @param  {LegendHelper} legendHelper The legend helper.
 * @param {Integer} [colorBins] The number of color bins to use; defaults to legendHelper.tableStyle.colorBins.
 * @return {Array} Array of objects with keys "color" and "upperBound".
 */
function buildBinColors(legendHelper, colorBins) {
    var tableColumn = legendHelper.tableColumn;
    var tableStyle = legendHelper.tableStyle;
    var colorGradient = legendHelper._colorGradient;
    var regionProvider = legendHelper._regionProvider;
    if (!defined(colorBins)) {
        colorBins = tableStyle.colorBins;
    }

    if (colorBins <= 0 || tableStyle.colorBinMethod.match(/none/i)) {
        return undefined;
    }
    var binColors = [];
    var i;
    var numericalValues;
    if (!defined(tableColumn) || !defined(tableColumn.values)) {
        // There is no tableColumn.
        // Number by the index into regions instead, if it's region mapped; otherwise return undefined.
        if (regionProvider) {
            numericalValues = regionProvider.regions.map(function(region, index) { return index; });
        } else {
            return undefined;
        }
    } else {
        numericalValues = tableColumn.indicesOrNumericalValues;
    }
    // Must ask for fewer clusters than the number of items.
    var binCount = Math.min(colorBins, numericalValues.length);

    // Convert the output formats of two binning methods into our format.
    if (tableStyle.colorBinMethod === 'quantile' ||
        tableStyle.colorBinMethod === 'auto' && numericalValues.length > 1000 && (defined(tableColumn) && !tableColumn.usesIndicesIntoUniqueValues)) {
        // the quantile method is simpler, less accurate, but faster for large datasets. One issue is we don't check to see if any
        // values actually lie within a given quantile, so it's bad for small datasets.
        for (i = 0; i < binCount; i++) {
            binColors.push({
                upperBound: simplestats.quantile(numericalValues, (i + 1) / binCount),
                colorArray: getColorArrayFromColorGradient(colorGradient, i / (binCount - 1))
            });
        }
    } else {
        var clusters = simplestats.ckmeans(numericalValues, binCount);
        // Convert the ckmeans format [ [5, 20], [65, 80] ] into our format.
        for (i = 0; i < clusters.length; i++) {
            if (i > 0 && clusters[i].length === 1 && clusters[i][0] === clusters[i - 1][clusters[i - 1].length - 1]) {
                // When there are few unique values, we can end up with clusters like [1], [2],[2],[2],[3]. Let's avoid that.
                continue;
            }
            binColors.push({
                upperBound: clusters[i][clusters[i].length - 1],
            });
        }
        if (binColors.length > 1) {
            for (i = 0; i < binColors.length; i++) {
                binColors[i].colorArray = getColorArrayFromColorGradient(colorGradient, i / (binColors.length - 1));
            }
        } else {
            // only one binColor, pick the middle of the color gradient.
            binColors[0].colorArray = getColorArrayFromColorGradient(colorGradient, 0.5);
        }
    }
    return binColors;
}


function convertToStringWithAtMostTwoDecimalPlaces(f) {
    return formatNumberToLocale(Math.round(f * 100) / 100, 5);  // Use commas once there are over 5 digits before the decimal point.
}

function convertColorArrayToCssString(colorArray) {
    return 'rgb(' + colorArray[0] + ',' + colorArray[1] + ',' + colorArray[2] + ')';
}

function buildLegendProps(legendHelper, colorMap) {
    var tableColumn = legendHelper.tableColumn;
    var tableStyle = legendHelper.tableStyle;
    var binColors = legendHelper._binColors;

    // No legend if fixed color for all points, or if no active tableColumn
    if (!defined(tableColumn) || (colorMap.length === 1)) {
        return undefined;
    }

    var minimumValue = tableColumn.minimumValue;
    var maximumValue = tableColumn.maximumValue;
    if (minimumValue !== maximumValue) {
        if (defined(tableStyle.maxDisplayValue)) {
            maximumValue = tableStyle.maxDisplayValue;
        }
        if (defined(tableStyle.minDisplayValue)) {
            minimumValue = tableStyle.minDisplayValue;
        }
    }

    function gradientLabelPoints(ticks) {
        var items = [];
        var segments = 2 + ticks;
        for (var i = 1; i <= segments; i++) {
            items.push({
                titleAbove: convertToStringWithAtMostTwoDecimalPlaces(minimumValue + (maximumValue - minimumValue) * (i / segments)),
                titleBelow: (i === 1) ? convertToStringWithAtMostTwoDecimalPlaces(minimumValue) : undefined
            });
        }
        return items;
    }

    var result;
    var nullLabel = defaultValue(tableStyle.nullLabel, '');
    if (!binColors) {
        // Display a smooth gradient with number of ticks requested.
        return {
            title: tableColumn.name,
            barHeightMin: 130,
            gradientColorMap: colorMap,
            labelTickColor: 'darkgray',
            items: gradientLabelPoints(tableStyle.legendTicks)
        };
    } else if (tableColumn.usesIndicesIntoUniqueValues) {
        // Non-numeric ENUM legend labels are centered on each box, and slightly separated.
        // Reverse the color bins so that the first one appears at the top, not the bottom.
        var reversedBinColors = binColors.slice(0, tableColumn.uniqueValues.length);
        reversedBinColors.reverse();
        var items = reversedBinColors.map(function(bin, index) {
            var label = tableColumn.uniqueValues[reversedBinColors.length - 1 - index];
            return {
                // Get the right label, noting the bin colors are reversed.
                title: definedNotNull(label) ? label : nullLabel,
                color: convertColorArrayToCssString(bin.colorArray)
            };
        });
        result = {
            title: tableColumn.name,
            itemSpacing: 2,
            items: items
        };
    } else {
        // Numeric legends are displayed as thresholds between touching colors,
        // and have an additional value at the bottom.
        result = {
            title: tableColumn.name,
            itemSpacing: 0,
            items: binColors.map(function(b, i) {
                return {
                    // these long checks are to avoid showing max and min values when they're identical to the second highest and second lowest numbers
                    titleAbove: (i === 0 || i < binColors.length - 1 || b.upperBound > binColors[i - 1].upperBound) ? convertToStringWithAtMostTwoDecimalPlaces(b.upperBound) : undefined,
                    titleBelow: (i === 0 && b.upperBound !== minimumValue) ? convertToStringWithAtMostTwoDecimalPlaces(minimumValue) : undefined,
                    color: 'rgb(' + b.colorArray[0] + ',' + b.colorArray[1] + ',' + b.colorArray[2] + ')'
                };
            })
        };
    }
    // Add a null color at the bottom (ie front of the array) if there are any null values
    if (tableColumn.values.filter(function(value) {return (value === null)}).length > 0) {
        result.items.unshift({
            title: nullLabel,
            color: convertColorArrayToCssString(legendHelper._nullColorArray),
            spacingAbove: (tableColumn.usesIndicesIntoUniqueValues ? 0 : 8)
        });
    }
    return result;
}

module.exports = LegendHelper;
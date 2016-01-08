'use strict';

/*global require*/
var Color = require('terriajs-cesium/Source/Core/Color');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');

var ColorMap = require('../Map/ColorMap');
var Legend = require('../Map/Legend');
var TableStyle = require('../Map/TableStyle');
var VarType = require('../Map/VarType');

var simplestats = require('simple-statistics');

var defaultLatLonColorMap = [
    {offset: 0.0, color: 'rgba(32,0,200,1.0)'},
    {offset: 0.25, color: 'rgba(0,200,200,1.0)'},
    {offset: 0.5, color: 'rgba(0,200,0,1.0)'},
    {offset: 0.75, color: 'rgba(200,200,0,1.0)'},
    {offset: 1.0, color: 'rgba(200,0,0,1.0)'}
];

var defaultRegionColorMap = [
    {offset: 0.0, color: 'rgba(239,210,193,1.00)'},
    {offset: 0.25, color: 'rgba(221,139,116,1.0)'},
    {offset: 0.5, color: 'rgba(255,127,46,1.0)'},
    {offset: 0.75, color: 'rgba(255,65,43,1.0)'},
    {offset: 1.0, color: 'rgba(111,0,54,1.0)'}
];

var defaultEnumColorCodes = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999']; // from ColorBrewer2.org
var defaultColorArray = [32, 0, 200, 255];  // used if no selected variable.

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
 */
var LegendHelper = function(tableColumn, tableStyle, isRegionMapped) {
    this.tableColumn = tableColumn;
    this.tableStyle = defined(tableStyle) ? tableStyle : new TableStyle();  // instead of defaultValue, so new object only created if needed.
    this._legend = undefined;  // we could make a getter for this if it is ever needed.
    this._colorGradient = undefined;
    this._binColors = undefined;
    this._isRegionmapped = isRegionMapped;

    this.tableStyle.colorBins = defaultValue(this.tableStyle.colorBins, 7);
    this.tableStyle.legendTicks = defaultValue(this.tableStyle.legendTicks, 0);
    this.tableStyle.scale = defaultValue(this.tableStyle.scale, 1);
};

/**
 * Generates intermediate variables (such as _colorGradient, _binColors) and saves the legend.
 * This could be exposed in an API if needed.
 */
function generateLegend(legendHelper) {
    if (!defined(legendHelper.tableColumn)) {
        return;
    }
    var colorMap;
    if (!defined(legendHelper.tableStyle.colorMap)) {
        if (legendHelper.tableColumn.type === VarType.ENUM) {
            // Slight complication in that the number of default colors depends on the number of enums.
            legendHelper.tableStyle.colorBins = Math.min(legendHelper.tableColumn.values.length, 9);  // Recall tableStyle.colorBins is the number of bins.
            var colorMapArray = defaultEnumColorCodes.slice(0, legendHelper.tableStyle.colorBins);
            colorMap = new ColorMap(colorMapArray);
        } else {
            if (legendHelper._isRegionmapped) {
                colorMap = defaultRegionColorMap;
            } else {
                colorMap = defaultLatLonColorMap;
            }
        }
    } else {
        colorMap = legendHelper.tableStyle.colorMap;
    }

    legendHelper._colorGradient = buildColorGradient(colorMap);
    legendHelper._binColors = buildBinColors(legendHelper.tableColumn, legendHelper.tableStyle, legendHelper._colorGradient);
    var legendProps = buildLegendProps(legendHelper.tableColumn, legendHelper.tableStyle, colorMap, legendHelper._binColors);

    if (defined(legendProps)) {
        legendHelper._legend = new Legend(legendProps);
    } else {
        legendHelper._legend = null; // use null so that we know it tried and failed, so don't try again.
    }
}

/**
 * Returns the legendUrl for this legend.  Can be called directly after instantiation.
 * @return {String} The URL for the legend as a PNG.
 */
LegendHelper.prototype.legendUrl = function() {
    if (!defined(this._legend)) {
        generateLegend(this);
    }
    if (definedNotNull(this._legend)) {
        return this._legend.asPngUrl();
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
 * @return {Number[]} The color. If no value is provided, or no color bins are defined, uses a default color.
 */
LegendHelper.prototype.getColorArrayFromValue = function(value) {
    if (!defined(value) || (this._binColors.length === 0)) {
        return defaultColorArray;
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
    var linGrad = ctx.createLinearGradient(0, 0, 0, h);
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
 * @param  {TableColumn} tableColumn   The data for this variable.
 * @param  {TableStyle} tableStyle    The style for this table.
 * @param  {ImageData} colorGradient The image data for the color gradient.
 * @return {Array} Array of objects with keys "color" and "upperBound".
 */
function buildBinColors(tableColumn, tableStyle, colorGradient) {
    if (!defined(tableColumn.values) || tableStyle.colorBins <= 0 || tableStyle.colorBinMethod.match(/none/i)) {
        return undefined;
    }
    var binColors = [];
    var i;
    var numericalValues = tableColumn.values.filter(function(x) { return typeof x === 'number'; });
    if (numericalValues.length === 0) {
        // TODO: should handle string values too
        return binColors;
    }
    var binCount = Math.min(tableStyle.colorBins, numericalValues.length); // Must ask for fewer clusters than the number of items.

    // Convert the output formats of two binning methods into our format.
    if (tableStyle.colorBinMethod === 'quantile' || tableStyle.colorBinMethod === 'auto' && numericalValues.length > 1000) {
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
    return (Math.round(f * 100) / 100).toString();
}

function buildLegendProps(tableColumn, tableStyle, colorMap, binColors) {
    // Check if fixed color for all points and if so no legend
    if (colorMap.length === 1) {
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

    if (!binColors) {
        // Display a smooth gradient with number of ticks requested.
        return {
            title: tableColumn.name,
            barHeightMin: 130,
            gradientColorMap: colorMap,
            labelTickColor: 'darkgray',
            items: gradientLabelPoints(tableStyle.legendTicks)
        };

    } else if (tableColumn.type === VarType.ENUM) {
        // Enumerated legend labels are centred on each box, and slightly separated.
        return {
            title: tableColumn.name,
            itemSpacing: 2,
            items: binColors.map(function(b, i) {
                return { 
                    title: tableColumn.enumList[i],  // TODO
                    color: 'rgb(' + b.colorArray[0] + ',' + b.colorArray[1] + ',' + b.colorArray[2] + ')'
                };
            })
        };

    } else {
        // Numeric legends are displayed as thresholds between touching colours, and have an additional value
        // at the bottom.
        return {
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

}


module.exports = LegendHelper;
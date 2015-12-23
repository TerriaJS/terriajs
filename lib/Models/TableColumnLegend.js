'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');

var inherit = require('../Core/inherit');
var Legend = require('../Map/Legend');
var VarType = require('../Map/VarType');

var simplestats = require('simple-statistics');

/**
 * A Legend for a table column.
 * Typically instantiated from TableColumnLegend.fromTableColumnAndStyle(tableColumn, tableStyle).
 *
 * @alias TableColumnLegend
 * @constructor
 * @extends Legend
 *
 * @param {Object} props The properties passed to the Legend constructor.
 */
var TableColumnLegend = function(props, tableColumn, tableStyle, colorGradient) {
    Legend.call(this, props);

    this._tableColumn = tableColumn;
    this._tableStyle = tableStyle;
    this._colorGradient = colorGradient;
};

inherit(Legend, TableColumnLegend);

// TODO: what is this doing here?
var colorMap = [
    {offset: 0.0, color: 'rgba(32,0,200,1.0)'},
    {offset: 0.25, color: 'rgba(0,200,200,1.0)'},
    {offset: 0.5, color: 'rgba(0,200,0,1.0)'},
    {offset: 0.75, color: 'rgba(200,200,0,1.0)'},
    {offset: 1.0, color: 'rgba(200,0,0,1.0)'}
];


TableColumnLegend.fromTableColumnAndStyle = function(tableColumn, tableStyle) {
    tableStyle = defaultValue(tableStyle, {});
    tableStyle.colorBins = defaultValue(tableStyle.colorBins, 7);
    tableStyle.legendTicks = defaultValue(tableStyle.legendTicks, 0);

    var colorGradient = buildColorGradient(colorMap);
    var binColors = buildBinColors(tableColumn, tableStyle, colorGradient);
    var legendProps = buildLegendProps(tableColumn, tableStyle, colorMap, binColors);

    return new TableColumnLegend(legendProps, tableColumn, tableStyle, colorGradient);
};


TableColumnLegend.prototype.getColor = function(fractionalPosition) {
    return getColorFromColorGradient(this._colorGradient, fractionalPosition);
};


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

function getColorFromColorGradient(colorGradient, fractionalPosition) {
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
 * [ { color: 'green', upperBound: 20 } , { color: 'orange': upperBound: 80 } ]
 * 
 * @param  {TableColumn} tableColumn   The data for this variable.
 * @param  {TableStyle} tableStyle    The style for this table.
 * @param  {ImageData} colorGradient The image data for the color gradient.
 * @return {Array} Eg. [ { color: 'green', upperBound: 20 } , { color: 'orange': upperBound: 80 } ]
 */
function buildBinColors(tableColumn, tableStyle, colorGradient) {
    if (!defined(tableColumn.values) || tableStyle.colorBins <= 0 || tableStyle.colorBinMethod.match(/none/i)) {
        return undefined;
    }
    var binColors = [];
    var i;
    var numericalValues = tableColumn.values.filter(function(x) { return typeof x === 'number'; });
    var binCount = Math.min(tableStyle.colorBins, numericalValues.length); // Must ask for fewer clusters than the number of items.

    // Convert the output formats of two binning methods into our format.
    if (tableStyle.colorBinMethod === 'quantile' || tableStyle.colorBinMethod === 'auto' && binCount > 10000) {
        // the quantile method is simpler, less accurate, but faster for large datasets. One issue is we don't check to see if any
        // values actually lie within a given quantile, so it's bad for small datasets.
        for (i = 0; i < binCount; i++) {
            binColors.push({
                upperBound: simplestats.quantile(numericalValues, (i + 1) / binCount),
                color: getColorFromColorGradient(i / (binCount - 1))
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
        for (i = 0; i < binColors.length; i++) {
            binColors[i].color = getColorFromColorGradient(i / (binColors.length - 1));
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
                    color: 'rgb(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ')'
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
                    color: 'rgb(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ')'
                };
            })
        };
    }

}


module.exports = TableColumnLegend;

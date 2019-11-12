"use strict";

/*global require*/
var clone = require("terriajs-cesium/Source/Core/clone").default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var standardCssColors = require("../Core/standardCssColors");
var hashFromString = require("../Core/hashFromString");
var formatNumberForLocale = require("../Core/formatNumberForLocale");
var Legend = require("../Map/Legend");
var TableStyle = require("../Models/TableStyle");

var ckmeans = require("simple-statistics/src/ckmeans").default;
var quantile = require("simple-statistics/src/quantile").default;

var defaultScalarColorMap = [
  { offset: 0.0, color: "rgba(239,210,193,1.0)" },
  { offset: 0.25, color: "rgba(221,139,116,1.0)" },
  { offset: 0.5, color: "rgba(255,127,46,1.0)" },
  { offset: 0.75, color: "rgba(255,65,43,1.0)" },
  { offset: 1.0, color: "rgba(111,0,54,1.0)" }
];

var defaultEnumColorCodes = standardCssColors.brewer9ClassSet1;
var defaultLargeEnumColorCodes = standardCssColors.highContrast;
var defaultColorArray = [32, 32, 32, 128]; // Used if no selected variable (and no regions).
var noColorArray = [0, 0, 0, 0];

var defaultNullLabel = "(No value)";
var defaultNoColumnColorCodes = standardCssColors.highContrast;
var defaultNoColumnColorAlpha = 1.0;

var defaultNumberOfColorBins = 7;

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
 * @param {String} [name] A name used in the legend if no active column is selected.
 */
var LegendHelper = function(tableColumn, tableStyle, regionProvider, name) {
  this.tableColumn = tableColumn;
  this.tableStyle = defined(tableStyle) ? tableStyle : new TableStyle(); // instead of defaultValue, so new object only created if needed.
  this.tableColumnStyle = getTableColumnStyle(tableColumn, this.tableStyle);
  this.name = name;
  var noColumnIndex =
    hashFromString(name || "") % defaultNoColumnColorCodes.length;
  this._noColumnColorArray = getColorArrayFromCssColorString(
    defaultNoColumnColorCodes[noColumnIndex],
    defaultNoColumnColorAlpha
  );
  this._legend = undefined; // We could make a getter for this if it is ever needed.
  this._colorGradient = undefined;
  this._binColors = undefined; // An array of objects with upperBound and colorArray properties.
  this._regionProvider = regionProvider;
  if (defined(this.tableColumnStyle.nullColor)) {
    this._nullColorArray = getColorArrayFromCssColorString(
      this.tableColumnStyle.nullColor
    );
  } else {
    this._nullColorArray = defined(regionProvider)
      ? noColorArray
      : defaultColorArray;
  }
  this._cycleEnumValues = false;
  this._cycleColors = undefined; // Array of colors used for the cycle method

  this.tableColumnStyle.legendTicks = defaultValue(
    this.tableColumnStyle.legendTicks,
    0
  );
  this.tableColumnStyle.scale = defaultValue(this.tableColumnStyle.scale, 1);
};

// Find the right table column style for this column.
// By default, take styling directly from the tableStyle, unless there is a suitable 'columns' entry.
function getTableColumnStyle(tableColumn, tableStyle) {
  var tableColumnStyle;
  if (defined(tableColumn) && defined(tableStyle.columns)) {
    if (defined(tableStyle.columns[tableColumn.id])) {
      tableColumnStyle = clone(tableStyle.columns[tableColumn.id]);
    } else {
      // Also support column indices as keys into tableStyle.columns
      var tableStructure = tableColumn.parent;
      var columnIndex = tableStructure.columns.indexOf(tableColumn);
      if (defined(tableStyle.columns[columnIndex])) {
        tableColumnStyle = clone(tableStyle.columns[columnIndex]);
      }
    }
  }
  if (!defined(tableColumnStyle)) {
    return tableStyle;
  }
  // Copy defaults from tableStyle too.
  for (var propertyName in tableStyle) {
    if (
      tableStyle.hasOwnProperty(propertyName) &&
      tableColumnStyle.hasOwnProperty(propertyName)
    ) {
      if (!defined(tableColumnStyle[propertyName])) {
        tableColumnStyle[propertyName] = tableStyle[propertyName];
      }
    }
  }
  return tableColumnStyle;
}

/**
 * Generates intermediate variables (such as _colorGradient, _binColors) and saves the legend.
 * This could be exposed in an API if needed.
 * @private
 */
function generateLegend(legendHelper) {
  var legendProps;
  if (
    !defined(legendHelper.tableColumn) ||
    !defined(legendHelper.tableColumn.values)
  ) {
    // If no table column is active, color it as if it were an ENUM with the maximum available colors.
    if (legendHelper.regionProvider) {
      legendHelper._binColors = buildEnumBinColors(
        legendHelper,
        legendHelper.regionProvider.regions,
        "top",
        undefined
      );
      legendProps = buildEnumLegendProps(
        legendHelper,
        legendHelper.regionProvider.regions
      );
    } else {
      legendProps = defined(legendHelper.name)
        ? {
            items: [
              {
                title: legendHelper.name,
                color: convertColorArrayToCssString(
                  legendHelper._noColumnColorArray
                )
              }
            ]
          }
        : undefined;
    }
  } else if (legendHelper.tableColumn.isEnum) {
    var tableColumnStyle = legendHelper.tableColumnStyle;
    var uniqueValues = legendHelper.tableColumn.uniqueValues;
    legendHelper._binColors = buildEnumBinColors(
      legendHelper,
      uniqueValues,
      tableColumnStyle.colorBinMethod,
      tableColumnStyle.colorBins
    );
    legendProps = buildEnumLegendProps(legendHelper, uniqueValues);
  } else {
    var colorMap = defaultValue(
      legendHelper.tableColumnStyle.colorMap,
      defaultScalarColorMap
    );
    var colorBins = defaultValue(
      legendHelper.tableColumnStyle.colorBins,
      defaultNumberOfColorBins
    );

    legendHelper._colorGradient = buildColorGradient(colorMap);
    legendHelper._binColors = buildBinColors(legendHelper, colorBins);
    legendProps = buildLegendProps(legendHelper, colorMap);
  }
  if (defined(legendProps)) {
    legendHelper._legend = new Legend(legendProps);
  } else {
    legendHelper._legend = null; // use null so that we know it tried and failed, so don't try again.
  }
}

function buildEnumBinColors(legendHelper, uniqueValues, method, colorBins) {
  colorBins = defaultValue(colorBins, uniqueValues.length);
  legendHelper._cycleEnumValues = false;
  legendHelper._otherColor = getColorArrayFromCssColorString(
    defaultLargeEnumColorCodes[defaultLargeEnumColorCodes.length - 1]
  ); // Default "other" colour
  var binLookup = {};
  var i;
  if (Array.isArray(colorBins)) {
    // colorBins is an array of {value:"val", color:"col"} objects
    // Methods are irrelevant here.
    for (i = 0; i < colorBins.length; i++) {
      var bin = colorBins[i];
      if (defined(bin.value)) {
        // Ignore bins with values that aren't in the column
        if (uniqueValues.indexOf(bin.value) >= 0) {
          binLookup[bin.value] = getColorArrayFromCssColorString(bin.color);
        }
      } else {
        legendHelper._otherColor = getColorArrayFromCssColorString(bin.color);
      }
    }
  } else {
    // colorBins is an Integer
    // Calculate the number of different colours and take that many colours from a default colour set
    var binCount = Math.min(
      colorBins,
      uniqueValues.length,
      defaultLargeEnumColorCodes.length
    );
    var colorCodes =
      binCount <= defaultEnumColorCodes.length
        ? defaultEnumColorCodes
        : defaultLargeEnumColorCodes;
    colorCodes = colorCodes.slice(0, binCount).map(function(cssString) {
      return getColorArrayFromCssColorString(cssString);
    });

    method = method.toLowerCase();
    if (method === "auto") {
      method = "top";
    }
    // Number of values that should get explicit colours. Other values will be coloured with the "other" colour
    var valuesCount = 0;
    if (method === "top") {
      // If too many values, use the first colorCodes.length-1 colours for the first values, and colorCodes[-1] for other values
      valuesCount =
        uniqueValues.length <= colorCodes.length
          ? uniqueValues.length
          : colorCodes.length - 1;
    } else if (method === "cycle") {
      // Assign colours to all values
      valuesCount = uniqueValues.length;
      if (valuesCount > colorCodes.length) {
        legendHelper._cycleEnumValues = true;
        legendHelper._cycleColors = colorCodes;
      }
    }
    // Assign colours to the first valuesCount uniqueValues entries
    for (i = 0; i < valuesCount; i++) {
      binLookup[uniqueValues[i]] = colorCodes[i % colorCodes.length];
    }
  }
  return binLookup;
}

function buildEnumLegendProps(legendHelper, uniqueValues) {
  var tableColumn = legendHelper.tableColumn;
  var tableColumnStyle = legendHelper.tableColumnStyle;
  var binColors = legendHelper._binColors;
  var nullLabel = defaultValue(tableColumnStyle.nullLabel, defaultNullLabel);
  var title = tableColumn.name;

  // ENUM legend labels are centered on each box, and slightly separated.
  // Reverse the color bins so that the first one appears at the top, not the bottom.

  var items;
  if (legendHelper._cycleEnumValues) {
    items = [
      {
        title: variousValuesTitle(tableColumn),
        multipleColors: legendHelper._cycleColors.map(function(color) {
          return convertColorArrayToCssString(color);
        })
      }
    ];
  } else {
    items = [];
    var count = 0;
    for (var value in binColors) {
      if (Object.prototype.hasOwnProperty.call(binColors, value)) {
        items.push({
          title: defaultValue(value, nullLabel),
          color: convertColorArrayToCssString(binColors[value])
        });
        count++;
      }
    }
    if (uniqueValues.length > count) {
      items.push({
        title: uniqueValues.length - count + " other values",
        color: convertColorArrayToCssString(legendHelper._otherColor)
      });
    }
  }

  items.reverse();

  var result = {
    title: title,
    itemSpacing: 2,
    items: items
  };

  // Add a null color at the bottom (ie front of the array) if there are any null values
  if (defined(tableColumn) && tableColumn.values.indexOf(null) >= 0) {
    result.items.unshift({
      title: nullLabel,
      color: convertColorArrayToCssString(legendHelper._nullColorArray),
      spacingAbove: 0
    });
  }
  return result;
}

/**
 * Returns the legendUrl for this legend.  Can be called directly after instantiation.
 * @return {LegendUrl} The Legend URL object for the legend, with its url being a base64-encoded PNG.
 */
LegendHelper.prototype.legendUrl = function() {
  if (!defined(this._legend)) {
    generateLegend(this);
  }
  if (defined(this._legend)) {
    return this._legend.getLegendUrl();
  }
};

/**
 * Convert a value to a fractional value, eg. in a column that ranges from 0 to 100, 20 -> 0.2.
 * TableStyle can override the minimum and maximum of the range.
 * @private
 * @param  {Number} value The value.
 * @return {Number} The fractional value.
 */
function getFractionalValue(legendHelper, value) {
  var extremes = getExtremes(
    legendHelper.tableColumn,
    legendHelper.tableColumnStyle
  );
  var f =
    extremes.maximum === extremes.minimum
      ? 0
      : (value - extremes.minimum) / (extremes.maximum - extremes.minimum);
  if (legendHelper.tableColumnStyle.clampDisplayValue) {
    f = Math.max(0.0, Math.min(1.0, f));
  }
  return f;
}

/**
 * Maps an absolute value to a scale, based on tableColumnStyle.
 * @param  {Number} [value] The absolute value.
 * @return {Number} The scale.
 */
LegendHelper.prototype.getScaleFromValue = function(value) {
  var scale = this.tableColumnStyle.scale;
  if (this.tableColumnStyle.scaleByValue) {
    var fractionalValue = defined(value) ? getFractionalValue(this, value) : 0; // Missing values are scaled like 0.
    if (defined(fractionalValue) && fractionalValue === fractionalValue) {
      // testing for NaN
      scale = scale * (fractionalValue + 0.5);
    } else {
      scale = 0.5; // NaNs are scaled like 0 too.
    }
  }
  return scale;
};

/**
 * Maps an absolute value to a color array, based on the legend.
 * @param  {Number} [value] The absolute value.
 * @return {Number[]} The color, as an array [r, g, b, a].
 *         If there is no table column selected, use a random colour.
 *         If the value is null, use the nullColor.
 *         If no value is provided, or no color bins are defined, use the nullColor.
 */
LegendHelper.prototype.getColorArrayFromValue = function(value) {
  if (!defined(this.tableColumn)) {
    return this._noColumnColorArray;
  }
  if (!defined(value)) {
    // Note "defined" also checks value !== null, so this catches value === undefined or null.
    return this._nullColorArray;
  }
  if (this.tableColumnStyle.colorBins === 0) {
    return getColorArrayFromColorGradient(
      this._colorGradient,
      getFractionalValue(this, value)
    );
  }
  if (this.tableColumn.isEnum) {
    return Object.prototype.hasOwnProperty.call(this._binColors, value)
      ? this._binColors[value]
      : this._otherColor;
  }
  if (!defined(this._binColors) || this._binColors.length === 0) {
    return this._nullColorArray;
  }

  var i = 0;
  while (
    i < this._binColors.length - 1 &&
    value > this._binColors[i].upperBound
  ) {
    i++;
  }
  if (!defined(this._binColors[i])) {
    // is this actually possible given the checks above?
    console.log("Bad bin " + i);
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
 * @private
 * @param  {Array} [colorArray] An array of RGBA values from 0 to 255. Even alpha is 0-255. Defaults to [32, 0, 200, 255].
 * @return {Color} The Color object.
 */
function colorArrayToColor(colorArray) {
  return new Color(
    colorArray[0] / 255,
    colorArray[1] / 255,
    colorArray[2] / 255,
    colorArray[3] / 255
  );
}

function getColorArrayFromCssColorString(cssString, alphaOverride) {
  // alphaOverride is an optional fraction from 0 - 1.
  var canvas = document.createElement("canvas");
  if (!defined(canvas)) {
    return defaultColorArray; // Failed
  }
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = cssString;
  ctx.fillRect(0, 0, 2, 2);
  var result = ctx.getImageData(0, 0, 1, 1).data;
  if (defined(alphaOverride)) {
    result[3] = Math.round(255 * alphaOverride);
  }
  return result;
}

function buildColorGradient(colorMap) {
  if (!defined(colorMap)) {
    return;
  }
  var canvas = document.createElement("canvas");
  if (!defined(canvas)) {
    return;
  }
  var w = (canvas.width = 64);
  var h = (canvas.height = 256);
  var ctx = canvas.getContext("2d");

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
  var colorIndex =
    Math.floor(fractionalPosition * (colorGradient.data.length / 4 - 1)) * 4;
  return [
    colorGradient.data[colorIndex],
    colorGradient.data[colorIndex + 1],
    colorGradient.data[colorIndex + 2],
    colorGradient.data[colorIndex + 3]
  ];
}

function getExtremes(tableColumn, tableColumnStyle) {
  if (!defined(tableColumn)) {
    return {};
  }
  var minimumValue = tableColumn.minimumValue;
  var maximumValue = tableColumn.maximumValue;
  if (minimumValue !== maximumValue && defined(tableColumnStyle)) {
    if (defined(tableColumnStyle.maxDisplayValue)) {
      maximumValue = tableColumnStyle.maxDisplayValue;
    }
    if (defined(tableColumnStyle.minDisplayValue)) {
      minimumValue = tableColumnStyle.minDisplayValue;
    }
  }
  return { minimum: minimumValue, maximum: maximumValue };
}

/**
 * Builds and returns an array describing the legend colors.
 * Each element is an object with keys "color" and "upperBound", eg.
 * [ { color: [r, g, b, a], upperBound: 20 } , { color: [r, g, b, a]: upperBound: 80 } ]
 * @private
 * @param {LegendHelper} legendHelper The legend helper.
 * @param {Integer|Number[]} colorBins The number of color bins to use, or the boundaries to use.
 * @return {Array} Array of objects with keys "color" and "upperBound".
 */
function buildBinColors(legendHelper, colorBins) {
  var tableColumn = legendHelper.tableColumn;
  var tableColumnStyle = legendHelper.tableColumnStyle;
  var colorGradient = legendHelper._colorGradient;

  // If colorBins is an array, just return it in the right format.
  var extremes = getExtremes(tableColumn, tableColumnStyle);
  if (
    Array.isArray(colorBins) &&
    defined(extremes.minimum) &&
    defined(extremes.maximum)
  ) {
    // If the max value is beyond the range, add it to the end.
    // Do this to be symmetric with min and max.
    if (colorBins[colorBins.length - 1] < extremes.maximum) {
      colorBins = colorBins.concat(extremes.maximum);
    }
    var numberOfColorBins = colorBins.length;
    var filteredBins = colorBins.filter(function(bound, i) {
      // By cutting off all bins equal to or lower than the min value,
      // the min value will be added as a titleBelow instead of titleAbove.
      // Since any bins wholy below the min are removed, do the same with max.
      return (
        bound > extremes.minimum &&
        (i === 0 || colorBins[i - 1] < extremes.maximum)
      );
    });
    // Offset to make sure that the correct color is used when the legend is truncated
    var binOffset = colorBins.indexOf(filteredBins[0]);
    return filteredBins.map(function(bound, i) {
      return {
        // Just use the provided bound, but cap it at the max value.
        upperBound: Math.min(bound, extremes.maximum),
        colorArray: getColorArrayFromColorGradient(
          colorGradient,
          (binOffset + i) / (numberOfColorBins - 1)
        )
      };
    });
  }

  if (colorBins <= 0 || tableColumnStyle.colorBinMethod.match(/none/i)) {
    return undefined;
  }
  var binColors = [];
  var i;
  var numericalValues = tableColumn.numericalValues;

  if (numericalValues.length === 0) {
    return [];
  }

  // Must ask for fewer clusters than the number of items.
  var binCount = Math.min(colorBins, numericalValues.length);

  var method = tableColumnStyle.colorBinMethod.toLowerCase();
  if (method === "auto") {
    if (numericalValues.length > 1000) {
      // The quantile method is simpler and less accurate, but faster for large datasets.
      method = "quantile";
    } else {
      method = "ckmeans";
    }
  }

  if (method === "quantile") {
    // One issue is we don't check to see if any values actually lie within a given quantile, so it's bad for small datasets.
    for (i = 0; i < binCount; i++) {
      binColors.push({
        upperBound: quantile(numericalValues, (i + 1) / binCount),
        colorArray: getColorArrayFromColorGradient(
          colorGradient,
          i / (binCount - 1)
        )
      });
    }
  } else if (method === "ckmeans") {
    var clusters = ckmeans(numericalValues, binCount);
    // Convert the ckmeans format [ [5, 20], [65, 80] ] into our format.
    for (i = 0; i < clusters.length; i++) {
      if (
        i > 0 &&
        clusters[i].length === 1 &&
        clusters[i][0] === clusters[i - 1][clusters[i - 1].length - 1]
      ) {
        // When there are few unique values, we can end up with clusters like [1], [2],[2],[2],[3]. Let's avoid that.
        continue;
      }
      binColors.push({
        upperBound: clusters[i][clusters[i].length - 1]
      });
    }
    if (binColors.length > 1) {
      for (i = 0; i < binColors.length; i++) {
        binColors[i].colorArray = getColorArrayFromColorGradient(
          colorGradient,
          i / (binColors.length - 1)
        );
      }
    } else {
      // only one binColor, pick the middle of the color gradient.
      binColors[0].colorArray = getColorArrayFromColorGradient(
        colorGradient,
        0.5
      );
    }
  }
  return binColors;
}

function convertToStringWithAtMostTwoDecimalPlaces(f, tableColumnStyle) {
  // If no format.maximumFractionDigits set, set it to two.
  var options;
  if (defined(tableColumnStyle.format)) {
    options = clone(tableColumnStyle.format);
    options.maximumFractionDigits = defaultValue(
      tableColumnStyle.format.maximumFractionDigits,
      2
    );
  } else {
    options = { maximumFractionDigits: 2 };
  }
  return formatNumberForLocale(f, options);
}

function convertColorArrayToCssString(colorArray) {
  return (
    "rgba(" +
    colorArray[0] +
    "," +
    colorArray[1] +
    "," +
    colorArray[2] +
    ", " +
    colorArray[3] / 255.0 +
    ")"
  );
}

function variousValuesTitle(tableColumn) {
  return tableColumn.uniqueValues.length + " values";
}

function buildLegendProps(legendHelper, colorMap) {
  var tableColumn = legendHelper.tableColumn;
  var tableColumnStyle = legendHelper.tableColumnStyle;
  var binColors = legendHelper._binColors;

  var extremes = getExtremes(tableColumn, tableColumnStyle);

  function gradientLabelPoints(ticks) {
    var items = [];
    var segments = 2 + ticks;
    for (var i = 1; i <= segments; i++) {
      items.push({
        titleAbove: convertToStringWithAtMostTwoDecimalPlaces(
          extremes.minimum +
            (extremes.maximum - extremes.minimum) * (i / segments),
          tableColumnStyle
        ),
        titleBelow:
          i === 1
            ? convertToStringWithAtMostTwoDecimalPlaces(
                extremes.minimum,
                tableColumnStyle
              )
            : undefined
      });
    }

    // Add a null color at the bottom (ie front of the array) if there are any null values
    if (tableColumn.values.indexOf(null) >= 0) {
      items.unshift({
        title: nullLabel,
        color: convertColorArrayToCssString(legendHelper._nullColorArray),
        spacingAbove: 8
      });
    }

    return items;
  }

  var result;
  var nullLabel = defaultValue(tableColumnStyle.nullLabel, defaultNullLabel);
  var title = defaultValue(
    legendHelper.tableColumnStyle.legendName,
    tableColumn.name
  );

  if (!binColors) {
    // Display a smooth gradient with number of ticks requested.
    return {
      title: title,
      barHeightMin: 130,
      gradientColorMap: colorMap,
      labelTickColor: "darkgray",
      items: gradientLabelPoints(tableColumnStyle.legendTicks)
    };
  } else {
    // Numeric legends are displayed as thresholds between touching colors,
    // and have an additional value at the bottom.
    result = {
      title: title,
      itemSpacing: 0,
      items: binColors.map(function(b, i) {
        return {
          // these long checks are to avoid showing max and min values when they're identical to the second highest and second lowest numbers
          titleAbove:
            i === 0 ||
            i < binColors.length - 1 ||
            b.upperBound > binColors[i - 1].upperBound
              ? convertToStringWithAtMostTwoDecimalPlaces(
                  b.upperBound,
                  tableColumnStyle
                )
              : undefined,
          titleBelow:
            i === 0 && b.upperBound !== extremes.minimum
              ? convertToStringWithAtMostTwoDecimalPlaces(
                  extremes.minimum,
                  tableColumnStyle
                )
              : undefined,
          color: convertColorArrayToCssString(b.colorArray)
        };
      })
    };
  }
  // Add a null color at the bottom (ie front of the array) if there are any null values
  if (tableColumn.values.indexOf(null) >= 0) {
    result.items.unshift({
      title: nullLabel,
      color: convertColorArrayToCssString(legendHelper._nullColorArray),
      spacingAbove: 8
    });
  }
  return result;
}

module.exports = LegendHelper;

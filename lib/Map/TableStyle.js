'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var ColorMap = require('./ColorMap');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var VarType = require('../Map/VarType');
var serializeToJson = require('../Core/serializeToJson');
var updateFromJson = require('../Core/updateFromJson');

/**
  * A set of properties that define how a table, such as a CSV file, should be displayed.
  * If not set explicitly, many of these properties will be given default or guessed values elsewhere,
  * such as in CsvCatalogItem.
  * @param {Object} [props] The values of the properties of the new instance.
  */
var TableStyle = function(props) {
    props = props || {};

    /**
     * The name of the variable (column) to be used for region mapping.
     * @type {String}
     */
    this.regionVariable = props.regionVariable;

    /**
     * The identifier of a region type, as used by RegionProviderList
     * @type {String}
     */
    this.regionType = props.regionType;

    /**
     * The name of the variable (column) containing data to be used for choroplething.
     * @type {String}
     */
    this.dataVariable = props.dataVariable;

    /**
     * All data values less than or equal to this are considered equal for the purpose of display.
     * @type {Float}
     */
    this.minDisplayValue = props.minDisplayValue;

    /**
     * All data values greater than or equal to this are considered equal for the purpose of display.
     * @type {Float}
     */
    this.maxDisplayValue = props.maxDisplayValue;

    /**
     * Display duration.
     * @type {Float}
     */
    this.displayDuration = props.displayDuration;

    /**
     * The size of each point or billboard
     * @type {Float}
     */
    this.scale = props.scale;

    /**
     * Should points and billboards representing each feature be scaled by the size of their data variable?
     * @type {Boolean}
     */
    this.scaleByValue = props.scaleByValue;

    /**
     * Display values that fall outside the display range as min and max colors.
     * @type {Boolean}
     */
    this.clampDisplayValue = props.clampDisplayValue;

    /**
     * A string representing an image to display at each point, for lat-long datasets.
     * @type {String}
     */
    this.imageUrl = props.imageUrl;

    /**
     * An object of { "myCol": "My column" } properties, defining which columns get displayed in feature info boxes
     * (when clicked on), and what label is used instead of the column's actual name.
     * @type {Object}
     */
    this.featureInfoFields = props.featureInfoFields;

    /**
     * The number of discrete colours that a colour gradient should be quantised into.
     * @type {Number}
     */
    this.colorBins = props.colorBins;

    /**
     * The method for quantising colors: "auto" (default), "ckmeans", "quantile" or "none" (equivalent to colorBins: 0).
     * @type {String}
     */
    this.colorBinMethod = props.colorBinMethod;

    /**
     * Gets or sets a string or an array of {@link ColorMap}, specifying how to map values to colors.  Setting this property sets
     * {@link TableStyle#colorPalette} to undefined.  If this property is a string, it specifies a list of CSS colors separated by hyphens (-),
     * and the colors are evenly spaced over the range of values.  For example, "red-white-hsl(240,50%,50%)".
     * @memberOf TableStyle.prototype
     * @type {String|ColorMap[]}
     * @see TableStyle#colorPalette
     */
    this.colorMap = props.colorMap;

    /**
     * Gets or sets the [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values to colors.  Setting this
     * property sets {@link TableStyle#colorMap} to undefined.  This property is ignored if {@link TableStyle#colorMap} is defined.
     * @memberOf TableStyle.prototype
     * @type {String}
     * @see  TableStyle#colorMap
     */
    this.colorPalette = props.colorPalette;

    /**
     * How many horizontal ticks to draw on the generated color ramp legend, not counting the top or bottom.
     * @type {Integer}
     */
    this.legendTicks = defined(props.legendTicks) ? props.legendTicks : 3;
};

TableStyle.prototype.updateFromJson = function(json, options) {
    return updateFromJson(this, json, options);
};

TableStyle.prototype.serializeToJson = function(options) {
    return serializeToJson(this, undefined, options);
};

/**
 * Loads the color map specified by the {@link TableStyle#colorPalette} or {@link TableStyle#colorMap} properties.
 * @return {Promise.<ColorMap>} A promise that resolves to the {@link ColorMap} once it is loaded.
 */
TableStyle.prototype.loadColorMap = function() {
    if (typeof this.colorMap === 'string' || this.colorMap instanceof String) {
        return when(ColorMap.fromString(this.colorMap));
    } else if (this.colorMap instanceof ColorMap) {
        return when(this.colorMap);
    } else if (defined(this.colorMap)) {
        return when(new ColorMap(this.colorMap));
    } else if (defined(this.colorPalette)) {
        return ColorMap.fromPalette(this.colorPalette, true);
    }
    return when(undefined);
};

/**
 * Automatically choose an appropriate color map for this DataTable, given the selected variable.
 * @param {DataTable} The dataset.
 * @param {DataVariable} [dataVariable] The selected variable; defaults to this.dataVariable.
 */
TableStyle.prototype.chooseColorMap = function(dataset, dataVariable) {
    var datavar = defaultValue(dataVariable, dataset.variables[this.dataVariable]);
    if (datavar.varType === VarType.ENUM) {
        var qualitativeColors = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999']; // from ColorBrewer2.org
        this.colorBins = Math.min(datavar.enumList.length, 9);
        this.colorMap = ColorMap.fromArray(qualitativeColors.slice(0, this.colorBins));
    } else {
        this.colorMap = 'rgba(239,210,193,1.00)-rgba(221,139,116,1.0)-rgba(255,127,46,1.0)-rgba(255,65,43,1.0)-rgba(111,0,54,1.0)';
        this.legendTicks = 3;
    }
};

module.exports = TableStyle;

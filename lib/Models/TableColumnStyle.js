'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');

var ColorMap = require('../Map/ColorMap');
var serializeToJson = require('../Core/serializeToJson');
var updateFromJson = require('../Core/updateFromJson');

/**
 * A set of properties that define how a table column should be displayed.
 * If not set explicitly, many of these properties will be given default or guessed values elsewhere,
 * such as in CsvCatalogItem.
 *
 * @alias TableColumnStyle
 * @constructor
 *
 * @param {Object} [options] The values of the properties of the new instance.
 * @param {Float} [options.minDisplayValue] All data values less than or equal to this are considered equal for the purpose of display.
 * @param {Float} [options.maxDisplayValue] All data values reater than or equal to this are considered equal for the purpose of display.
 * @param {Float} [options.displayDuration] Display duration.
 * @param {Array} [options.replaceWithZeroValues] Values to replace with zero, eg. ['-', null] will replace '-' and empty values with 0.
 * @param {Array} [options.replaceWithNullValues] Values to replace with null, eg. ['na', 'NA'] will replace these values with null.
 * @param {String} [options.nullColor] The css string for the color with which to display null values.
 * @param {String} [options.nullLabel] The legend label for null values.
 * @param {Float} [options.scale] The size of each point or billboard.
 * @param {Boolean} [options.scaleByValue] Should points and billboards representing each feature be scaled by the size of their data variable?
 * @param {Boolean} [options.clampDisplayValue] Display values that fall outside the display range as min and max colors.
 * @param {String} [options.imageUrl] A string representing an image to display at each point, for lat-long datasets.
 * @param {Object} [options.featureInfoFields] An object of { "myCol": "My column" } properties, defining which columns get displayed in feature info boxes
 *                 and what label is used instead of the column's actual name.
 * @param {Number} [options.colorBins] The number of discrete colours that a color gradient should be quantised into.
 * @param {String} [options.colorBinMethod] The method for quantising colors: "auto" (default), "ckmeans", "quantile" or "none" (equivalent to colorBins: 0).
 * @param {String|Array} [options.colorMap] Gets or sets a string or {@link ColorMap} array, specifying how to map values to colors.  Setting this property sets
 *                 colorPalette to undefined.  If this property is a string, it specifies a list of CSS colors separated by hyphens (-),
 *                 and the colors are evenly spaced over the range of values.  For example, "red-white-hsl(240,50%,50%)".
 * @param {String} [options.colorPalette] Gets or sets the [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values to colors.  Setting this
 *                 property sets colorMap to undefined.  This property is ignored if colorMap is defined.
 * @param {Integer} [options.legendTicks] How many horizontal ticks to draw on the generated color ramp legend, not counting the top or bottom.
 * @param {String} [options.name] Display name for this column.
 * @param {String|Number} [options.type] The variable type of this column. Should be one of the keys of VarType (case-insensitive), eg. 'ENUM', 'SCALAR', 'TIME'.
 */
var TableColumnStyle = function(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    /**
     * All data values less than or equal to this are considered equal for the purpose of display.
     * @type {Float}
     */
    this.minDisplayValue = options.minDisplayValue;

    /**
     * All data values greater than or equal to this are considered equal for the purpose of display.
     * @type {Float}
     */
    this.maxDisplayValue = options.maxDisplayValue;

    /**
     * Display duration.
     * @type {Float}
     */
    this.displayDuration = options.displayDuration;

    /**
     * Values to replace with zero, eg. ['-', null].
     * @type {Array}
     */
    this.replaceWithZeroValues = options.replaceWithZeroValues;

    /**
     * Values to replace with null, eg. ['na', 'NA'].
     * @type {Array}
     */
    this.replaceWithNullValues = options.replaceWithNullValues;

    /**
     * The css string for the color with which to display null values.
     * @type {String}
     */
    this.nullColor = options.nullColor;

    /**
     * The legend label for null values.
     * @type {String}
     */
    this.nullLabel = options.nullLabel;

    /**
     * The size of each point or billboard.
     * @type {Float}
     */
    this.scale = options.scale;

    /**
     * Should points and billboards representing each feature be scaled by the size of their data variable?
     * @type {Boolean}
     */
    this.scaleByValue = options.scaleByValue;

    /**
     * Display values that fall outside the display range as min and max colors.
     * @type {Boolean}
     */
    this.clampDisplayValue = options.clampDisplayValue;

    /**
     * A string representing an image to display at each point, for lat-long datasets.
     * @type {String}
     */
    this.imageUrl = options.imageUrl;

    /**
     * An object of { "myCol": "My column" } properties, defining which columns get displayed in feature info boxes
     * (when clicked on), and what label is used instead of the column's actual name.
     * @type {Object}
     */
    this.featureInfoFields = options.featureInfoFields;

    /**
     * The number of discrete colours that a color gradient should be quantised into.
     * @type {Number}
     */
    this.colorBins = options.colorBins;

    /**
     * The method for quantising colors:
     *  * For numeric columns: "auto" (default), "ckmeans", "quantile" or "none" (equivalent to colorBins: 0).
     *  * For enumerated columns: "auto" (default), "top", or "cycle"
     * @type {String}
     */
    this.colorBinMethod = defaultValue(options.colorBinMethod, 'auto');

    /**
     * Gets or sets a string or {@link ColorMap} array, specifying how to map values to colors.  Setting this property sets
     * {@link TableColumnStyle#colorPalette} to undefined.  If this property is a string, it specifies a list of CSS colors separated by hyphens (-),
     * and the colors are evenly spaced over the range of values.  For example, "red-white-hsl(240,50%,50%)".
     * @memberOf TableColumnStyle.prototype
     * @type {String|Array}
     * @see TableColumnStyle#colorPalette
     */
    if (defined(options.colorMap)) {
        this.colorMap = new ColorMap(options.colorMap);
    } else {
        this.colorMap = undefined;
    }

    /**
     * Gets or sets the [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values to colors.  Setting this
     * property sets {@link TableColumnStyle#colorMap} to undefined.  This property is ignored if {@link TableColumnStyle#colorMap} is defined.
     * @memberOf TableColumnStyle.prototype
     * @type {String}
     * @see  TableColumnStyle#colorMap
     */
    this.colorPalette = options.colorPalette;  // Only need this here so that updateFromJson sees colorPalette as a property.
    if (defined(options.colorPalette)) {
        // Note the promise created here is lost.
        var that = this;
        ColorMap.loadFromPalette(this.colorPalette).then(function(colorMap) {
            that.colorMap = colorMap;
        });
    }

    /**
     * How many horizontal ticks to draw on the generated color ramp legend, not counting the top or bottom.
     * @type {Integer}
     */
    this.legendTicks = defaultValue(options.legendTicks, 3);

    /**
     * Display name for this column.
     * @type {String}
     */
    this.name = options.name;

    /**
     * The variable type of this column.
     * Converts strings, which are case-insensitive keys of VarType, to numbers. See TableStructure for further information.
     * @type {String|Number}
     */
    this.type = options.type;

    /**
     * A format string for this column. For numbers, this is passed as options to toLocaleString.
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString .
     * @type {String|Number}
     */
    this.format = options.format;
};

// When colorMap is updated, we need to convert it to a colorMap.
// When colorPalette is updated, we need to update colorMap.
TableColumnStyle.prototype.updaters = {
    colorMap: function(tableColumnStyle, json, propertyName) {
        tableColumnStyle.colorMap = new ColorMap(json[propertyName]);
    },
    colorPalette: function(tableColumnStyle, json, propertyName) {
        return ColorMap.loadFromPalette(json[propertyName]).then(function(colorMap) {
            tableColumnStyle.colorMap = colorMap;
        });
    }
};
freezeObject(TableColumnStyle.prototype.updaters);

TableColumnStyle.prototype.serializers = {
    colorMap: function(tableColumnStyle, json, propertyName) {
        // Only serialize colorMap if there is no colorPalette.
        if (!defined(tableColumnStyle.colorPalette)) {
            json[propertyName] = tableColumnStyle[propertyName];
        }
    }
};
freezeObject(TableColumnStyle.prototype.serializers);

TableColumnStyle.prototype.updateFromJson = function(json, options) {
    return updateFromJson(this, json, options);
};

TableColumnStyle.prototype.serializeToJson = function(options) {
    return serializeToJson(this, undefined, options);
};


module.exports = TableColumnStyle;

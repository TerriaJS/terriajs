'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');

var ColorMap = require('../Map/ColorMap');
var serializeToJson = require('../Core/serializeToJson');
var updateFromJson = require('../Core/updateFromJson');

/**
  * A set of properties that define how a table, such as a CSV file, should be displayed.
  * If not set explicitly, many of these properties will be given default or guessed values elsewhere,
  * such as in CsvCatalogItem.
  * @param {Object} [props] The values of the properties of the new instance.
  */
var TableStyle = function(props) {
    props = defaultValue(props, defaultValue.EMPTY_OBJECT);

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
     * The name of the variable (column) containing data to be used for scaling and coloring.
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
    this.colorBinMethod = defaultValue(props.colorBinMethod, 'auto');

    /**
     * Gets or sets a string or {@link ColorMap} array, specifying how to map values to colors.  Setting this property sets
     * {@link TableStyle#colorPalette} to undefined.  If this property is a string, it specifies a list of CSS colors separated by hyphens (-),
     * and the colors are evenly spaced over the range of values.  For example, "red-white-hsl(240,50%,50%)".
     * @memberOf TableStyle.prototype
     * @type {String}
     * @see TableStyle#colorPalette
     */
    if (defined(props.colorMap)) {
        this.colorMap = new ColorMap(props.colorMap);
    } else {
        this.colorMap = undefined;
    }

    /**
     * Gets or sets the [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values to colors.  Setting this
     * property sets {@link TableStyle#colorMap} to undefined.  This property is ignored if {@link TableStyle#colorMap} is defined.
     * @memberOf TableStyle.prototype
     * @type {String}
     * @see  TableStyle#colorMap
     */
    this.colorPalette = props.colorPalette;  // Only need this here so that updateFromJson sees colorPalette as a property.
    if (defined(this.colorPalette)) {
        var that = this;
        return ColorMap.loadFromPalette(this.colorPalette).then(function(colorMap) {
            that.colorMap = colorMap;
        });
    }

    /**
     * How many horizontal ticks to draw on the generated color ramp legend, not counting the top or bottom.
     * @type {Integer}
     */
    this.legendTicks = defaultValue(props.legendTicks, 3);
};

// When colorMap is updated, we need to convert it to a colorMap.
// When colorPalette is updated, we need to update colorMap.
TableStyle.prototype.updaters = {
    colorMap: function(tableStyle, json, propertyName) {
        tableStyle.colorMap = new ColorMap(json[propertyName]);
    },
    colorPalette: function(tableStyle, json, propertyName) {
        return ColorMap.loadFromPalette(json[propertyName]).then(function(colorMap) {
            tableStyle.colorMap = colorMap;
        });
    }
};
freezeObject(TableStyle.prototype.updaters);

TableStyle.prototype.serializers = {
    colorMap: function(tableStyle, json, propertyName) {
        // Only serialize colorMap if there is no colorPalette.
        if (!defined(tableStyle.colorPalette)) {
            json[propertyName] = tableStyle[propertyName];
        }
    }
};
freezeObject(TableStyle.prototype.serializers);

TableStyle.prototype.updateFromJson = function(json, options) {
    return updateFromJson(this, json, options);
};

TableStyle.prototype.serializeToJson = function(options) {
    return serializeToJson(this, undefined, options);
};


module.exports = TableStyle;

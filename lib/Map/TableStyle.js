'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var ColorMap = require('./ColorMap');

/**
  * A set of properties that define how a table, such as a CSV file, should be displayed.
  * If not set explicitly, many of these properties will be given default or guessed values elsewhere,
  * such as in CsvCatalogItem.
  */ 
var TableStyle = function(props) {
    props = props || {};

    /** The name of the variable (column) to be used for region mapping. 
     * @type {String}
     */
    this.regionVariable = props.regionVariable;

    /* The identifier of a region type, as used by RegionProviderList 
     * @type {String}
     */
    this.regionType = props.regionType;

    /** The name of the variable (column) containing data to be used for choroplething.
     * @type {String}
     */    
    this.dataVariable = props.dataVariable;

    /** All data values less than or equal to this are considered equal for the purpose of display. 
     * @type {Float}
     */
    this.minDisplayValue = props.minDisplayValue;

    /** All data values greater than or equal to this are considered equal for the purpose of display.
     * @type {Float}
     */
    this.maxDisplayValue = props.maxDisplayValue;

    /** 
     * @type {Boolean} Display values that fall outside the display range as min and max colors.
     */
    this.clampDisplayValue = props.clampDisplayValue;

    /**
     * @type {String} A string representing an image to display at each point, for lat-long datasets.
     */
    this.imageUrl = props.imageUrl;

    /** An object of { "myCol": "My column" } properties, defining which columns get displayed in feature info boxes
     * (when clicked on), and what label is used instead of the column's actual name. 
     * @type {Object}
     */
    this.featureInfoFields = props.featureInfoFields;

    /** A {@link ColorMap} array, for mapping values to colours. */
    if (defined(props.colorMap)) { 
        this.colorMap = new ColorMap(props.colorMap);
    }

    /* A compact way of specifying color maps, like "red-white-hsl(240,50%,50%)" 
     * @type {String}
     */
    this.colorMapString = props.colorMapString;

    if (this.colorMapString && !defined(props.colorMap)) {
        this.colorMap = ColorMap.fromString(this.colorMapString);
    }


    /* How many horizontal ticks to draw on the generated color ramp legend, not counting the top or bottom. 
     * @type {Integer}
     */
    this.legendTicks = defined(props.legendTicks) ? props.legendTicks : 3;


    // maybe
    this.colorMapName = props.colorMapName;

};

TableStyle.prototype.toJSON = function() {
    var json = {};
    Object.keys(this).forEach(function(k) {
        if (defined(this[k])) {
            json[k] = this[k];
        }
    }, this);
    return json;
};

module.exports = TableStyle;

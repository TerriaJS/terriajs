'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
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
     * Display values that fall outside the display range as min and max colors.
     * @type {Boolean} 
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

    this._colorMap = undefined;
    this._colorMapString = undefined;

    /** A {@link ColorMap} array, for mapping values to colours. */
    if (defined(props.colorMap)) { 
        this.colorMap = new ColorMap(props.colorMap);
    } else {
        /* A compact way of specifying color maps, like "red-white-hsl(240,50%,50%)" 
         * @type {String}
         */
        this.colorMapString = props.colorMapString; // triggers update of this.colorMap
    }

    /**
     * How many horizontal ticks to draw on the generated color ramp legend, not counting the top or bottom. 
     * @type {Integer}
     */
    this.legendTicks = defined(props.legendTicks) ? props.legendTicks : 3;

};
defineProperties(TableStyle.prototype, {
    // Setting a colorMapString triggers a colorMap creation. 
    colorMapString : {
        get : function() {
            return this._colorMapString;
        },
        set: function(s) {
            this._colorMapString = s;
            if (defined(s) && s.length > 0) {
                var that = this;
                //this._colorMap = ColorMap.fromString(this._colorMapString);
                ColorMap.fromString(this._colorMapString).then(function(cm) {
                    that._colorMap = cm;
                });
            }
        }
    },
    // Setting a colorMap clears colorMapString (not all colorMaps can be expressed as a string, so we don't try.)
    colorMap : {
        get : function() {
            return this._colorMap;
        },
        set: function(cm) {
            if (!(cm instanceof ColorMap)) {
                cm = new ColorMap(cm);
            }
            this._colorMapString = undefined;
            this._colorMap = cm;
        },
    }
});


TableStyle.prototype.toJSON = function() {
    var json = {};
    Object.keys(this).forEach(function(k) {
        if (k === '_colorMap')
            k = 'colorMap';

        if (k === '_colorMapString')
            k = 'colorMapString';

        if (defined(this[k])) {
            json[k] = this[k];
        }
    }, this);
    return json;
};

module.exports = TableStyle;

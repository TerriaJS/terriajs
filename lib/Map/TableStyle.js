'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var ColorMap = require('./ColorMap');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var VarType = require('../Map/VarType');

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

    /*
     * The identifier of a region type, as used by RegionProviderList
     * @type {String}
     */
    this.regionType = props.regionType;

    /**
     * The name of the variable (column) containing data to be used for choroplething.
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

    this._colorMap = undefined;
    this._colorMapString = undefined;

    if (defined(props.colorMap)) {
        this.colorMap = new ColorMap(props.colorMap);
    } else {
        /* A compact way of specifying color maps, like "red-white-hsl(240,50%,50%)" 
         * @type {String}
         */
        this.colorMapString = props.colorMapString; 
    }

    /**
     * How many horizontal ticks to draw on the generated color ramp legend, not counting the top or bottom.
     * @type {Integer}
     */
    this.legendTicks = defined(props.legendTicks) ? props.legendTicks : 3;

};

defineProperties(TableStyle.prototype, {
    /**
     * Gets or sets a color map using compact notation, like "red-white-hsl(240,50%,50%)".
     * @memberOf TableStyle.prototype
     * @type {String}
     */
    colorMapString : {
        get : function() {
            return this._colorMapString;
        },
        set: function(s) {
            // Setting a colorMapString triggers a colorMap creation.
            this._colorMapString = s;
            this._colorMap = undefined;
        }
    },

    /**
     * Gets or sets a {@link ColorMap} array, for mapping values to colours.  Setting this property sets
     * {@link TableStyle#colorMapString} to undefined.
     * @memberOf TableStyle.prototype
     * @type {ColorMap[]}
     */
    colorMap : {
        get : function() {
            // ## This will return undefined until a .getColorMap() is called.
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

TableStyle.prototype.getColorMap = function() {
    if (defined(this.colorMap)) {
        return when(this.colorMap);
    }
    if (defined(this.colorMapString)) {

        var that = this;
        return ColorMap.fromString(this._colorMapString, true).then(function(cm) {
            that._colorMap = cm;
            return cm;
        });
    }
    return when(undefined);
};

/**
 * Automatically choose an appropriate color map for this DataTable, given the selected variable.
 * @param  {DataTable} dataset
 */
TableStyle.prototype.chooseColorMap = function(dataset) {
    var datavar = dataset.variables[this.dataVariable];
    if (datavar.varType === VarType.ENUM) {
        var qualitativeColors = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999']; // from ColorBrewer2.org
        this.colorBins = Math.min(datavar.enumList.length, 9);
        this.colorMap = ColorMap.fromArray(qualitativeColors.slice(0, this.colorBins));
    } else {
        this.colorMapString = 'rgba(239,210,193,1.00)-rgba(221,139,116,1.0)-rgba(255,127,46,1.0)-rgba(255,65,43,1.0)-rgba(111,0,54,1.0)';
        this.legendTicks = 3;
    }
};

module.exports = TableStyle;

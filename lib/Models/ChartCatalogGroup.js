'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');

var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');

/**
 * A {@link CatalogGroup} representing a collection of items from an Australian Bureau of Statistics
 * (ABS) ITT server, formed by querying for all the codes in a given dataset and concept.
 *
 * @alias AbsIttCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var ChartCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'chart-data');

    /**
     * Gets or sets the URL of the ABS ITT API, typically http://stat.abs.gov.au/itt/query.jsp.
     * This property is observable.
     * @type {String}
     */
    this.colors = ['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854','#ffd92f','#e5c494','#b3b3b3']; // TODO: make this customizable, use colormap
};

inherit(CatalogGroup, ChartCatalogGroup);

defineProperties(ChartCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf ChartCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'chart data group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf ChartCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Chart Data Group';
        }
    }
});

/**
 * Finds the next unused color for a chart line in this catalog group.
 * @return {String} A string description of the color.
 */
ChartCatalogGroup.prototype.getNextColor = function() {
    // this.colors = ['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854','#ffd92f','#e5c494','#b3b3b3']; // TODO: temp!
    if (!defined(this.colors) || this.colors.length === 0) {
        return undefined;
    }
    var colors = this.colors.slice();
    // remove colors in use, looking through to each DataCatalogItem
    for (var itemIndex = this.items.length - 1; itemIndex >= 0; itemIndex--) {
        var item = this.items[itemIndex];
        for (var i = item.colorsUsed.length - 1; i >= 0; i--) {
            var colorIndex = colors.indexOf(item.colorsUsed[i]);
            if (colorIndex > -1) {
                colors.splice(colorIndex, 1);
            }
            if (colors.length === 0) {
                colors = colors.concat(colors);  // keep cycling through the colors when they're all used
            }
        }
    }
    return colors[0];
};


module.exports = ChartCatalogGroup;

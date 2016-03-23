'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var ChartsCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    this.shortReport = undefined;
    this.charts = [];

    knockout.track(this, ['shortReport', 'charts']);
};

inherit(CatalogItem, ChartsCatalogItem);

defineProperties(ChartsCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf ChartsCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'charts';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Charts'.
     * @memberOf ChartsCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Charts';
        }
    }
});

ChartsCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [];
};

ChartsCatalogItem.prototype._load = function() {
};

ChartsCatalogItem.prototype._enable = function() {
};

ChartsCatalogItem.prototype._disable = function() {
};

ChartsCatalogItem.prototype._show = function() {
};

ChartsCatalogItem.prototype._hide = function() {
};

module.exports = ChartsCatalogItem;

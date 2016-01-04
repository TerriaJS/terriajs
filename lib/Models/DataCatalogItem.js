'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');

var CatalogItem = require('./CatalogItem');
var DisplayVariablesConcept = require('../Models/DisplayVariablesConcept');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var TableStructure = require('../Core/TableStructure');
var VarType = require('../Map/VarType');

var defaultOptions = {
    xTypes: [VarType.TIME],
    yTypes: [VarType.ALT, VarType.SCALAR, VarType.ENUM]
};

/**
 * A {@link CatalogItem} representing non-geospatial data.
 *
 * @alias DataCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the data.
 * @param {Object} [options] An object of setup options.
 * @param {Integer[]} [options.varTypes] Defaults to exclude VarType.TIME.
 * @param {String} [options.name] The name of this catalog item.
 * @param {String} [options.title] If options.name is not specified, the catalog item's name is taken from options.title.
 * @param {String} [options.description] The description of this catalog item.
 * @param {Integer} [options.xTypes=defaultOptions.xTypes] An array of which variable types could be x variables
 * @param {Integer} [options.yTypes=defaultOptions.yTypes] An array of which variable types could be y variables
 */
var DataCatalogItem = function(terria, url, options) {
    CatalogItem.call(this, terria);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    this.url = url;
    this.isMappable = false;

    this._type = 'data';
    this._typeName = 'Non-spatial data';

    // this.chartCatalogGroup = terria.catalog.chartDataGroup;
    this._tableStructure = undefined;

    if (defined(options.name)) {
        this.name = options.name;
    } else if (defined(options.title)) {
        this.name = options.title;
    }
    this.description = defaultValue(options.description, '');

    this.xTypes = defaultValue(options.xTypes, defaultOptions.xTypes);
    this.yTypes = defaultValue(options.yTypes, defaultOptions.yTypes);
    this.validXColumns = undefined;
    this.validYColumns = undefined;
    this.xColumn = undefined; // the selected x column
    this.yColumns = undefined; // selected y columns

    knockout.track(this, ['xColumn', 'yColumns', 'validYColumns']);

    var that = this;
    /**
     * Gets the table structure for this catalog item.
     * @memberOf DataCatalogItem.prototype
     * @type {TableStructure}
     */
    knockout.defineProperty(this, 'tableStructure', {
        get: function() {
            return that._tableStructure;
        }
    });

    /**
     * Returns an array of all the colors used by this data catalog item, including possible duplicates and undefined.
     * Called by ChartCatalogGroup.
     * @memberOf DataCatalogItem.prototype
     * @type {Array}
     */
    knockout.defineProperty(this, 'colorsUsed', {
        get: function() {
            if (!defined(this.validYColumns)) {
                return [];
            }
            return this.validYColumns.map(function(column) { return column.color; });
        }
    });

    knockout.defineProperty(this, 'concepts', {
        get: function() {
            var concept = new DisplayVariablesConcept('', that.toggleYColumn.bind(that));  // TODO: I've changed DisplayVariableConcept params, so this won't work
            if (defined(that.validYColumns) && (that.validYColumns.length > 0)) {
                //create ko concept for now viewing ui
                for (var i = 0; i < that.validYColumns.length; i++) {
                    var thisYColumn = that.validYColumns[i];
                    var active = defined(that.yColumns) ? (that.yColumns.indexOf(thisYColumn) >= 0) : false;
                    // If it's active and doesn't have a color yet, give it one
                    if (active && !defined(thisYColumn.color) && that.terria.catalog.chartDataGroup) {
                        thisYColumn.color = that.terria.catalog.chartDataGroup.getNextColor();
                    }
                    concept.addVariable(thisYColumn.name, active, thisYColumn.color);
                }
            }
            return [concept];
        }
    });

};

inherit(CatalogItem, DataCatalogItem);

defineProperties(DataCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance, eg. 'data'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return this._type;
        }
    },

    /**
     * Gets a human-readable name for this type of data source, eg. 'Non-spatial data'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return this._typeName;
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CsvCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    },

    /**
     * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
     * Data sources that cannot be reordered are typically displayed above reorderable data sources.
     * @memberOf DataCatalogItem.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets a value indicating whether the visibility of this data item can be toggled.
     * @memberOf DataCatalogItem.prototype
     * @type {Boolean}
     */
    supportsToggleShown : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf DataCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
     * @memberOf DataCatalogItem.prototype
     * @type {Object}
     */
    imageryLayer : {
        get : function() {
            return undefined;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf DataCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return DataCatalogItem.defaultPropertiesForSharing;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf DataCatalogItem.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return DataCatalogItem.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf DataCatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return DataCatalogItem.defaultSerializers;
        }
    },
    /**
     * Gets the data source associated with this catalog item.
     * @memberOf DataCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return undefined;
        }
    }
});


DataCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
};

DataCatalogItem.prototype._load = function() {
    if (!defined(this.url)) {
        return;
    }
    this.isLoading = true;
    var that = this;
    return loadText(this.url).then(function(text) {
        // TODO: for now, load as csv, but it would be nice to auto-detect json
        // DataTable's loadText loads a csv file, and loadJson loads a json file
		that._tableStructure = TableStructure.fromCsv(text);
        that.isLoading = false;
        setValidColumns(that);
        setDefaultColumns(that);
    });
};

/**
 * Sets which columns are valid x and y columns.
 * Called when the tableStructure has just loaded.
 */
function setValidColumns(thisItem) {
    var tableStructure = thisItem._tableStructure;
    if (tableStructure.columns.length === 0) {
        return;
    }
    var validXColumns = [],
        validYColumns = [];

    for (var i = 0; i < tableStructure.columns.length; i++) {
        var column = tableStructure.columns[i];
        if (thisItem.xTypes.indexOf(column.type) >= 0) {
            validXColumns.push(column);
        }
        if (thisItem.yTypes.indexOf(column.type) >= 0) {
            validYColumns.push(column);
        }
    }
    thisItem.validXColumns = validXColumns;
    thisItem.validYColumns = validYColumns;
}

function setDefaultColumns(thisItem) {
    if (thisItem.validXColumns.length > 0) {
        // start with the first valid x column selected
        thisItem.xColumn = thisItem.validXColumns[0];
    }
    if (thisItem.validYColumns.length > 0) {
        // Start with all valid y columns selected.
        thisItem.yColumns = thisItem.validYColumns.slice(); // clone the array so we can change it independently
    }
}

/**
 * Enables this data item.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isEnabled} property to true.
 * * Will not necessarily be called immediately when {@link CatalogItem#isEnabled} is set to true; it will be deferred until
 *   {@link CatalogItem#isLoading} is false.
 * * Should NOT also show the data item on the globe/map (see {@link CatalogItem#_show}), so in some cases it may not do
 *   anything at all.
*/
DataCatalogItem.prototype._enable = function() {
    // no need to do anything
};

DataCatalogItem.prototype._disable = function() {
    // no need to do anything
};

/**
 * Shows this data item.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isShown} property to true.
 * * Will only be called after {@link CatalogItem#_enable}; you can count on that method having been called first.
 * * Will not necessarily be called immediately when {@link CatalogItem#isShown} is set to true; it will be deferred until
 *   {@link CatalogItem#isLoading} is false.
 */
DataCatalogItem.prototype._show = function() {
    // open the chart panel if not already, and show the chart
};

/**
 * Hides this data item.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isShown} property to false.
 * * Will not be called if {@link CatalogItem#_show} was not called (for example, because the previous call was deferred
 *   while the data item loaded, and the user hid the data item before the load completed).
 */
DataCatalogItem.prototype._hide = function() {
    // remove from the chart, and hide the chart panel if appropriate
};

/**
* Toggle a y-column, ie. add or remove it from the yColumns array.
*
* @param {Integer} index Index of the selected variable in the list of variables.
*/
DataCatalogItem.prototype.toggleYColumn = function(varIndex) {
    var column = this.validYColumns[varIndex];
    var indexInSelected = this.yColumns.indexOf(column);
    if (indexInSelected >= 0) {
        // it's in the list, so remove it
        this.yColumns.splice(indexInSelected, 1);
        this.yColumns = this.yColumns.slice(); // slice to clone the array so computed properties pick up the change.
    } else {
        // it's not in the list, so add it
        this.yColumns = this.yColumns.concat([column]);  // use concat not push to clone the array.

    }
};

module.exports = DataCatalogItem;

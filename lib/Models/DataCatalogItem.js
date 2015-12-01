'use strict';

/*global require*/
var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
// var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
// var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
// var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
// var CsvDataset = require('./CsvDataset');
// var CsvVariable = require('./CsvVariable');
var DataTable = require('../Map/DataTable');
var Metadata = require('./Metadata');
// var ModelError = require('./ModelError');
// var TableStyle = require('../Map/TableStyle');
var VarType = require('../Map/VarType');

var defaultOptions = {
    varTypes: [VarType.ALT, VarType.SCALAR, VarType.ENUM]  // no VarType.TIME
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
 * @param {Object} [options] An object of setup options; also passed to {@link DataTable}.
 * @param {String} [options.name] The name of this catalog item.
 * @param {String} [options.title] If options.name is not specified, the catalog item's name is taken from options.title.
 * @param {String} [options.description] The description of this catalog item.
 * @param {Integer} [options.varTypes=defaultOptions.varTypes] An array of which variable types to display
 */
var DataCatalogItem = function(terria, url, options) {
    CatalogItem.call(this, terria);

    this.isMappable = false;

    options = defaultValue(options, defaultOptions);
    options.varTypes = defaultValue(options.varTypes, defaultOptions.varTypes);
    this._dataTable = new DataTable(options);

    this._type = 'data';
    this._typeName = 'Non-spatial data';

    this.url = url;
    this.options = options;

    if (defined(options.name)) {
        this.name = options.name;
    } else if (defined(options.title)) {
        this.name = options.title;
    }
    this.description = defaultValue(options.description, '');

    /**
     * Gets the data table for this catalog item.
     * @memberOf DataCatalogItem.prototype
     * @type {DataTable}
     */
    knockout.defineProperty(this, 'dataTable', {
        get : function() {
            return this._dataTable;
        }
    });

    var that = this;
    knockout.defineProperty(this, 'concepts', {
        get : function() {
            var concept = that._dataTable.concept;
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
            return true;
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

DataCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

DataCatalogItem.defaultUpdaters.csvDataset = function(item, json, propertyName, options) {
    // Don't update from JSON.
};

// DataCatalogItem.defaultUpdaters.tableStyle = function(csvItem, json, propertyName, options) {
//     csvItem[propertyName] = new TableStyle(json[propertyName]);
// };

freezeObject(DataCatalogItem.defaultUpdaters);

DataCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

DataCatalogItem.defaultSerializers.csvDataset = function(item, json, propertyName) {
    // Don't serialize.
};

// DataCatalogItem.defaultSerializers.tableStyle = function(csvItem, json, propertyName, options) {
//     json[propertyName] = csvItem[propertyName].toJSON();
// };


freezeObject(DataCatalogItem.defaultSerializers);


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
		that._dataTable.loadText(text);
        that.isLoading = false;
        that._dataTable.setDefaultDataVariable();
    });
};

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


module.exports = DataCatalogItem;

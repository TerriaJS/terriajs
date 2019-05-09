'use strict';

/*global require*/
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var Resource = require('terriajs-cesium/Source/Core/Resource');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var TableCatalogItem = require('./TableCatalogItem');
var TerriaError = require('../Core/TerriaError');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var readText = require('../Core/readText');
var TableStructure = require('../Map/TableStructure');

/**
 * A {@link CatalogItem} representing CSV data.
 *
 * @alias CsvCatalogItem
 * @constructor
 * @extends TableCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the CSV data.
 * @param {Object} [options] Initial values.
 * @param {TableStyle} [options.tableStyle] An initial table style can be supplied if desired.
 */
var CsvCatalogItem = function(terria, url, options) {
    TableCatalogItem.call(this, terria, url, options);

    /**
     * Gets or sets the character set of the data, which overrides the file information if present. Default is undefined.
     * This property is observable.
     * @type {String}
     */
    this.charSet = undefined;

    /**
     * Some catalog items are created from other catalog items.
     * Record here so that the user (eg. via "About this Dataset") can reference the source item.
     * @type {CatalogItem}
     */
    this.sourceCatalogItem = undefined;

    /**
     * Options for the value of the animation timeline at start. Valid options in config file are:
     *     initialTimeSource: "present"                            // closest to today's date
     *     initialTimeSource: "start"                              // start of time range of animation
     *     initialTimeSource: "end"                                // end of time range of animation
     *     initialTimeSource: An ISO8601 date e.g. "2015-08-08"    // specified date or nearest if date is outside range
     * @type {String}
     */
    this.initialTimeSource = undefined;
};

inherit(TableCatalogItem, CsvCatalogItem);


defineProperties(CsvCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'csv';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    typeName: {
        get: function() {
            return 'Comma-Separated Values (CSV)';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CsvCatalogItem.prototype
     * @type {Metadata}
     */
    metadata: { //TODO: return metadata if tableDataSource defined
        get: function() {
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    },

    /**
     * Gets the data source associated with this catalog item.
     * @memberOf CsvCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource: {
        get: function() {
            return this._dataSource;
        }
    }

});

CsvCatalogItem.defaultUpdaters = clone(TableCatalogItem.defaultUpdaters);

CsvCatalogItem.defaultUpdaters.sourceCatalogItem = function() {
    // TODO: For now, don't update from JSON. Better to do it via an id?
};

freezeObject(CsvCatalogItem.defaultUpdaters);

CsvCatalogItem.defaultSerializers = clone(TableCatalogItem.defaultSerializers);

CsvCatalogItem.defaultSerializers.sourceCatalogItem = function() {
    // TODO: For now, don't serialize. Can we do it via an id?
};

freezeObject(CsvCatalogItem.defaultSerializers);

/**
 * Loads the TableStructure from a csv file.
 *
 * @param {CsvCatalogItem} item Item that tableDataSource is created for
 * @param {String} csvString String in csv format.
 * @return {Promise} A promise that resolves to true if it is a recognised format.
 * @private
 */
function loadTableFromCsv(item, csvString) {
    var tableStyle = item._tableStyle;
    var options = {
        idColumnNames: item.idColumns,
        isSampled: item.isSampled,
        initialTimeSource: item.initialTimeSource,
        displayDuration: tableStyle.displayDuration,
        replaceWithNullValues: tableStyle.replaceWithNullValues,
        replaceWithZeroValues: tableStyle.replaceWithZeroValues,
        columnOptions: tableStyle.columns  // may contain per-column replacements for these
    };
    var tableStructure = new TableStructure(undefined, options);
    tableStructure.loadFromCsv(csvString);
    return item.initializeFromTableStructure(tableStructure);
}

/**
 * Loads csv data from a URL into a (usually temporary) table structure.
 * This is required by Chart.jsx for any non-csv format.
 * @param  {String} url The URL.
 * @return {Promise} A promise which resolves to a table structure.
 */
CsvCatalogItem.prototype.loadIntoTableStructure = function(url) {
    const item = this;
    const tableStructure = new TableStructure();
    // Note item is only used for its 'terria', 'forceProxy' and 'cacheDuration' properties
    // (which are all defined on CatalogMember, the base class of CatalogItem).
    return loadTextWithMime(proxyCatalogItemUrl(item, url, '0d')).then(tableStructure.loadFromCsv.bind(tableStructure));
};

/**
 * Every <polling.seconds> seconds, if the csvItem is enabled,
 * request data from the polling.url || url, and update/replace this._tableStructure.
 */
CsvCatalogItem.prototype.startPolling = function() {
    const polling = this.polling;
    if (defined(polling.seconds) && polling.seconds > 0) {
        var item = this;
        this._pollTimeout = setTimeout(function() {
            if (item.isEnabled) {
                item.loadIntoTableStructure(polling.url || item.url).then(function(newTable) {
                    // console.log('polled url', polling.url || item.url, newTable);
                    if (item._tableStructure.hasLatitudeAndLongitude !== newTable.hasLatitudeAndLongitude || item._tableStructure.columns.length !== newTable.columns.length) {
                        console.log('The newly polled data is incompatible with the old data.');
                        throw new DeveloperError('The newly polled data is incompatible with the old data.');
                    }
                    // Maintain active item and colors.  Assume same column ordering for now.
                    item._tableStructure.columns.forEach(function(column, i) {
                        newTable.columns[i].isActive = column.isActive;
                        newTable.columns[i].color = column.color;
                    });
                    if (polling.replace) {
                        item._tableStructure.columns = newTable.columns;
                    } else {
                        if (defined(item.idColumns) && item.idColumns.length > 0) {
                            item._tableStructure.merge(newTable);
                        } else {
                            item._tableStructure.append(newTable);
                        }
                    }
                });
            }
            // Note this means the timer keeps going even when you remove (disable) the item,
            // but it doesn't actually request new data any more.
            // If the item is re-enabled, the same timer just starts picking it up again.
            item.startPolling();
        }, polling.seconds * 1000);
    }
};

CsvCatalogItem.prototype._load = function() {
    var that = this;

    if (defined(this.data)) {
        return when(that.data, function(data) {
            if (typeof Blob !== 'undefined' && data instanceof Blob) {
                return readText(data).then(function(text) {
                    return loadTableFromCsv(that, text);
                });
            } else if (typeof data === 'string') {
                return loadTableFromCsv(that, data);
            } else if (data instanceof TableStructure) {
                TableCatalogItem.applyTableStyleColumnsToStructure(that._tableStyle, data);
                return that.initializeFromTableStructure(data);
            } else {
                throw new TerriaError({
                    sender: that,
                    title: 'Unexpected type of CSV data',
                    message: 'CsvCatalogItem data is expected to be a Blob, File, or String, but it was not any of these. ' +
                        'This may indicate a bug in terriajs or incorrect use of the terriajs API. ' +
                        'If you believe it is a bug in ' + that.terria.appName + ', please report it by emailing ' +
                        '<a href="mailto:' + that.terria.supportEmail + '">' + that.terria.supportEmail + '</a>.'
                });
            }
        });
    } else if (defined(that.url)) {
        var overrideMimeType;
        if (defined(that.charSet)) {
            overrideMimeType = 'text/csv; charset=' + that.charSet;
        }
        return loadTextWithMime(proxyCatalogItemUrl(that, that.url, '1d'), undefined, overrideMimeType).then(function(text) {
            return loadTableFromCsv(that, text);
        }).otherwise(function(e) {
            throw new TerriaError({
                sender: that,
                title: 'Unable to load CSV file',
                message: 'See the <a href="https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au">csv-geo-au</a> specification for supported CSV formats.\n\n' + (e.message || e.response)
            });
        });
    }
};

CsvCatalogItem.prototype.searchDataForMatchingFeatures = function(searchText) {
    const results = [];
    const re = new RegExp(`.*${searchText}.`, 'gmi');

    if (defined(this.data)) {
        if (defined(this._regionMapping)) {
            for (var i = 0; i < this._regionMapping.regionDetails.length; i++) {
                const regionDetails = this._regionMapping.regionDetails[i];
                
                for (var ii = 0; ii < regionDetails.regionProvider.regions.length; ii++) {
                    if (re.test(regionDetails.regionProvider.regions[ii].id)) {
                        results.push({
                            matchType: 'RegionMapping',
                            regionProvider: regionDetails,
                            catalogItem: this,
                            feature: regionDetails.regionProvider.regions[ii],
                            matchFieldText: regionDetails.regionProvider.regions[ii].id
                        });
                    } 
                }
            }
        } 
    }
    return results;
};

/**
 * The same as terriajs-cesium/Source/Core/loadText, but with the ability to pass overrideMimeType through to loadWithXhr.
 * @private
 */
function loadTextWithMime(url, headers, overrideMimeType) {
    return Resource.fetch({
            url : url,
            headers : headers,
            overrideMimeType: overrideMimeType
        });
}

module.exports = CsvCatalogItem;

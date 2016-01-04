'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var readText = require('../Core/readText');
var TableDataSource2 = require('../Map/TableDataSource2');

/**
 * A {@link CatalogItem} representing CSV data.
 *
 * @alias CsvCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the CSV data.
 */
var CsvCatalogItem = function(terria, url) {
    CatalogItem.call(this, terria);

    this._dataSource = undefined;
    this._tableStyle = undefined;  // TODO: not implemented yet
    this._clockTickUnsubscribe = undefined;
    this.url = url;

    /**
     * Gets or sets the CSV data, represented as a binary Blob, a string, or a Promise for one of those things.
     * If this property is set, {@link CatalogItem#url} is ignored.
     * This property is observable.
     * @type {Blob|String|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link CsvCatalogItem#data} was obtained.  This is informational; it is not
     * used.  This propery is observable.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    /**
     * Gets or sets the opacity (alpha) of the data item, where 0.0 is fully transparent and 1.0 is
     * fully opaque.  This property is observable.
     * @type {Number}
     * @default 0.6
     */
    this.opacity = 0.6;

    /**
     * Keeps the layer on top of all other imagery layers.  This property is observable.
     * @type {Boolean}
     * @default false
     */
    this.keepOnTop = false;

    /**
     * Should any warnings like failures in region mapping be displayed to the user?
     * @type {Boolean}
     * @default true
     */
    this.showWarnings = true;

    /**
     * Disable the ability to change the display of the dataset via displayVariablesConcept.
     * This property is observable.
     * @type {Boolean}
     * @default false
     */
    this.disableUserChanges = false;

    knockout.track(this, ['data', 'dataSourceUrl', 'opacity', 'keepOnTop', 'disableUserChanges', 'showWarnings', '_dataSource']);

    // var that = this;
    knockout.defineProperty(this, 'concepts', {
        get: function() {
            if (defined(this._dataSource) && defined(this._dataSource.tableStructure)) {
                return [this._dataSource.tableStructure];
            } else {
                return [];
            }
        }
    });

    overrideProperty(this, 'clock', {
        get: function() {
            return this._dataSource.clock;
        }
    });
};

inherit(CatalogItem, CsvCatalogItem);

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
     * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
     * Data sources that cannot be reordered are typically displayed above reorderable data sources.
     * @memberOf CsvCatalogItem.prototype
     * @type {Boolean}
     */
    supportsReordering: {
        get: function() {
            return this._regionMapped && !this.keepOnTop;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity: {
        get: function() {
            return this._regionMapped;
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
    },

    /**
     * Gets the TableStyle object showing how to style the data.
     * @memberof CsvCatalogItem.prototype
     * @type {TableStyle}
     */
    tableStyle : {
        get : function() {
            return this._tableStyle;
        }
    }
});


CsvCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};


function loadTable(csvItem, text) {
    var dataSource = csvItem._dataSource;
    dataSource.load(text, csvItem._tableStyle);
    // If there is specifically a 'lat' and 'lon' column.
    if (!dataSource.hasLocationData) {
        console.log('No lat&lon columns found in csv file - and region matching has been disabled');
        //console.log('No lat&lon columns found in csv file - trying to match based on region');
    } else {
        //prepare visuals and repaint
        if (!defined(csvItem.rectangle)) {
            csvItem.rectangle = csvItem._dataSource.extent;
        }
        var legend = csvItem._dataSource.legend;
        csvItem.legendUrl = defined(legend) ? legend.asPngUrl() : undefined;
        csvItem.terria.currentViewer.notifyRepaintRequired();
    }
}


CsvCatalogItem.prototype._load = function() {
    if (defined(this._dataSource)) {
        this._dataSource.destroy();
    }

    this._dataSource = new TableDataSource2();

    var that = this;

    if (defined(this.data)) {
        return when(that.data, function(data) {
            if (typeof Blob !== 'undefined' && data instanceof Blob) {
                return readText(data).then(function(text) {
                    return loadTable(that, text);
                });
            } else if (typeof data === 'string') {
                return loadTable(that, data);
            } else {
                throw new ModelError({
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
        return loadText(proxyCatalogItemUrl(that, that.url)).then(function(text) {
            return loadTable(that, text);
        }).otherwise(function(e) {
            throw new ModelError({
                sender: that,
                title: 'Unable to load CSV file',
                message: 'See the <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">csv-geo-au</a> specification for supported CSV formats.\n\n' + (e.message || e.response)
            });
        });
    }
};

CsvCatalogItem.prototype._enable = function(layerIndex) {

};

CsvCatalogItem.prototype._disable = function() {

};

CsvCatalogItem.prototype._show = function() {
    var dataSources = this.terria.dataSources;
    if (dataSources.contains(this._dataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._dataSource);
};

CsvCatalogItem.prototype._hide = function() {
    var dataSources = this.terria.dataSources;
    if (!dataSources.contains(this._dataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._dataSource, false);
};


module.exports = CsvCatalogItem;
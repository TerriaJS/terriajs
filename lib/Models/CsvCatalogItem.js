'use strict';

/*global require*/
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var TerriaError = require('../Core/TerriaError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var readText = require('../Core/readText');
var RegionMapping = require('./RegionMapping');
var standardCssColors = require('../Core/standardCssColors');
var TableDataSource = require('../Models/TableDataSource');
var TableStructure = require('../Map/TableStructure');
var TableStyle = require('../Models/TableStyle');
var VarType = require('../Map/VarType');

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

    this._tableStructure = undefined;
    this._tableStyle = new TableStyle();  // start with one so defaultSerializers.tableStyle will work.
    this._dataSource = undefined;
    this._regionMapping = undefined;
    this._rectangle = undefined;
    this._useClock = true; // If the table has a time column, then show a clock.

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

    /**
     * Gets or sets the array of color strings used for chart lines.
     * TODO: make this customizable, eg. use colormap / colorPalette.
     * @type {String[]}
     */
    this.colors = standardCssColors.brewer8ClassSet2;

    /**
     * Some catalog items are created from other catalog items.
     * Record here so that the user (eg. via "About this Dataset") can reference the source item.
     * @type {CatalogItem}
     */
    this.sourceCatalogItem = undefined;

    knockout.track(this, ['data', 'dataSourceUrl', 'opacity', 'keepOnTop', 'disableUserChanges', 'showWarnings', '_tableStructure', '_dataSource', '_regionMapping']);

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        if (defined(this._regionMapping) && defined(this._regionMapping.updateOpacity)) {
            this._regionMapping.updateOpacity(newValue);
            this.terria.currentViewer.notifyRepaintRequired();
        }
    }, this);

    // var that = this;
    knockout.defineProperty(this, 'concepts', {
        get: function() {
            if (defined(this._tableStructure)) {
                return [this._tableStructure];
            } else {
                return [];
            }
        }
    });

    /**
     * Gets the tableStyle object.
     * This needs to be a property on the object (not the prototype), so that updateFromJson sees it.
     * @type {Object}
     */
    knockout.defineProperty(this, 'tableStyle', {
        get : function() {
            return this._tableStyle;
        }
    });

    overrideProperty(this, 'clock', {
        get: function() {
            var timeColumn = this.timeColumn;
            if (this._useClock && defined(timeColumn)) {
                return timeColumn.clock;
            }
        }
    });

    overrideProperty(this, 'legendUrl', {
        get: function() {
            if (defined(this._dataSource)) {
                return this._dataSource.legendUrl;
            } else if (defined(this._regionMapping)) {
                return this._regionMapping.legendUrl;
            }
        }
    });

    overrideProperty(this, 'rectangle', {
        get: function() {
            // can override the extent using this.rectangle, otherwise falls back the datasource's extent.
            if (defined(this._rectangle)) {
                return this._rectangle;
            }
            if (defined(this._dataSource)) {
                return this._dataSource.extent;
            } else if (defined(this._regionMapping)) {
                return this._regionMapping.extent;
            }
        },
        set: function(rect) {
            this._rectangle = rect;
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
     * Gets the active time column, if it exists.
     * @memberOf CsvCatalogItem.prototype
     * @type {TableColumn}
     */
    timeColumn: {
        get: function() {
            return this._tableStructure && this._tableStructure.activeTimeColumn;
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
            return defined(this._regionMapping) && defined(this._regionMapping.regionDetails) && !this.keepOnTop;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity: {
        get: function() {
            return (defined(this._regionMapping) && defined(this._regionMapping.regionDetails));
        }
    },

    /**
     * Gets the table structure associated with this catalog item.
     * @memberOf CsvCatalogItem.prototype
     * @type {TableStructure}
     */
    tableStructure: {
        get: function() {
            return this._tableStructure;
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
     * Gets the region mapping associated with this catalog item.
     * @memberOf CsvCatalogItem.prototype
     * @type {RegionMapping}
     */
    regionMapping: {
        get: function() {
            return this._regionMapping;
        }
    },

    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * Used in region mapping only.
     * This property is undefined if the data source is not enabled.
     * @memberOf CsvCatalogItem.prototype
     * @type {Object}
     */
    imageryLayer: {
        get: function() {
            return this._regionMapping && this._regionMapping.imageryLayer;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * for a share link.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing: {
        get: function() {
            return CsvCatalogItem.defaultPropertiesForSharing;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf CsvCatalogItem.prototype
     * @type {Object}
     */
    updaters: {
        get: function() {
            return CsvCatalogItem.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CsvCatalogItem.prototype
     * @type {Object}
     */
    serializers: {
        get: function() {
            return CsvCatalogItem.defaultSerializers;
        }
    }
});

CsvCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

CsvCatalogItem.defaultUpdaters.tableStyle = function(csvItem, json, propertyName, options) {
    return csvItem._tableStyle.updateFromJson(json[propertyName], options);
};

CsvCatalogItem.defaultUpdaters.concepts = function() {
    // Don't update from JSON.
};

CsvCatalogItem.defaultUpdaters.sourceCatalogItem = function() {
    // TODO: For now, don't update from JSON. Better to do it via an id?
};

freezeObject(CsvCatalogItem.defaultUpdaters);

CsvCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

CsvCatalogItem.defaultSerializers.tableStyle = function(csvItem, json, propertyName, options) {
    json[propertyName] = csvItem[propertyName].serializeToJson(options);
    // Add the currently active variable to the tableStyle so it starts with the right one.
    if (defined(csvItem._tableStructure)) {
        var activeItems = csvItem._tableStructure.activeItems;
        json[propertyName].dataVariable = activeItems[0] && activeItems[0].name;
    }
};

CsvCatalogItem.defaultSerializers.legendUrl = function() {
    // Don't serialize, because legends are generated, and sticking an image embedded in a URL is a terrible idea.
};

CsvCatalogItem.defaultSerializers.concepts = function() {
    // Don't serialize.
};

CsvCatalogItem.defaultSerializers.clock = function() {
    // Don't serialize. Clock is not part of propertiesForSharing, but it would be shared if this is user-added data.
    // See SharePopupViewModel.prototype._addUserAddedCatalog.
};

CsvCatalogItem.defaultSerializers.sourceCatalogItem = function() {
    // TODO: For now, don't serialize. Can we do it via an id?
};

freezeObject(CsvCatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object
 * for a share link.
 * @type {String[]}
 */
CsvCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
CsvCatalogItem.defaultPropertiesForSharing.push('keepOnTop');
CsvCatalogItem.defaultPropertiesForSharing.push('disableUserChanges');
CsvCatalogItem.defaultPropertiesForSharing.push('opacity');
CsvCatalogItem.defaultPropertiesForSharing.push('tableStyle');
freezeObject(CsvCatalogItem.defaultPropertiesForSharing);


CsvCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

function setActiveTimeColumn(tableStructure, tableStyle) {
    if (typeof tableStyle.timeColumn !== 'undefined') {
        tableStructure.activeTimeColumn = tableStructure.getColumnWithNameOrIndex(tableStyle.timeColumn);
        if (defined(tableStructure.activeTimeColumn) && tableStructure.activeTimeColumn.type !== VarType.TIME) {
            tableStructure.activeTimeColumn = tableStructure.columnsByType[VarType.TIME][0];
            throw new DeveloperError('TableStyle.timeColumn "' + tableStyle.timeColumn + '" is not a valid time column.');
        }
    } else {
        tableStructure.activeTimeColumn = tableStructure.columnsByType[VarType.TIME][0];
    }
}

// Loads the TableStructure.
// Chooses what sort of object to place it in:
//  - TableDataSource if it has latitude and longitude
//  - RegionMapping if it has a region column
//  - nothing for non-geospatial data (just use the TableStructure directly).
// Returns a promise that resolves to true if it is a recognised format.
function loadTableFromCsv(item, csvString) {
    var tableStyle = item._tableStyle;
    var options = {
        displayDuration: tableStyle.displayDuration,
        replaceWithNullValues: tableStyle.replaceWithNullValues,
        replaceWithZeroValues: tableStyle.replaceWithZeroValues,
        columnOptions: tableStyle.columns  // may contain per-column replacements for these
    };
    var tableStructure = new TableStructure(undefined, options);
    tableStructure.loadFromCsv(csvString);
    setActiveTimeColumn(tableStructure, tableStyle);
    item._tableStructure = tableStructure;
    if (tableStructure.hasLatitudeAndLongitude) {
        // Create the TableDataSource and save it to item._dataSource.
        item._dataSource = new TableDataSource(tableStructure, item._tableStyle, item.name);
        item._dataSource.changedEvent.addEventListener(dataChanged.bind(null, item), item);
        // Activate a column. This needed to wait until we had a dataSource, so it can trigger the legendHelper build.
        item.activateColumnFromTableStyle();
        ensureActiveColumn(tableStructure);
        return when(true); // We're done - nothing to wait for.
    }
    var regionMapping = new RegionMapping(item, tableStructure, item._tableStyle);
    // Return a promise which resolves once we've set up region mapping, if any.
    return regionMapping.loadRegionDetails().then(function(regionDetails) {
        if (regionDetails) {
            // Save the region mapping to item._regionMapping.
            item._regionMapping = regionMapping;
            item._regionMapping.changedEvent.addEventListener(dataChanged.bind(null, item), item);
            // Set the first region column to have type VarType.REGION.
            RegionMapping.setRegionColumnType(regionDetails);
            // Activate a column. This needed to wait until we had a regionMapping, so it can trigger the legendHelper build.
            item.activateColumnFromTableStyle();
            // This needed to wait until we know which column is the region.
            ensureActiveColumn(tableStructure);
            return when(true);
        } else {
            // Non-geospatial data.
            item.isMappable = false;
            item._useClock = false;
            tableStructure.name = ''; // No need to show the section title 'Display Variables' in Now Viewing.
            tableStructure.allowMultiple = true;
            tableStructure.getColorCallback = item.getNextColor.bind(item);
            // Could hide non-scalar columns here.
            item.activateColumnFromTableStyle();
            ensureActiveColumnForNonSpatial(tableStructure);
            // If it's not there already, add it to the catalog's chartable items, so the ChartPanel can pick it up.
            if (item.terria.catalog.chartableItems.indexOf(item) < 0) {
                item.terria.catalog.chartableItems.push(item);
            }
            // Any derived calculations from this can ignore the need for julianFinishDates and availabilities.
            tableStructure.columnsByType[VarType.TIME].forEach(function(column) {
                column.options.noFinishDates = true;
            });

            return when(true);
        }
    });
}

// An event listened triggered whenever the dataSource or regionMapping changes.
// Used to know when to redraw the display.
function dataChanged(item) {
    item.terria.currentViewer.notifyRepaintRequired();
}

function ensureActiveColumn(tableStructure) {
    // Find and activate the first SCALAR or ENUM column, if no columns are active.
    if (tableStructure.activeItems.length === 0) {
        var suitableColumns = tableStructure.columns.filter(function(col) {
            return ([VarType.SCALAR, VarType.ENUM].indexOf(col.type) >= 0);
        });
        if (suitableColumns.length > 0) {
            suitableColumns[0].toggleActive();
        } else {
            // There are no suitable columns. We need to trigger an active column change to update TableDataSource and RegionMapping, so toggle one twice.
            tableStructure.columns[0].toggleActive();
            tableStructure.columns[0].toggleActive();
        }
    }
}

function ensureActiveColumnForNonSpatial(tableStructure) {
    // If it is not mappable, and has no time column, then the first scalar column will be treated as the x-variable, so choose the second one.
    if (tableStructure.activeItems.length === 0) {
        var suitableColumns = tableStructure.columnsByType[VarType.SCALAR];
        if (suitableColumns.length > 1) {
            suitableColumns[1].toggleActive();
        } else if (suitableColumns.length > 0) {
            suitableColumns[0].toggleActive();
        }
    }
}

/**
 * Activates the column specified in the table style's "dataVariable" parameter, if any.
 */
CsvCatalogItem.prototype.activateColumnFromTableStyle = function() {
    var tableStyle = this._tableStyle;
    if (defined(tableStyle) && defined(tableStyle.dataVariable)) {
        var columnToActivate = this._tableStructure.getColumnWithName(tableStyle.dataVariable);
        if (columnToActivate) {
            columnToActivate.toggleActive();
        }
    }
};


/**
 * Loads data from a URL into a (usually temporary) table structure.
 * @param  {String} url The URL.
 * @return {Promise} A promise which resolves to a table structure.
 */
function loadIntoTableStructure(url) {
    // Load in the data file as a TableStructure. Currently only understands csv.
    const tableStructure = new TableStructure();
    return loadText(url).then(tableStructure.loadFromCsv.bind(tableStructure));
}

/**
 * Every <seconds> seconds, if the csvItem is enabled,
 * request data from the url and merge it into this._tableStructure.
 * TODO: how to stop it? Can csvItem ever be destroyed?
 * @param {String} url The URL to poll.
 * @param {String|Number} seconds How often to poll.
 */
CsvCatalogItem.prototype.poll = function(url, seconds) {
    if (seconds > 0 && url) {
        var item = this;
        setTimeout(function() {
            if (item._isEnabled) {
                loadIntoTableStructure(url).then(function(newTable) {
                    console.log('polled', newTable);
                }); // TODO: merge into csvItem._tableStructure.
            }
            item.poll(url, seconds);
        }, seconds * 1000);
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
        return loadText(proxyCatalogItemUrl(that, that.url)).then(function(text) {
            return loadTableFromCsv(that, text);
        }).otherwise(function(e) {
            throw new TerriaError({
                sender: that,
                title: 'Unable to load CSV file',
                message: 'See the <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">csv-geo-au</a> specification for supported CSV formats.\n\n' + (e.message || e.response)
            });
        });
    }
};

CsvCatalogItem.prototype._enable = function(layerIndex) {
    if (defined(this._regionMapping)) {
        this._regionMapping.enable(layerIndex);
    }
};

CsvCatalogItem.prototype._disable = function() {
    if (defined(this._regionMapping)) {
        this._regionMapping.disable();
    }
};

CsvCatalogItem.prototype._show = function() {
    if (defined(this._dataSource)) {
        var dataSources = this.terria.dataSources;
        if (dataSources.contains(this._dataSource)) {
            throw new DeveloperError('This data source is already shown.');
        }
        dataSources.add(this._dataSource);
    }
    if (defined(this._regionMapping)) {
        this._regionMapping.show();
    }
};

CsvCatalogItem.prototype._hide = function() {
    if (defined(this._dataSource)) {
        var dataSources = this.terria.dataSources;
        if (!dataSources.contains(this._dataSource)) {
            throw new DeveloperError('This data source is not shown.');
        }
        dataSources.remove(this._dataSource, false);
    }
    if (defined(this._regionMapping)) {
        this._regionMapping.hide();
    }
};

/**
 * Finds the next unused color for a chart line.
 * @return {String} A string description of the color.
 */
CsvCatalogItem.prototype.getNextColor = function() {
    var catalog = this._terria.catalog;
    if (!defined(catalog)) {
        return;
    }
    if (!defined(this.colors) || this.colors.length === 0) {
        return;
    }
    var colors = this.colors.slice();
    // Get all the colors in use (as nested array).
    var colorsUsed = catalog.chartableItems.map(function(item) {
        return item.tableStructure.columns.map(function(column) { return column.color; }).filter(function(color) { return defined(color); });
    });
    // Flatten it.
    colorsUsed = colorsUsed.reduce(function(a, b) { return a.concat(b); }, []);
    // Remove the colors in use from the full list.
    for (var index = 0; index < colorsUsed.length; index++) {
        var fullColorsIndex = colors.indexOf(colorsUsed[index]);
        if (fullColorsIndex > -1) {
            colors.splice(fullColorsIndex, 1);
        }
        if (colors.length === 0) {
            colors = this.colors.slice();  // Keep cycling through the colors when they're all used.
        }
    }
    return colors[0];
};

CsvCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
    var dataSource = this._dataSource;
    var removeRegionMapping;

    if (defined(this._regionMapping)) {
        removeRegionMapping = this._regionMapping.showOnSeparateMap(globeOrMap);
    }

    if (defined(dataSource)) {
        globeOrMap.addDataSource({
            dataSource: dataSource
        });
    }

    return function() {
        if (defined(removeRegionMapping)) {
            removeRegionMapping();
        }
        if (defined(dataSource)) {
            globeOrMap.removeDataSource({
                dataSource: dataSource
            });
        }
    };
};

module.exports = CsvCatalogItem;

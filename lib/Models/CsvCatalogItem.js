'use strict';

/*global require*/
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
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
var TableDataSource = require('../Models/TableDataSource');
var TableStyle = require('../Models/TableStyle');

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
    this._tableStyle = new TableStyle();  // start with one so defaultSerializers.tableStyle will work.
    this._rectangle = undefined;
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

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        if (defined(this._dataSource) && defined(this._dataSource.updateOpacity)) {
            this._dataSource.updateOpacity(newValue);
            this.terria.currentViewer.notifyRepaintRequired();
        }
    }, this);

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
            return defined(this._dataSource) ? this._dataSource.clock : undefined;
        }
    });

    overrideProperty(this, 'legendUrl', {
        get: function() {
            // Whenever the legend changes, we need to repaint the features.
            // This doesn't catch every case, eg. if you move from one legendless selected variable to another.
            // Is there a more direct way to trigger this?
            this.terria.currentViewer.notifyRepaintRequired();
            // And update the legendUrl
            if (defined(this._dataSource)) {
                return this._dataSource.legendUrl;
            }
        }
    });

    overrideProperty(this, 'rectangle', {
        get: function() {
            // can override the extent using this.rectangle, otherwise falls back the datasource's extent.
            if (defined(this._rectangle)) {
                return this._rectangle;
            }
            if (defined(this._dataSource) && defined(this._dataSource)) {
                return this._dataSource.extent;
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
            return defined(this._dataSource) && defined(this._dataSource.regionDetails) && !this.keepOnTop;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity: {
        get: function() {
            return (defined(this._dataSource) && defined(this._dataSource.regionDetails));
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
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * Used in region mapping only.
     * This property is undefined if the data source is not enabled.
     * @memberOf CsvCatalogItem.prototype
     * @type {Object}
     */
    imageryLayer: {
        get: function() {
            return this._dataSource && this._dataSource.regionImageryLayer;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf CsvCatalogItem.prototype
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

freezeObject(CsvCatalogItem.defaultUpdaters);

CsvCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

CsvCatalogItem.defaultSerializers.tableStyle = function(csvItem, json, propertyName, options) {
    json[propertyName] = csvItem[propertyName].serializeToJson(options);
    // Add the currently active variable to the tableStyle so it starts with the right one.
    if (defined(csvItem._dataSource) && defined(csvItem._dataSource.tableStructure)) {
        var activeItems = csvItem._dataSource.tableStructure.activeItems;
        json[propertyName].dataVariable = activeItems[0] && activeItems[0].name;
    }
};

CsvCatalogItem.defaultSerializers.legendUrl = function() {
    // Don't serialize, because legends are generated, and sticking an image embedded in a URL is a terrible idea.
};

CsvCatalogItem.defaultSerializers.concepts = function() {
    // Don't serialize.
};

freezeObject(CsvCatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
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


function loadTableFromCsv(csvItem, csvString) {
    var dataSource = csvItem._dataSource;
    dataSource.loadFromCsv(csvString, csvItem._tableStyle);
}


CsvCatalogItem.prototype._load = function() {
    if (defined(this._dataSource)) {
        this._dataSource.destroy();
    }

    this._dataSource = new TableDataSource(this);

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
    this._dataSource.enable(layerIndex);
};

CsvCatalogItem.prototype._disable = function() {
    this._dataSource.disable();
};

CsvCatalogItem.prototype._show = function() {
    this._dataSource.show();
};

CsvCatalogItem.prototype._hide = function() {
    this._dataSource.hide();
};

module.exports = CsvCatalogItem;
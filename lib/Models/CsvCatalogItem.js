'use strict';

/*global require*/
var L = require('leaflet');

var clone = require('terriajs-cesium/Source/Core/clone');
var DataSourceClock = require('terriajs-cesium/Source/DataSources/DataSourceClock');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var WebMapServiceImageryProvider = require('terriajs-cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var readText = require('../Core/readText');
var TableDataSource = require('../Map/TableDataSource');
var VarType = require('../Map/VarType');
var TileLayerFilter = require('../ThirdParty/TileLayer.Filter');

var DisplayVariablesConcept = require('./DisplayVariablesConcept');

var RegionProviderList = require('../Map//RegionProviderList');
var ImageryProviderHooks = require('../Map/ImageryProviderHooks');
var ColorMap = require('../Map/ColorMap');
var TableStyle = require('../Map/TableStyle');

TileLayerFilter.initialize(L);

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

    this._tableDataSource = undefined;

    this._clockTickUnsubscribe = undefined;

    this._regionMapped = false;

    this._displayVariablesConcept = undefined;

    this._clockTickUnsubscribe = undefined;

    // a function that returns a colour for a given index.
    this._colorFunc = undefined;

    this._tableStyle = new TableStyle({});

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

    knockout.track(this, ['data', 'dataSourceUrl', 'opacity', 'keepOnTop', '_regionMapped', '_displayVariablesConcept', 'disableUserChanges', 'showWarnings']);

    knockout.defineProperty(this, 'displayVariablesConcept', {
        get : function() {
            return this._displayVariablesConcept;
        },
        set : function(value) {
            this._displayVariablesConcept = value;
        }
    });

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        updateOpacity(this);
    }, this);

    knockout.getObservable(this, 'isShown').subscribe(function() {
        updateClockSubscription(this);
    }, this);

    knockout.getObservable(this, 'clock').subscribe(function() {
        updateClockSubscription(this);
    }, this);

    /**
     * Gets or sets the tableStyle object
     * TODO: add definition for subfields
     * @type {Object}
     */
    knockout.defineProperty(this, 'tableStyle', {
        get : function() {
            return this._tableStyle;
        },
        set : function(value) {
            updateTableStyle(this, value);
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
    type : {
        get : function() {
            return 'csv';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Comma-Separated Values (CSV)';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CsvCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {  //TODO: return metadata if tableDataSource defined
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
     * @memberOf CsvCatalogItem.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return this._regionMapped && !this.keepOnTop;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return this._regionMapped;
        }
    },

    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
     * @memberOf CsvCatalogItem.prototype
     * @type {Object}
     */
    imageryLayer : {
        get : function() {
            return this._imageryLayer;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
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
    updaters : {
        get : function() {
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
    serializers : {
        get : function() {
            return CsvCatalogItem.defaultSerializers;
        }
    },

    /**
     * Gets the data source associated with this catalog item.
     * @memberOf CsvCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return this._tableDataSource;
        }
    },

    /**
     * Gets the concepts that can be used to filter this data, such as Region Type, Age, etc.
     * @type {AbsConcept[]}
     */
    concepts : {
        get : function() {
            if (defined(this.displayVariablesConcept)) {
                return [this.displayVariablesConcept];
            }
            return undefined;
        }
    }
});

CsvCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

CsvCatalogItem.defaultUpdaters.displayVariablesConcept = function(item, json, propertyName, options) {
    // Don't update from JSON.
};

CsvCatalogItem.defaultUpdaters.tableStyle = function(csvItem, json, propertyName, options) {
    csvItem[propertyName] = new TableStyle(json[propertyName]);
};

freezeObject(CsvCatalogItem.defaultUpdaters);

CsvCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

CsvCatalogItem.defaultSerializers.displayVariablesConcept = function(item, json, propertyName) {
    // Don't serialize.
};

CsvCatalogItem.defaultSerializers.tableStyle = function(csvItem, json, propertyName, options) {
    json[propertyName] = csvItem[propertyName].toJSON();
};


CsvCatalogItem.defaultSerializers.legendUrl = function() {
    // Don't serialize, because legends are generated, and sticking an image embedded in a URL is a terrible idea.
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

CsvCatalogItem.prototype._load = function() {
    if (defined(this._tableDataSource)) {
        this._tableDataSource.destroy();
    }

    this._tableDataSource = new TableDataSource();

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
                             'If you believe it is a bug in '+that.terria.appName+', please report it by emailing '+
                            '<a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.'
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

CsvCatalogItem.prototype._enable = function() {
    if (this._regionMapped) {
        this._imageryLayer = ImageryLayerCatalogItem.enableLayer(this, this._createImageryProvider(), this.opacity);

        if (defined( this.terria.leaflet)) {
            var that = this;
            this._imageryLayer.setFilter(function () {
                new L.CanvasFilter(this, {
                    channelFilter: function (image) {
                        return ImageryProviderHooks.recolorImage(image, that._colorFunc);
                    }
                }).render();
            });
        }
    }
};

CsvCatalogItem.prototype._disable = function() {
    if (this._regionMapped) {
        ImageryLayerCatalogItem.disableLayer(this, this._imageryLayer);
        this._imageryLayer = undefined;
    }
};

CsvCatalogItem.prototype._show = function() {
    if (!this._regionMapped) {
        var dataSources =  this.terria.dataSources;
        if (dataSources.contains(this._tableDataSource)) {
            throw new DeveloperError('This data source is already shown.');
        }

        dataSources.add(this._tableDataSource);
    }
    else {
        ImageryLayerCatalogItem.showLayer(this, this._imageryLayer);
    }
};

CsvCatalogItem.prototype._hide = function() {
    if (!this._regionMapped) {
        var dataSources =  this.terria.dataSources;
        if (!dataSources.contains(this._tableDataSource)) {
            throw new DeveloperError('This data source is not shown.');
        }

        dataSources.remove(this._tableDataSource, false);
    }
    else {
        ImageryLayerCatalogItem.hideLayer(this, this._imageryLayer);
    }
};
/**
 * For region-mapped files, enable the WMS imagery layer, with recoloring and feature picking.
*/
CsvCatalogItem.prototype._createImageryProvider = function(time) {
    var imageryProvider = new WebMapServiceImageryProvider({
        url: proxyCatalogItemUrl( this, this._regionProvider.server),
        layers: this._regionProvider.layerName,
        parameters: WebMapServiceCatalogItem.defaultParameters,
        getFeatureInfoParameters: WebMapServiceCatalogItem.defaultParameters,
        tilingScheme: new WebMercatorTilingScheme()
    });

    var that = this;
    ImageryProviderHooks.addRecolorFunc(imageryProvider, this._colorFunc);
    ImageryProviderHooks.addPickFeaturesHook(imageryProvider, function(results) {
        if (!defined(results) || results.length === 0) {
            return;
        }

        for (var i = 0; i < results.length; ++i) {
            var uniqueId = results[i].data.properties[that._regionProvider.uniqueIdProp];
            var properties = that.rowProperties(uniqueId);
            results[i].description = that._tableDataSource.describe(properties);
        }

        return results;
    });


    return imageryProvider;
};

/**
 * Get a row, given a region code.
 */
CsvCatalogItem.prototype.rowProperties = function(uniqueId) {
    var rv = this.tableStyle.regionVariable;
    var row = this._tableDataSource.dataset.variables[rv].getRowByRegionUniqueId(uniqueId);
    if (!defined(row)) {
        return undefined;
    }
    return this._tableDataSource.dataset.getDataRow(row);
};

CsvCatalogItem.prototype.rowPropertiesByCode = function(code) {
    var rv = this.tableStyle.regionVariable;
    var row = this._tableDataSource.dataset.variables[rv].getRowByRegionCode(code);
    if (!defined(row)) {
        return undefined;
    }
    return this._tableDataSource.dataset.getDataRow(row);
};


function updateOpacity(csvItem) {
    if (defined(csvItem._imageryLayer)) {
        if (defined(csvItem._imageryLayer.alpha)) {
            csvItem._imageryLayer.alpha = csvItem.opacity;
        }

        if (defined(csvItem._imageryLayer.setOpacity)) {
            csvItem._imageryLayer.setOpacity(csvItem.opacity);
        }

        csvItem.terria.currentViewer.notifyRepaintRequired();
    }
}

CsvCatalogItem.prototype._redisplay = function() {
    if (defined(this._imageryLayer)) {
        this._hide();
        this._disable();
        this._enable();
        this._show();
    }
};

CsvCatalogItem.prototype.dynamicUpdate = function(text) {
    this.data = text;
    var that = this;

    return when(this.load()).then(function () {
        that._redisplay();
    });
};

function updateClockSubscription(csvItem) {
    if (csvItem.isShown && defined(csvItem.clock) && csvItem._regionMapped) {
        // Subscribe
        if (!defined(csvItem._clockTickSubscription)) {
            csvItem._clockTickSubscription = csvItem.terria.clock.onTick.addEventListener(onClockTick.bind(undefined, csvItem));
        }
    } else {
        // Unsubscribe
        if (defined(csvItem._clockTickSubscription)) {
            csvItem._clockTickSubscription();
            csvItem._clockTickSubscription = undefined;
        }
    }
}
/* Check if we need to display a new set of points/regions due to the time changing. */
function onClockTick(csvItem, clock) {
    if (!csvItem._tableDataSource.dataset.hasTimeData()) {
        return;
    }
    if (!csvItem.isEnabled || !csvItem.isShown) {
        return;
    }
    //check if time has changed
    if (defined(csvItem.lastTime) && JulianDate.equals(clock.currentTime, csvItem.lastTime)) {
        return;
    }
    csvItem.lastTime = clock.currentTime;

    //check if record data has changed
    var activeRows = csvItem._tableDataSource.getDataPointList(clock.currentTime);
    var activeRowsText = JSON.stringify(activeRows);
    if (defined(csvItem.activeRowsText) && activeRowsText === csvItem.activeRowsText) {
        return;
    }
    csvItem.activeRowsText = activeRowsText;

    //redisplay if we have new data
    csvItem.activeRows = activeRows;
    updateRegionMapping(csvItem, csvItem._tableStyle, false);
    csvItem._redisplay();

}
/* Sets up the UI so the user can choose diffferent variables */
function initDisplayVariablesConcept(csvItem) {
    if (csvItem.disableUserChanges) {
        return;
    }
    var source = csvItem._tableDataSource;
    var varNames = source.dataset.getVariableNamesByType([VarType.ALT, VarType.SCALAR, VarType.ENUM, VarType.TIME]);
    if (varNames.length > 0) {
        //create ko dataset for now viewing ui
        var displayVariablesConcept = new DisplayVariablesConcept();
        for (var i = 0; i < varNames.length; i++) {
            displayVariablesConcept.addVariable(varNames[i]);
        }
        displayVariablesConcept.setSelected(source.dataVariable);
        // Not great: at this point there are (at least) three places that the selected variable name is set
        // Which is the source of truth?
        // Note the specs only check the first is set.
        // - csvItem._tableStyle.dataVariable
        // - csvItem._tableDataSource.dataVariable
        // - csvItem._tableDataSource.dataset.selected.data  ( or csvItem._tableDataSource.dataset.getDataVariable() )
        displayVariablesConcept.updateFunction = function (varName) {
            //set new variable and clear var specific styling
            var tableStyle = csvItem._tableStyle;
            tableStyle.dataVariable = varName;
            tableStyle.minDisplayValue = undefined;
            tableStyle.maxDisplayValue = undefined;
            tableStyle.featureInfoFields = undefined;
            tableStyle.legendTicks = 0;
            updateTableStyle(csvItem, tableStyle);

            csvItem.legendUrl = source.getLegendGraphic();
            csvItem.terria.currentViewer.notifyRepaintRequired();
        };
        csvItem.displayVariablesConcept = displayVariablesConcept;
    }
}
/* Creates a new clock from a region-mapped datasource. */
function initClockFromDataSource(csvItem) {
    var source = csvItem._tableDataSource;
    if (!csvItem._regionMapped) {
        return source.clock;
    }
    if (defined(csvItem.clock)) {
        return csvItem.clock;
    }
    if (defined(source) && defined(source.dataset) && source.dataset.hasTimeData()) {
        var newClock = new DataSourceClock();
        newClock.startTime = source.dataset.getTimeMinValue();
        newClock.stopTime = source.dataset.getTimeMaxValue();
        newClock.currentTime = newClock.startTime;
        newClock.multiplier = JulianDate.secondsDifference(newClock.stopTime, newClock.startTime) / 60;
        return newClock;
    }
    return undefined;
}

function finishTableLoad(csvItem) {
    csvItem.clock = initClockFromDataSource(csvItem);
    initDisplayVariablesConcept(csvItem);
    //prepare visuals and repaint
    if (!defined(csvItem.rectangle)) {
        csvItem.rectangle = csvItem._tableDataSource.dataset.getExtent();
    }
    csvItem.legendUrl = csvItem._tableDataSource.getLegendGraphic();
    csvItem.terria.currentViewer.notifyRepaintRequired();
}

function loadTable(csvItem, text) {

    if (defined(csvItem._tableStyle)) {
        // sets .dataVariable and .regionVariable if they were provided.
        csvItem._tableDataSource.setDisplayStyle(csvItem._tableStyle);
    }

    csvItem._tableDataSource.loadText(text);
    var dataset = csvItem._tableDataSource.dataset;
    // If there is specifically a 'lat' and 'lon' column.
    if (dataset.hasLocationData()) {
        if (!defined(csvItem._tableStyle.dataVariable)) {
            csvItem._tableStyle.dataVariable = chooseDataVariable(csvItem);
        }
        finishTableLoad(csvItem);
        return;
    }
    console.log('No lat&lon columns found in csv file - trying to match based on region');
    return RegionProviderList.fromUrl(csvItem.terria.regionMappingDefinitionsUrl)
        .then(function(rm) {
            if (dataset.checkForRegionVariable(rm)) {
                return updateTableStyle(csvItem, initRegionMapStyle(csvItem, rm));
            }
        })
        .then(function() {
            if (csvItem._regionMapped) {
                finishTableLoad(csvItem);
                return;
            }
            throw new ModelError({
                sender: csvItem,
                title: 'Unable to load CSV file',
                message: 'CSV files must contain either: ' +
                         '<ul><li>&nbsp;• "lat" and "lon" fields; or</li>' +
                         '<li>&nbsp;• a region column like "postcode" or "sa4".</li></ul><br/><br/>' +
                         'See <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">the csv-geo-au</a> specification for more.'
                });
        });
}

function chooseDataVariable(csvItem) {
    var tds = csvItem._tableDataSource;
    var dv = tds.dataset.getDataVariableList(true)[0];
    if (defined(dv)) {
        tds.setDataVariable(dv);
    }
    return dv;
}

/* Initialise region map properties. */
function initRegionMapStyle(csvItem, regionProviderList) {
    csvItem._colorFunc = function(id) { return [0,0,0,0]; };

    var dataSource = csvItem._tableDataSource;
    var dataset = dataSource.dataset;
    if (dataset.getRowCount() === 0) {
        return;
    }

    //fill in missing tableStyle settings
    var tableStyle = csvItem._tableStyle || {};
    if (defined(tableStyle.regionType) && defined(tableStyle.regionVariable)) {
        // we have a text description of the provider we want, so go and get it.
        csvItem._regionProvider = regionProviderList.getRegionProvider(tableStyle.regionType);
        // #TODO Support explicit disambig columns.
    } else  {
        // we don't know that region to match, so take an educated guess.
        dataset.checkForRegionVariable(regionProviderList);
        tableStyle.regionVariable = dataset.getRegionVariable();
        csvItem._regionProvider = dataset.getRegionProvider();
        tableStyle.disambigVariable = dataset.getDisambigVariable();
    }
    if (!defined(csvItem._regionProvider)) {
        return;
    }
    if (!defined(tableStyle.dataVariable)) {
        tableStyle.dataVariable = chooseDataVariable(csvItem);
    }
    // if no color map is provided through an init file, use this default colour scheme
    if (!defined(tableStyle.colorMap)) {
        tableStyle.colorMap = ColorMap.fromString(
            'rgba(239,210,193,1.00)-rgba(221,139,116,1.0)-rgba(255,127,46,1.0)-rgba(255,65,43,1.0)-rgba(111,0,54,1.0)');
        tableStyle.legendTicks = 3;
    }
    return tableStyle;
}

/* Set tableStyle property and redraw */
function updateTableStyle(csvItem, tableStyle) {

    csvItem._tableStyle = tableStyle;

    if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    csvItem._tableDataSource.setDisplayStyle(csvItem._tableStyle);

    if (!defined(csvItem._regionProvider) || !defined(csvItem._tableStyle.regionVariable)) {
        return;
    }
    var regionProvider = csvItem._regionProvider;
    return regionProvider.loadRegionIDs()
        .then(function(requiredReload) {
            updateRegionMapping(csvItem, tableStyle, requiredReload !== false);
            csvItem._redisplay();
        });
}


function updateRegionMapping(csvItem, tableStyle, showFeedback) {
function displayFeedback (results, regionVariable, itemName, terria) {

    var msg = "";
    if (Object.keys(results.failedMatches).length > 0) {
        msg += 'These region names were <span class="warning-text">not recognised</span>: <br><br/>' +
        '<samp>' + Object.keys(results.failedMatches).join('</samp>, <samp>') + '</samp>' +
        '<br/><br/>';
    }
    if (Object.keys(results.ambiguousMatches).length > 0) {
        msg += 'These regions had <span class="warning-text">more than one value</span>: <br/><br/>' +
        '<samp>' + Object.keys(results.ambiguousMatches).join("</samp>, <samp>") + '</samp>' +
        '<br/><br/>';
    }
    if (!msg) {
        console.log(results.successes  + ' out of ' + results.totalRows + ' "' + regionVariable + '" regions matched successfully in ' + itemName);
        return;
    }
    msg = "" + results.successes + " out of " + results.totalRows + " '<samp>" + regionVariable + "</samp>' regions matched.<br/><br/>" + msg;
    msg += 'Consult the <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">CSV-geo-au specification</a> to see how to format the CSV file.';

    var error = new ModelError({
            title: "Issues loading CSV file: " + itemName.slice(0,20), // Long titles mess up the message body
            message: '<div>'+ msg +'</div>'
        });
    if (results.successes === 0) {
        // No rows matched, so abort - don't add it to catalogue at all.
        throw error;
    } else {
        // Just warn the user. Ideally we'd avoid showing the warning when switching between columns.
        terria.error.raiseEvent(error);
    }

}


    var results = csvItem._regionProvider.getRegionValues(csvItem._tableDataSource.dataset, tableStyle.regionVariable, tableStyle.disambigVariable, csvItem.activeRows); // ok if activeRows is undefined
    if (showFeedback && csvItem.showWarnings) {
        displayFeedback(results, tableStyle.regionVariable, csvItem.name, csvItem.terria);
    }

    csvItem._colorFunc = csvItem._regionProvider.getColorLookupFunc(results.regionValues, csvItem._tableDataSource._mapValue2Color.bind(csvItem._tableDataSource));
    csvItem._regionMapped = true;
}

module.exports = CsvCatalogItem;

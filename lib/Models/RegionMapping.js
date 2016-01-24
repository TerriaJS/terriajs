/*global require*/
"use strict";

var L = require('leaflet');

// var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
// var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
// var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var arraysAreEqual = require('../Core/arraysAreEqual');
var getUniqueValues = require('../Core/getUniqueValues');
var ImageryProviderHooks = require('../Map/ImageryProviderHooks');
var LegendHelper = require('../Map/LegendHelper');
var ModelError = require('../Models/ModelError');
var RegionProviderList = require('../Map/RegionProviderList');
var TableStructure = require('../Core/TableStructure');
var TableStyle = require('../Models/TableStyle');
var VarType = require('../Map/VarType');

// Used for region mapping
var WebMapServiceImageryProvider = require('terriajs-cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var ImageryLayerCatalogItem = require('../Models/ImageryLayerCatalogItem');
var ImageryProviderHooks = require('../Map/ImageryProviderHooks');
var proxyCatalogItemUrl = require('../Models/proxyCatalogItemUrl');
var TileLayerFilter = require('../ThirdParty/TileLayer.Filter');
var WebMapServiceCatalogItem = require('../Models/WebMapServiceCatalogItem');

// TileLayerFilter.initialize adds the 'setFilter' method to CesiumTileLayer
// which is returned by ImageryLayerCatalogItem.enableLayer and used as _imageryLayer with leaflet.
TileLayerFilter.initialize(L);

/**
* A DataSource for table-based data.
* Handles the graphical display of lat-lon and region-mapped datasets.
* For lat-lon data sets, each row is taken to be a feature. RegionMapping generates Cesium entities for each row.
* For region-mapped data sets, each row is a region. The regions are displayed using a WMS imagery layer.
* Displaying the points or regions requires a legend.
*
* @name RegionMapping
*
* @alias RegionMapping
* @constructor
* TODO:
* @param {CatalogItem} [catalogItem] The CatalogItem instance. Required for region mapping only.
*/
var RegionMapping = function(catalogItem, tableStructure, tableStyle) {
    this._tableStructure = defined(tableStructure) ? tableStructure : new TableStructure();
    this._tableStyle = tableStyle;  // Can be undefined.
    this._legendHelper = undefined;
    this._legendUrl = undefined;
    this._extent = undefined;
    this.loadingData = false;

    this._catalogItem = catalogItem;
    this._regionMappingDefinitionsUrl = defined(catalogItem) ? catalogItem.terria.configParameters.regionMappingDefinitionsUrl : undefined;
    this._regionDetails = undefined; // For caching the region details.
    this._regionImageryLayer = undefined;
    this._hadImageryAtLayerIndex = undefined;
    this._regionImageryProvider = undefined;
    this._clockTickSubscription = undefined; // For time-varying region-mapped csvs only.
    this._previousRegionIndices = undefined; // For time-varying region-mapped csvs only. Only redraws regions if they've changed.
    this._hasDisplayedFeedback = false; // So that we only show the feedback once.

    // Track _tableStructure so that csvCatalogItem's concepts are maintained.
    // Track _legendUrl so that csvCatalogItem can update the legend if it changes.
    // Track _regionDetails so that when it is discovered that region mapping applies,
    //       it updates the legendHelper via activeItems, and csvCatalogItem properties like supportsReordering.
    knockout.track(this, ['_tableStructure', '_legendUrl', '_regionDetails']);

    // Whenever the active item is changed, recalculate the legend and the display of all the entities.
    // This is triggered both on deactivation and on reactivation, ie. twice per change; it would be nicer to trigger once.
    knockout.getObservable(this._tableStructure, 'activeItems').subscribe(changedActiveItems.bind(null, this), this);
};

defineProperties(RegionMapping.prototype, {
   /**
     * Gets the clock settings defined by the loaded data.  If
     * only static data exists, this value is undefined.
     * @memberof RegionMapping.prototype
     * @type {DataSourceClock}
     */
   clock : {
        get : function() {
            var timeColumn = this._tableStructure.columnsByType[VarType.TIME][0];
            if (defined(timeColumn)) {
                return timeColumn.clock;
            }
        }
    },
    /**
     * Gets the collection of {@link Entity} instances.
     * @memberof RegionMapping.prototype
     * @type {EntityCollection}
     */
   entities : {
        get : function() {
            return this._entityCollection;
        }
    },
    /**
     * Gets a value indicating if the data source is currently loading data.
     * @memberof RegionMapping.prototype
     * @type {Boolean}
     */
   isLoading : {
        get : function() {
            return this.loadingData;
        }
    },
    /**
     * Gets a CesiumEvent that will be raised when the underlying data changes.
     * @memberof RegionMapping.prototype
     * @type {CesiumEvent}
     */
   changedEvent : {
        get : function() {
            return this._changed;
        }
    },
    /**
     * Gets a CesiumEvent that will be raised if an error is encountered during processing.
     * @memberof RegionMapping.prototype
     * @type {CesiumEvent}
     */
   errorEvent : {
        get : function() {
            return this._error;
        }
    },
    /**
     * Gets a CesiumEvent that will be raised when the data source either starts or stops loading.
     * @memberof RegionMapping.prototype
     * @type {CesiumEvent}
     */
    loadingEvent : {
        get : function() {
            return this._loading;
        }
    },

    /**
     * Gets the TableStructure object holding all the data.
     * @memberof RegionMapping.prototype
     * @type {TableStructure}
     */
    tableStructure : {
        get : function() {
            return this._tableStructure;
        }
    },

    /**
     * Gets the TableStyle object showing how to style the data.
     * @memberof RegionMapping.prototype
     * @type {TableStyle}
     */
    tableStyle : {
        get : function() {
            return this._tableStyle;
        }
    },

    /**
     * Gets a Rectangle covering the extent of the data, based on lat & lon columns. (It could be based on regions too eventually.)
     * @type {Rectangle}
     */
    extent: {
        get: function() {
            return this._extent;
        }
    },

    /**
     * Gets a URL for the legend for this data.
     * @type {String}
     */
    legendUrl: {
        get: function() {
            return this._legendUrl;
        }
    },

    /**
     * Once loaded, gets the region details (an array of "regionDetail" objects, with regionProvider, column and disambigColumn properties).
     * By checking if defined, can be used as the region-mapping equivalent to "hasLatitudeAndLongitude".
     * @type {Object[]}
     */
    regionDetails: {
        get: function() {
            return this._regionDetails;
        }
    },

    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * Used in region mapping only.
     * This property is undefined if the data source is not enabled.
     * @memberOf RegionMapping.prototype
     * @type {Object}
     */
    regionImageryLayer : {
        get : function() {
            return this._regionImageryLayer;
        }
    }

});


/**
 * Loads and sets up the RegionMapping from a csv string and a TableStyle object, replacing any existing data.
 * Checks the RegionMapping for lat/lon columns, region columns, and time columns.
 * TODO:
 * @param {String} csvString The text to be processed.
 * @param {TableStyle} [tableStyle] The table style for this table.
 */
RegionMapping.create = function(tableStructure, tableStyle) {
    if (defined(tableStyle) && !(tableStyle instanceof TableStyle)) {
        throw new DeveloperError('Please pass a TableStyle object.');
    }
    var regionMapping = new RegionMapping(tableStructure, tableStyle);
    this.activateColumnFromTableStyle();
    ensureActiveColumn(tableStructure);
    return regionMapping;

        // If it doesn't, it may be a region mapped csv.
        return this.loadRegionDetails().then(function(regionDetails) {
            if (regionDetails) {
                ensureActiveColumn(tableStructure); // This needed to wait until we know which column is the region.
            } else {
                console.log('No lat & lon or regional columns found in csv file.');
            }
        });
};



/**
 * Activates the column specified in the table style's "dataVariable" parameter, if any.
 */
RegionMapping.prototype.activateColumnFromTableStyle = function() {
    var tableStyle = this._tableStyle;
    if (defined(tableStyle) && defined(tableStyle.dataVariable)) {
        var columnToActivate = this._tableStructure.getColumnWithName(tableStyle.dataVariable);
        if (columnToActivate) {
            columnToActivate.toggleActive();
        }
    }
};

/**
 * Set the region column type. Note this is on the class RegionMapping itself, not on an instance.
 * Currently we only use the first possible region column, and leave any others as they are.
 * @param {Object[]} regionDetails The data source's regionDetails array.
 */
RegionMapping.setRegionColumnType = function(regionDetails) {
    var regionDetail = regionDetails[0];
    console.log('Found region match based on ' + regionDetail.column.name + (defined(regionDetail.disambigColumn) ? (' and ' + regionDetail.disambigColumn.name) : ''));
    regionDetail.column.type = VarType.REGION;
    if (defined(regionDetail.disambigColumn)) {
        regionDetail.disambigColumn.type = VarType.REGION;
    }
};

function reviseLegendHelper(dataSource) {
    // Currently we only use the first possible region column.
    var activeColumn = dataSource._tableStructure.activeItems[0];
    var regionProvider = defined(dataSource._regionDetails) ? dataSource._regionDetails[0].regionProvider : undefined;
    dataSource._legendHelper = new LegendHelper(activeColumn, dataSource._tableStyle, regionProvider);
    dataSource._legendUrl = dataSource._legendHelper.legendUrl();
}

/**
 * Call when the active column changes, or when the table data source is first shown.
 * Generates a LegendHelper.
 * For lat/lon files, updates entities and extent.
 * For region files, rebuilds and redisplays the regionImageryLayer.
 */
function changedActiveItems(dataSource) {
    reviseLegendHelper(dataSource);
    if (defined(dataSource._regionDetails)) {
        if (defined(dataSource._regionImageryLayer) || defined(dataSource._hadImageryAtLayerIndex)) {
            redisplayRegions(dataSource);
            if (defined(dataSource._regionImageryLayer) && !defined(dataSource._regionDetails)) {
                // In this case, the region mapping was on, but has been switched off, so disable the imagery layer.
                // Record the fact so that we know to turn it on again if active items change again.
                // dataSource._regionImageryLayer._layerIndex is not always defined, so use "true" in that case.
                dataSource._hadImageryAtLayerIndex = dataSource._regionImageryLayer._layerIndex;  // Would prefer not to access an internal variable of imageryLayer.
                if (!defined(dataSource._hadImageryAtLayerIndex)) {
                    dataSource._hadImageryAtLayerIndex = true;
                }
                ImageryLayerCatalogItem.hideLayer(dataSource._catalogItem, dataSource._regionImageryLayer);
                ImageryLayerCatalogItem.disableLayer(dataSource._catalogItem, dataSource._regionImageryLayer);
                dataSource._regionImageryLayer = undefined;
            }
        }
    }
}

// The functions enable, disable, show and hide are required for region mapping.
RegionMapping.prototype.enable = function(layerIndex) {
    var that = this;
    if (defined(this._regionDetails)) {
        updateClockSubscription(that);
        setNewRegionImageryLayer(that, layerIndex);
    }
};

RegionMapping.prototype.disable = function() {
    var that = this;
    if (defined(this._regionDetails)) {
        updateClockSubscription(that);
        ImageryLayerCatalogItem.disableLayer(that._catalogItem, that._regionImageryLayer);
        that._regionImageryLayer = undefined;
    }
};

RegionMapping.prototype.show = function() {
    var that = this;
    if (defined(this._regionDetails)) {
        updateClockSubscription(that);
        ImageryLayerCatalogItem.showLayer(that._catalogItem, that._regionImageryLayer);
    } else {
        var dataSources = that._catalogItem.terria.dataSources;
        if (dataSources.contains(that)) {
            throw new DeveloperError('This data source is already shown.');
        }
        dataSources.add(that);
    }
};

RegionMapping.prototype.hide = function() {
    var that = this;
    if (defined(this._regionDetails)) {
        updateClockSubscription(that);
        ImageryLayerCatalogItem.hideLayer(that._catalogItem, that._regionImageryLayer);
    } else {
        var dataSources = that._catalogItem.terria.dataSources;
        if (!dataSources.contains(that)) {
            throw new DeveloperError('This data source is not shown.');
        }
        dataSources.remove(that, false);
    }
};

RegionMapping.prototype.updateOpacity = function(opacity) {
    if (defined(this._regionImageryLayer)) {
        if (defined(this._regionImageryLayer.alpha)) {
            this._regionImageryLayer.alpha = opacity;
        }

        if (defined(this._regionImageryLayer.setOpacity)) {
            this._regionImageryLayer.setOpacity(opacity);
        }
    }
};

function ensureActiveColumn(tableStructure) {
    // Find and activate the first SCALAR or ENUM column, if no columns are active.
    if (tableStructure.activeItems.length === 0) {
        var suitableColumns = tableStructure.columns.filter(function(col) {
            return ([VarType.SCALAR, VarType.ENUM].indexOf(col.type) >= 0);
        });
        if (suitableColumns.length > 0) {
            suitableColumns[0].toggleActive();
        }
    }
}

/**
 * Builds a promise which resolves to either:
 *   undefined if no regions;
 *   An array of objects with regionProvider, column and disambigColumn properties.
 * It also caches this object in dataSource._regionDetails.
 *
 * The steps involved are:
 * 0. Wait for the data to be ready, if needed. (For loaded csvs, this is trivially true, but it might be constructed elsewhere.)
 * 1. Get the region provider list (asynchronously).
 * 2. Use this list to find all the possible region identifiers for this table, eg. 'postcode' or 'sa4_code'.
 *    If the user specified a prefered region variable name/type, put this to the front of the list.
 *    Elsewhere, we only offer the user the first region mapping possibility.
 * 3. Load the region ids of each possible region identifier (asynchronously), eg. ['2001', '2002', ...].
 * 4. Once all of these are known, cache and return all the details of all the possible region mapping approaches.
 *
 * These steps are sequenced using a series of promise.thens, so that the caller only sees a promise resolving to the end result.
 *
 * It is safe to call this multiple times, as each asynchronous call returns a cached promise if it exists.
 *
 * @return {Promise} The promise.
 */
RegionMapping.prototype.loadRegionDetails = function() {
    var dataSource = this;
    if (!dataSource._regionMappingDefinitionsUrl) {
        return when();
    }
    // RegionProviderList.fromUrl returns a cached version if available.
    return RegionProviderList.fromUrl(dataSource._regionMappingDefinitionsUrl).then(function(regionProviderList) {
        var targetRegionVariableName, targetRegionType;
        if (defined(dataSource._tableStyle)) {
            targetRegionVariableName = dataSource._tableStyle.regionVariable;
            targetRegionType = dataSource._tableStyle.regionType;
        }
        // We have a region provider list, now get the region provider and load its region ids (another async job).
        // Provide the user-specified region variable name and type. If specified, getRegionDetails will return them as the first object in the returned array.
        var rawRegionDetails = regionProviderList.getRegionDetails(dataSource._tableStructure.getColumnNames(), targetRegionVariableName, targetRegionType);
        if (rawRegionDetails.length > 0) {
            return loadRegionIds(dataSource, rawRegionDetails);
        }
        return when(); // Nothing more to return.
    });
};

function loadRegionIds(dataSource, rawRegionDetails) {
    var promises = rawRegionDetails.map(function(rawRegionDetail) { return rawRegionDetail.regionProvider.loadRegionIDs(); });
    return when.all(promises).then(function() {
        // Cache the details in a nicer format, storing the actual columns rather than just the column names.
        dataSource._regionDetails = rawRegionDetails.map(function(rawRegionDetail) {
            return {
                regionProvider: rawRegionDetail.regionProvider,
                column: dataSource._tableStructure.getColumnWithName(rawRegionDetail.variableName),
                disambigColumn: dataSource._tableStructure.getColumnWithName(rawRegionDetail.disambigVariableName),
            };
        });
        return dataSource._regionDetails;
    }).otherwise(function(e) {
        console.log('error loading region ids', e);
    });
}



/**
 * Returns an array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 * Takes the current time into account if there is a time column and _avalabilities is defined.
 *
 * @param {RegionMapping} dataSource The table data source.
 * @param {Clock} [clock] The terria clock. (NOT dataSource._clock, which does not show the same time (and is a DataSourceClock).
 * @param {Array} [failedMatches] An optional empty array. If provided, indices of failed matches are appended to the array.
 * @param {Array} [ambiguousMatches] An optional empty array. If provided, indices of matches which duplicate prior matches are appended to the array.
 * @return {Array} An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 */
function calculateRegionIndices(dataSource, clock, failedMatches, ambiguousMatches) {
    // As described in load, currently we only use the first possible region column.
    var regionDetail = dataSource._regionDetails[0];
    var tableStructure = dataSource._tableStructure;
    var regionColumnValues = regionDetail.column.values;
    // Wipe out the region names from the rows that do not apply at this time, if there is a time column.
    var timeColumn = tableStructure.columnsByType[VarType.TIME][0];
    if (defined(timeColumn) && timeColumn.availabilities) {
        regionColumnValues = regionColumnValues.map(function(value, index) {
            return (timeColumn.availabilities[index].contains(clock.currentTime) ? value : undefined);
        });
    }
    // regionIndices will be an array the same length as regionProvider.regions, giving the index of each region into the table.
    var regionIndices = regionDetail.regionProvider.mapRegionsToIndicesInto(
        regionColumnValues,
        defined(regionDetail.disambigColumn) ? regionDetail.disambigColumn.values : undefined,
        failedMatches,
        ambiguousMatches
    );
    return regionIndices;
}

function getRegionValuesFromIndices(regionIndices, tableStructure) {
    var regionValues = regionIndices;  // Appropriate if no active column: color each region according to its index into the table.
    if (tableStructure.activeItems.length > 0) {
        var activeColumn = tableStructure.activeItems[0];
        regionValues = regionIndices.map(function(i) { return activeColumn.values[i]; });
        if (activeColumn.usesIndicesIntoUniqueValues) {
            // Convert the region's value to an index into the uniqueValues array.
            regionValues = regionValues.map(function(value) { return activeColumn.uniqueValues.indexOf(value); });
        }
    }
    return regionValues;
}

/**
 * Creates and enables a new ImageryLayer onto terria, showing appropriately colored regions with feature descriptions.
 *
 * @param {RegionMapping} dataSource    The table data source.
 * @param {Number} [layerIndex] The layer index of the new imagery layer.
 * @param {Array} [regionIndices] An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 *                  If not provided, it is calculated, and failed/ambiguous warnings are displayed to the user.
 */
function setNewRegionImageryLayer(dataSource, layerIndex, regionIndices) {
    var catalogItem = dataSource._catalogItem;
    var regionDetail = dataSource._regionDetails[0];
    var legendHelper = dataSource._legendHelper;
    var tableStructure = dataSource._tableStructure;
    var failedMatches, ambiguousMatches;
    if (!defined(regionIndices)) {
        failedMatches = [];
        ambiguousMatches = [];
        regionIndices = calculateRegionIndices(dataSource, dataSource._catalogItem.terria.clock, failedMatches, ambiguousMatches);
        if (!dataSource._hasDisplayedFeedback) {
            dataSource._hasDisplayedFeedback = true;
            displayFailedAndAmbiguousMatches(dataSource, failedMatches, ambiguousMatches);
        }
    }
    var regionValues = getRegionValuesFromIndices(regionIndices, tableStructure);

    // Recolor the regions, and add feature descriptions.
    var regionImageryProvider = new WebMapServiceImageryProvider({
        url: proxyCatalogItemUrl(catalogItem, regionDetail.regionProvider.server),
        layers: regionDetail.regionProvider.layerName,
        parameters: WebMapServiceCatalogItem.defaultParameters,
        getFeatureInfoParameters: WebMapServiceCatalogItem.defaultParameters,
        tilingScheme: new WebMercatorTilingScheme()
    });
    var colorFunction = regionDetail.regionProvider.getColorLookupFunc(
        regionValues,
        legendHelper.getColorArrayFromValue.bind(legendHelper)
    );
    ImageryProviderHooks.addRecolorFunc(regionImageryProvider, colorFunction);
    // Put the description of this row onto the image of the region.
    var rowDescriptions = tableStructure.toRowDescriptions(dataSource._tableStyle.featureInfoFields);
    var regionRowDescriptions = regionIndices.map(function(i) { return rowDescriptions[i]; });
    ImageryProviderHooks.addPickFeaturesHook(regionImageryProvider, function(results) {
        if (!defined(results) || results.length === 0) {
            return;
        }
        for (var i = 0; i < results.length; ++i) {
            var uniqueId = results[i].data.properties[regionDetail.regionProvider.uniqueIdProp];
            results[i].description = regionRowDescriptions[uniqueId];
        }
        return results;
    });

    dataSource._regionImageryLayer = ImageryLayerCatalogItem.enableLayer(catalogItem, regionImageryProvider, catalogItem.opacity, layerIndex);
    if (defined(catalogItem.terria.leaflet) && colorFunction) {
        dataSource._regionImageryLayer.setFilter(function () {
            new L.CanvasFilter(this, {
                channelFilter: function (image) {
                    return ImageryProviderHooks.recolorImage(image, colorFunction);
                }
            }).render();
        });
    }
}

/**
 * Update the region imagery layer, eg. when the active variable changes, or the time changes.
 * Following previous practice, when the coloring needs to change, the item is hidden, disabled, then re-enabled and re-shown.
 * So, a new imagery layer is created (during 'enable') each time its coloring changes.
 * It would look less flickery to reuse the existing one, but when I tried, I found the recoloring doesn't get used.
 *
 * @param  {RegionMapping} dataSource The data source.
 * @param  {Array} [regionIndices] Passed into setNewRegionImageryLayer. Saves recalculating it if available.
 */
function redisplayRegions(dataSource, regionIndices) {
    if (defined(dataSource._regionDetails)) {
        // We are using _hadImageryAtLayerIndex = true to mean it had an ImageryLayer, but its layer was undefined.
        // _hadImageryAtLayerIndex = undefined means it did not have an ImageryLayer.
        var layerIndex = dataSource._hadImageryAtLayerIndex === true ? undefined : dataSource._hadImageryAtLayerIndex;
        if (defined(dataSource._regionImageryLayer)) {
            layerIndex = dataSource._regionImageryLayer._layerIndex;  // Would prefer not to access an internal variable of imageryLayer.
            ImageryLayerCatalogItem.hideLayer(dataSource._catalogItem, dataSource._regionImageryLayer);
            ImageryLayerCatalogItem.disableLayer(dataSource._catalogItem, dataSource._regionImageryLayer);
            dataSource._regionImageryLayer = undefined;
        }
        setNewRegionImageryLayer(dataSource, layerIndex, regionIndices);
        ImageryLayerCatalogItem.showLayer(dataSource._catalogItem, dataSource._regionImageryLayer);
    }
}

function onClockTick(dataSource, clock) {
    // Check if record data has changed.
    var regionIndices = calculateRegionIndices(dataSource, clock);
    if (arraysAreEqual(dataSource._previousRegionIndices, regionIndices)) {
        return;
    }
    dataSource._previousRegionIndices = regionIndices;

    redisplayRegions(dataSource, regionIndices);
}

function updateClockSubscription(dataSource) {
    // Only if there is a clock.
    if (!defined(dataSource._clock)) {
        return;
    }
    var catalogItem = dataSource._catalogItem;
    if (!catalogItem.isEnabled || !catalogItem.isShown) {
        if (defined(dataSource._clockTickSubscription)) {
            // Unsubscribe
            dataSource._clockTickSubscription();
            dataSource._clockTickSubscription = undefined;
        }
    } else {
        if (!defined(dataSource._clockTickSubscription)) {
            // We listen to the terria clock instead of our clock. Our clock does not actually advance, so doesn't show the same time.
            dataSource._clockTickSubscription = catalogItem.terria.clock.onTick.addEventListener(onClockTick.bind(undefined, dataSource));
        }
    }
}


function displayFailedAndAmbiguousMatches(dataSource, failedMatches, ambiguousMatches) {
    var msg = "";
    var regionDetail = dataSource._regionDetails[0];
    var regionColumnValues = regionDetail.column.values;
    var timeColumn = dataSource._tableStructure.columnsByType[VarType.TIME][0];

    if (failedMatches.length > 0) {
        var failedNames = failedMatches.map(function(indexOfFailedMatch) { return regionColumnValues[indexOfFailedMatch]; });
        msg += 'These region names were <span class="warning-text">not recognised</span>: <br><br/>' +
        '<samp>' + failedNames.join('</samp>, <samp>') + '</samp>' +
        '<br/><br/>';
    }
    // Only show ambiguous matches if there is no time column.
    // There could still be ambiguous matches, but our code doesn't calculate that.
    if ((ambiguousMatches.length > 0) && !defined(timeColumn)) {
        var ambiguousNames = ambiguousMatches.map(function(indexOfAmbiguousMatch) { return regionColumnValues[indexOfAmbiguousMatch]; });
        msg += 'These regions had <span class="warning-text">more than one value</span>: <br/><br/>' +
        '<samp>' + getUniqueValues(ambiguousNames).join('</samp>, <samp>') + '</samp>' +
        '<br/><br/>';
    }
    if (msg) {
        msg += 'Consult the <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">CSV-geo-au specification</a> to see how to format the CSV file.';

        var error = new ModelError({
            title: "Issues loading CSV file: " + dataSource._catalogItem.name.slice(0, 20), // Long titles mess up the message body.
            message: '<div>'+ msg +'</div>'
        });
        if (failedMatches.length === regionColumnValues.length) {
            // Every row failed, so abort - don't add it to catalogue at all.
            throw error;
        } else {
            // Just warn the user. Ideally we'd avoid showing the warning when switching between columns.
            dataSource._catalogItem.terria.error.raiseEvent(error);
        }
    }
}

/**
* Destroy the object and release resources
*
*/
RegionMapping.prototype.destroy = function() {
    // Do we need to explicitly unsubscribe from the clock?
    return destroyObject(this);
};

module.exports = RegionMapping;

/*global require*/
"use strict";

var arraysAreEqual = require('../Core/arraysAreEqual');
var CallbackProperty = require('terriajs-cesium/Source/DataSources/CallbackProperty');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getUniqueValues = require('../Core/getUniqueValues');
var ImageryLayerCatalogItem = require('../Models/ImageryLayerCatalogItem');
var ImageryProviderHooks = require('../Map/ImageryProviderHooks');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var L = require('leaflet');
var LegendHelper = require('../Models/LegendHelper');
var proxyCatalogItemUrl = require('../Models/proxyCatalogItemUrl');
var RegionProviderList = require('../Map/RegionProviderList');
var TableStructure = require('../Map/TableStructure');
var TableStyle = require('../Models/TableStyle');
var TerriaError = require('../Core/TerriaError');
var TileLayerFilter = require('../ThirdParty/TileLayer.Filter');
var VarType = require('../Map/VarType');
var WebMapServiceCatalogItem = require('../Models/WebMapServiceCatalogItem');
var WebMapServiceImageryProvider = require('terriajs-cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var when = require('terriajs-cesium/Source/ThirdParty/when');

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
* @param {CatalogItem} [catalogItem] The CatalogItem instance.
* @param {TableStructure} [tableStructure] The Table Structure instance; defaults to a new one.
* @param {TableStyle} [tableStyle] The table style; defaults to undefined.
*/
var RegionMapping = function(catalogItem, tableStructure, tableStyle) {
    this._tableStructure = defined(tableStructure) ? tableStructure : new TableStructure();
    if (defined(tableStyle) && !(tableStyle instanceof TableStyle)) {
        throw new DeveloperError('Please pass a TableStyle object.');
    }
    this._tableStyle = tableStyle;  // Can be undefined.
    this._changed = new CesiumEvent();
    this._legendHelper = undefined;
    this._legendUrl = undefined;
    this._extent = undefined;
    this._loadingData = false;

    this._catalogItem = catalogItem;
    this._regionMappingDefinitionsUrl = defined(catalogItem) ? catalogItem.terria.configParameters.regionMappingDefinitionsUrl : undefined;
    this._regionDetails = undefined; // For caching the region details.
    this._imageryLayer = undefined;
    this._hadImageryAtLayerIndex = undefined;
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
   clock: {
        get: function() {
            var timeColumn = this._tableStructure.activeTimeColumn;
            if (defined(timeColumn)) {
                return timeColumn.clock;
            }
        }
    },
    /**
     * Gets a CesiumEvent that will be raised when the underlying data changes.
     * @memberof RegionMapping.prototype
     * @type {CesiumEvent}
     */
   changedEvent: {
        get: function() {
            return this._changed;
        }
    },

    /**
     * Gets or sets a value indicating if the data source is currently loading data.
     * Whenever loadingData is changed to false, also trigger a redraw.
     * @memberof RegionMapping.prototype
     * @type {Boolean}
     */
   isLoading: {
        get: function() {
            return this._loadingData;
        },
        set: function(value) {
            this._loadingData = value;
            if (!value) {
                changedActiveItems(this);
            }
        }
    },

    /**
     * Gets the TableStructure object holding all the data.
     * @memberof RegionMapping.prototype
     * @type {TableStructure}
     */
    tableStructure: {
        get : function() {
            return this._tableStructure;
        }
    },

    /**
     * Gets the TableStyle object showing how to style the data.
     * @memberof RegionMapping.prototype
     * @type {TableStyle}
     */
    tableStyle: {
        get: function() {
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
     * This property is undefined if the data source is not enabled.
     * @memberOf RegionMapping.prototype
     * @type {Object}
     */
    imageryLayer: {
        get: function() {
            return this._imageryLayer;
        }
    },

    /**
     * Gets a Boolean value saying whether the region mapping is constant (true) or time-varying (false).
     * @memberOf RegionMapping.prototype
     * @type {Boolean}
     */
    isConstant: {
        get: function() {
            var timeColumn = this._tableStructure.activeTimeColumn;
            return (!defined(timeColumn) || !defined(timeColumn._clock));
        }
    }

});

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

/**
 * Explictly hide the imagery layer (if any).
 */
RegionMapping.prototype.hideImageryLayer = function() {
    // In this case, the region mapping was on, but has been switched off, so disable the imagery layer.
    // Record the fact so that we know to turn it on again if active items change again.
    // regionMapping._imageryLayer._layerIndex is not always defined, so use "true" in that case.
    var regionMapping = this;
    if (defined(this._imageryLayer)) {
        regionMapping._hadImageryAtLayerIndex = regionMapping._imageryLayer._layerIndex;  // Would prefer not to access an internal variable of imageryLayer.
        if (!defined(regionMapping._hadImageryAtLayerIndex)) {
            regionMapping._hadImageryAtLayerIndex = true;
        }
        ImageryLayerCatalogItem.hideLayer(regionMapping._catalogItem, regionMapping._imageryLayer);
        ImageryLayerCatalogItem.disableLayer(regionMapping._catalogItem, regionMapping._imageryLayer);
        regionMapping._imageryLayer = undefined;
    }
};

function reviseLegendHelper(regionMapping) {
    // Currently we only use the first possible region column.
    var activeColumn = regionMapping._tableStructure.activeItems[0];
    var regionProvider = defined(regionMapping._regionDetails) ? regionMapping._regionDetails[0].regionProvider : undefined;
    regionMapping._legendHelper = new LegendHelper(activeColumn, regionMapping._tableStyle, regionProvider, regionMapping._catalogItem.name);
    regionMapping._legendUrl = regionMapping._legendHelper.legendUrl();
}

/**
 * Call when the active column changes, or when the table data source is first shown.
 * Generates a LegendHelper.
 * For lat/lon files, updates entities and extent.
 * For region files, rebuilds and redisplays the imageryLayer.
 * @private
 */
function changedActiveItems(regionMapping) {
    reviseLegendHelper(regionMapping);
    if (defined(regionMapping._regionDetails) && !regionMapping._loadingData) {
        if (defined(regionMapping._imageryLayer) || defined(regionMapping._hadImageryAtLayerIndex)) {
            redisplayRegions(regionMapping);
            if (defined(regionMapping._imageryLayer) && !defined(regionMapping._regionDetails)) {
                regionMapping.hideImageryLayer();
            }
        }
        regionMapping._changed.raiseEvent(regionMapping);
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
        ImageryLayerCatalogItem.disableLayer(that._catalogItem, that._imageryLayer);
        that._imageryLayer = undefined;
    }
};

RegionMapping.prototype.show = function() {
    var that = this;
    if (defined(this._regionDetails)) {
        updateClockSubscription(that);
        ImageryLayerCatalogItem.showLayer(that._catalogItem, that._imageryLayer);
    }
};

RegionMapping.prototype.hide = function() {
    var that = this;
    if (defined(this._regionDetails)) {
        updateClockSubscription(that);
        ImageryLayerCatalogItem.hideLayer(that._catalogItem, that._imageryLayer);
    }
};

RegionMapping.prototype.updateOpacity = function(opacity) {
    if (defined(this._imageryLayer)) {
        if (defined(this._imageryLayer.alpha)) {
            this._imageryLayer.alpha = opacity;
        }
        if (defined(this._imageryLayer.setOpacity)) {
            this._imageryLayer.setOpacity(opacity);
        }
    }
};

/**
 * Builds a promise which resolves to either:
 *   undefined if no regions;
 *   An array of objects with regionProvider, column and disambigColumn properties.
 * It also caches this object in regionMapping._regionDetails.
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
    var regionMapping = this;
    if (!regionMapping._regionMappingDefinitionsUrl) {
        return when();
    }
    // RegionProviderList.fromUrl returns a cached version if available.
    return RegionProviderList.fromUrl(regionMapping._regionMappingDefinitionsUrl, this._catalogItem.terria.corsProxy).then(function(regionProviderList) {
        var targetRegionVariableName, targetRegionType;
        if (defined(regionMapping._tableStyle)) {
            targetRegionVariableName = regionMapping._tableStyle.regionVariable;
            targetRegionType = regionMapping._tableStyle.regionType;
        }
        // We have a region provider list, now get the region provider and load its region ids (another async job).
        // Provide the user-specified region variable name and type. If specified, getRegionDetails will return them as the first object in the returned array.
        var rawRegionDetails = regionProviderList.getRegionDetails(regionMapping._tableStructure.getColumnNames(), targetRegionVariableName, targetRegionType);
        if (rawRegionDetails.length > 0) {
            return loadRegionIds(regionMapping, rawRegionDetails);
        }
        return when(); // Nothing more to return.
    });
};

// Loads region ids from the region providers, and returns the region details.
function loadRegionIds(regionMapping, rawRegionDetails) {
    var promises = rawRegionDetails.map(function(rawRegionDetail) { return rawRegionDetail.regionProvider.loadRegionIDs(); });
    return when.all(promises).then(function() {
        // Cache the details in a nicer format, storing the actual columns rather than just the column names.
        regionMapping._regionDetails = rawRegionDetails.map(function(rawRegionDetail) {
            return {
                regionProvider: rawRegionDetail.regionProvider,
                column: regionMapping._tableStructure.getColumnWithName(rawRegionDetail.variableName),
                disambigColumn: regionMapping._tableStructure.getColumnWithName(rawRegionDetail.disambigVariableName),
            };
        });
        return regionMapping._regionDetails;
    }).otherwise(function(e) {
        console.log('error loading region ids', e);
    });
}



/**
 * Returns an array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 * Takes the current time into account if there is a time column and _avalabilities is defined.
 * @private
 * @param {RegionMapping} regionMapping The table data source.
 * @param {JulianDate} [time] The current time, eg. terria.clock.currentTime. NOT the time column's ._clock's time, which is different (and comes from a DataSourceClock).
 * @param {Array} [failedMatches] An optional empty array. If provided, indices of failed matches are appended to the array.
 * @param {Array} [ambiguousMatches] An optional empty array. If provided, indices of matches which duplicate prior matches are appended to the array.
 * @return {Array} An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 */
function calculateRegionIndices(regionMapping, time, failedMatches, ambiguousMatches) {
    // As described in load, currently we only use the first possible region column.
    var regionDetail = regionMapping._regionDetails[0];
    var tableStructure = regionMapping._tableStructure;
    var regionColumnValues = regionDetail.column.values;
    // Wipe out the region names from the rows that do not apply at this time, if there is a time column.
    var timeColumn = tableStructure.activeTimeColumn;
    if (defined(timeColumn) && timeColumn.availabilities) {
        regionColumnValues = regionColumnValues.map(function(value, index) {
            return (timeColumn.availabilities[index].contains(time) ? value : undefined);
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
 * Put the properties and the description of this row onto the image of the region. Handles time-varying and constant regions.
 * @param {RegionMapping} regionMapping The region mapping instance.
 * @param {Array} [regionIndices] An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source;
 *                                only used if the regions are constant.
 * @param {WebMapServiceImageryProvider} regionImageryProvider The WebMapServiceImageryProvider instance.
 * @private
 */
function addDescriptionAndProperties(regionMapping, regionIndices, regionImageryProvider) {
    var tableStructure = regionMapping._tableStructure;
    var rowObjects = tableStructure.toRowObjects();
    if (rowObjects.length === 0) {
        return;
    }
    var columnAliases = tableStructure.getColumnAliases();
    var rowDescriptions = tableStructure.toRowDescriptions(regionMapping._tableStyle.featureInfoFields);
    var regionDetail = regionMapping._regionDetails[0];
    var uniqueIdProp = regionDetail.regionProvider.uniqueIdProp;
    var isConstant = regionMapping.isConstant;

    var regionRowDescriptions;
    var regionRowObjects;
    if (isConstant) {
        regionRowObjects = regionIndices.map(function(i) { return rowObjects[i]; });
        regionRowDescriptions = regionIndices.map(function(i) { return rowDescriptions[i]; });
    }

    function getRegionRowDescriptionPropertyCallbackForId(uniqueId) {
        /**
         * Returns a function that returns the value of the regionRowDescription at a given time, updating result if available.
         * @private
         * @param {JulianDate} [time] The time for which to retrieve the value.
         * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
         * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied or is unsupported.
         */
        return function regionRowDescriptionPropertyCallback(time, result) {
            var timeSpecificRegionIndices = calculateRegionIndices(regionMapping, time);
            var regionRowDescriptions = timeSpecificRegionIndices.map(function(i) { return rowDescriptions[i]; });
            // result parameter is unsupported (should it be supported?)
            return regionRowDescriptions[uniqueId] || 'No data for the selected date.';
        };
    }

    function getRegionRowPropertiesPropertyCallbackForId(uniqueId) {
        /**
         * Returns a function that returns the value of the regionRowProperties at a given time, updating result if available.
         * @private
         * @param {JulianDate} [time] The time for which to retrieve the value.
         * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
         * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied or is unsupported.
         */
        return function regionRowPropertiesPropertyCallback(time, result) {
            var timeSpecificRegionIndices = calculateRegionIndices(regionMapping, time);
            var regionRowObjects = timeSpecificRegionIndices.map(function(i) { return rowObjects[i]; });
            var properties = regionRowObjects[uniqueId] || {};
            properties._terria_columnAliases = columnAliases;
            return properties;
        };
    }

    ImageryProviderHooks.addPickFeaturesHook(regionImageryProvider, function(imageryLayerFeatureInfos) {
        if (!defined(imageryLayerFeatureInfos) || imageryLayerFeatureInfos.length === 0) {
            return;
        }
        for (var i = 0; i < imageryLayerFeatureInfos.length; ++i) {
            var imageryLayerFeatureInfo = imageryLayerFeatureInfos[i];
            var uniqueId = imageryLayerFeatureInfo.data.properties[uniqueIdProp];
            if (isConstant) {
                imageryLayerFeatureInfo.description = regionRowDescriptions[uniqueId];
                imageryLayerFeatureInfo.properties = regionRowObjects[uniqueId];
                if (defined(imageryLayerFeatureInfo.properties)) {
                    imageryLayerFeatureInfo.properties._terria_columnAliases = columnAliases;
                }
            } else {
                imageryLayerFeatureInfo.description = new CallbackProperty(getRegionRowDescriptionPropertyCallbackForId(uniqueId), isConstant);
                imageryLayerFeatureInfo.properties = new CallbackProperty(getRegionRowPropertiesPropertyCallbackForId(uniqueId), isConstant);
            }
        }
        return imageryLayerFeatureInfos;
    });
}

/**
 * Creates and enables a new ImageryLayer onto terria, showing appropriately colored regions.
 * @private
 * @param {RegionMapping} regionMapping    The table data source.
 * @param {Number} [layerIndex] The layer index of the new imagery layer.
 * @param {Array} [regionIndices] An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 *                  If not provided, it is calculated, and failed/ambiguous warnings are displayed to the user.
 */
function setNewRegionImageryLayer(regionMapping, layerIndex, regionIndices) {
    var catalogItem = regionMapping._catalogItem;
    var regionDetail = regionMapping._regionDetails[0];
    var legendHelper = regionMapping._legendHelper;
    var tableStructure = regionMapping._tableStructure;
    var failedMatches, ambiguousMatches;
    if (!defined(regionIndices)) {
        failedMatches = [];
        ambiguousMatches = [];
        regionIndices = calculateRegionIndices(regionMapping, regionMapping._catalogItem.terria.clock.currentTime, failedMatches, ambiguousMatches);
        if (!regionMapping._hasDisplayedFeedback && catalogItem.showWarnings) {
            regionMapping._hasDisplayedFeedback = true;
            displayFailedAndAmbiguousMatches(regionMapping, failedMatches, ambiguousMatches);
        }
    }
    var regionValues = getRegionValuesFromIndices(regionIndices, tableStructure);

    var regionImageryProvider = new WebMapServiceImageryProvider({
        url: proxyCatalogItemUrl(regionMapping._catalogItem, regionDetail.regionProvider.server),
        layers: regionDetail.regionProvider.layerName,
        parameters: WebMapServiceCatalogItem.defaultParameters,
        getFeatureInfoParameters: WebMapServiceCatalogItem.defaultParameters,
        tilingScheme: new WebMercatorTilingScheme()
    });

    addDescriptionAndProperties(regionMapping, regionIndices, regionImageryProvider);

    // Recolor the regions.
    var colorFunction = regionDetail.regionProvider.getColorLookupFunc(
        regionValues,
        legendHelper.getColorArrayFromValue.bind(legendHelper)
    );
    ImageryProviderHooks.addRecolorFunc(regionImageryProvider, colorFunction);

    regionMapping._imageryLayer = ImageryLayerCatalogItem.enableLayer(catalogItem, regionImageryProvider, catalogItem.opacity, layerIndex);
    if (defined(catalogItem.terria.leaflet) && colorFunction) {
        regionMapping._imageryLayer.setFilter(function () {
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
 * @private
 * @param  {RegionMapping} regionMapping The data source.
 * @param  {Array} [regionIndices] Passed into setNewRegionImageryLayer. Saves recalculating it if available.
 */
function redisplayRegions(regionMapping, regionIndices) {
    if (defined(regionMapping._regionDetails)) {
        // We are using _hadImageryAtLayerIndex = true to mean it had an ImageryLayer, but its layer was undefined.
        // _hadImageryAtLayerIndex = undefined means it did not have an ImageryLayer.
        var layerIndex = regionMapping._hadImageryAtLayerIndex === true ? undefined : regionMapping._hadImageryAtLayerIndex;
        if (defined(regionMapping._imageryLayer)) {
            layerIndex = regionMapping._imageryLayer._layerIndex;  // Would prefer not to access an internal variable of imageryLayer.
            ImageryLayerCatalogItem.hideLayer(regionMapping._catalogItem, regionMapping._imageryLayer);
            ImageryLayerCatalogItem.disableLayer(regionMapping._catalogItem, regionMapping._imageryLayer);
            regionMapping._imageryLayer = undefined;
        }
        setNewRegionImageryLayer(regionMapping, layerIndex, regionIndices);
        if (regionMapping._catalogItem.isShown) {
            ImageryLayerCatalogItem.showLayer(regionMapping._catalogItem, regionMapping._imageryLayer);
        }
    }
}

function onClockTick(regionMapping, clock) {
    // Check if record data has changed.
    var regionIndices = calculateRegionIndices(regionMapping, clock.currentTime);
    if (arraysAreEqual(regionMapping._previousRegionIndices, regionIndices)) {
        return;
    }
    regionMapping._previousRegionIndices = regionIndices;

    redisplayRegions(regionMapping, regionIndices);
}

function updateClockSubscription(regionMapping) {
    // Only if there is a clock.
    if (regionMapping.isConstant) {
        return;
    }
    var catalogItem = regionMapping._catalogItem;
    if (!catalogItem.isEnabled || !catalogItem.isShown) {
        if (defined(regionMapping._clockTickSubscription)) {
            // Unsubscribe
            regionMapping._clockTickSubscription();
            regionMapping._clockTickSubscription = undefined;
        }
    } else {
        if (!defined(regionMapping._clockTickSubscription)) {
            // We listen to the terria clock instead of our clock. Our clock does not actually advance, so doesn't show the same time.
            regionMapping._clockTickSubscription = catalogItem.terria.clock.onTick.addEventListener(onClockTick.bind(undefined, regionMapping));
        }
    }
}


function displayFailedAndAmbiguousMatches(regionMapping, failedMatches, ambiguousMatches) {
    var msg = "";
    var regionDetail = regionMapping._regionDetails[0];
    var regionColumnValues = regionDetail.column.values;
    var timeColumn = regionMapping._tableStructure.activeTimeColumn;

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

        var error = new TerriaError({
            title: "Issues loading CSV file: " + regionMapping._catalogItem.name.slice(0, 20), // Long titles mess up the message body.
            message: '<div>'+ msg +'</div>'
        });
        if (failedMatches.length === regionColumnValues.length) {
            // Every row failed, so abort - don't add it to catalogue at all.
            throw error;
        } else {
            // Just warn the user. Ideally we'd avoid showing the warning when switching between columns.
            regionMapping._catalogItem.terria.error.raiseEvent(error);
        }
    }
}

/**
* Destroy the object and release resources
*/
RegionMapping.prototype.destroy = function() {
    // Do we need to explicitly unsubscribe from the clock?
    return destroyObject(this);
};

module.exports = RegionMapping;

/*global require*/
"use strict";

var CallbackProperty = require("terriajs-cesium/Source/DataSources/CallbackProperty")
  .default;
var CesiumEvent = require("terriajs-cesium/Source/Core/Event").default;
var combine = require("terriajs-cesium/Source/Core/combine").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var destroyObject = require("terriajs-cesium/Source/Core/destroyObject")
  .default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var ImageryLayerFeatureInfo = require("terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo")
  .default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var WebMapServiceImageryProvider = require("terriajs-cesium/Source/Scene/WebMapServiceImageryProvider")
  .default;
var WebMercatorTilingScheme = require("terriajs-cesium/Source/Core/WebMercatorTilingScheme")
  .default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var uniq = require("lodash.uniq");

var calculateImageryLayerIntervals = require("./calculateImageryLayerIntervals");
var ImageryLayerCatalogItem = require("../Models/ImageryLayerCatalogItem");
var ImageryProviderHooks = require("../Map/ImageryProviderHooks");
var Leaflet = require("../Models/Leaflet");
var LegendHelper = require("../Models/LegendHelper");
var proxyCatalogItemUrl = require("../Models/proxyCatalogItemUrl");
var RegionProviderList = require("../Map/RegionProviderList");
var TableStructure = require("../Map/TableStructure");
var TableStyle = require("../Models/TableStyle");
var TerriaError = require("../Core/TerriaError");
var VarType = require("../Map/VarType");
var WebMapServiceCatalogItem = require("../Models/WebMapServiceCatalogItem");
var MapboxVectorTileImageryProvider = require("../Map/MapboxVectorTileImageryProvider");
var { setOpacity, fixNextLayerOrder } = require("./ImageryLayerPreloadHelpers");
var i18next = require("i18next").default;
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
  this._tableStructure = defined(tableStructure)
    ? tableStructure
    : new TableStructure();
  if (defined(tableStyle) && !(tableStyle instanceof TableStyle)) {
    throw new DeveloperError("Please pass a TableStyle object.");
  }
  this._tableStyle = tableStyle; // Can be undefined.
  this._changed = new CesiumEvent();
  this._legendHelper = undefined;
  this._legendUrl = undefined;
  this._extent = undefined;
  this._loadingData = false;

  this._catalogItem = catalogItem;
  this._regionMappingDefinitionsUrl = defined(catalogItem)
    ? catalogItem.terria.configParameters.regionMappingDefinitionsUrl
    : undefined;
  this._regionDetails = undefined; // For caching the region details.
  this._imageryLayer = undefined;
  this._nextImageryLayer = undefined; // For pre-rendering time-varying layers
  this._nextImageryLayerInterval = undefined;
  this._hadImageryAtLayerIndex = undefined;
  this._hasDisplayedFeedback = false; // So that we only show the feedback once.

  this._constantRegionRowObjects = undefined;
  this._constantRegionRowDescriptions = undefined;

  // Track _tableStructure so that the catalogItem's concepts are maintained.
  // Track _legendUrl so that the catalogItem can update the legend if it changes.
  // Track _regionDetails so that when it is discovered that region mapping applies,
  //       it updates the legendHelper via activeItems, and catalogItem properties like supportsReordering.
  knockout.track(this, ["_tableStructure", "_legendUrl", "_regionDetails"]);

  // Whenever the active item is changed, recalculate the legend and the display of all the entities.
  // This is triggered both on deactivation and on reactivation, ie. twice per change; it would be nicer to trigger once.
  knockout
    .getObservable(this._tableStructure, "activeItems")
    .subscribe(changedActiveItems.bind(null, this), this);

  knockout
    .getObservable(this._catalogItem, "currentTime")
    .subscribe(function() {
      if (this.hasActiveTimeColumn) {
        onClockTick(this);
      }
    }, this);
};

Object.defineProperties(RegionMapping.prototype, {
  /**
   * Gets the clock settings defined by the loaded data.  If
   * only static data exists, this value is undefined.
   * @memberof RegionMapping.prototype
   * @type {DataSourceClock}
   */
  clock: {
    get: function() {
      if (defined(this._tableStructure)) {
        return this._tableStructure.clock;
      }
      return undefined;
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
    get: function() {
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
   * Once loaded, gets the region details (an array of "regionDetail" objects, with regionProvider, columnName and disambigColumnName properties).
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
   * Gets a Boolean value saying whether the region mapping has a time column.
   * @memberOf RegionMapping.prototype
   * @type {Boolean}
   */
  hasActiveTimeColumn: {
    get: function() {
      var timeColumn = this._tableStructure.activeTimeColumn;
      return defined(timeColumn) && defined(timeColumn._clock);
    }
  },

  /**
   * Gets a Boolean value saying whether the region mapping will be updated due to its catalog item being polled.
   * @memberOf RegionMapping.prototype
   * @type {Boolean}
   */
  isPolled: {
    get: function() {
      return defined(
        this._catalogItem.polling && this._catalogItem.polling.seconds
      );
    }
  }
});

/**
 * Set the region column type.
 * Currently we only use the first possible region column, and leave any others as they are.
 * @param {Object[]} regionDetails The data source's regionDetails array.
 */
RegionMapping.prototype.setRegionColumnType = function(index) {
  if (!defined(index)) {
    index = 0;
  }
  var regionDetail = this._regionDetails[index];
  console.log(
    "Found region match based on " +
      regionDetail.columnName +
      (defined(regionDetail.disambigColumnName)
        ? " and " + regionDetail.disambigColumnName
        : "")
  );
  this._tableStructure.getColumnWithNameIdOrIndex(
    regionDetail.columnName
  ).type = VarType.REGION;
  if (defined(regionDetail.disambigColumnName)) {
    this._tableStructure.getColumnWithNameIdOrIndex(
      regionDetail.disambigColumnName
    ).type = VarType.REGION;
  }
};

/**
 * Explictly hide the imagery layer (if any).
 */
RegionMapping.prototype.hideImageryLayer = function() {
  // The region mapping was on, but has been switched off, so disable the imagery layer.
  // We are using _hadImageryAtLayerIndex = true to mean it had an ImageryLayer, but its layer was undefined.
  // _hadImageryAtLayerIndex = undefined means it did not have an ImageryLayer.
  var regionMapping = this;
  if (defined(regionMapping._imageryLayer)) {
    regionMapping._hadImageryAtLayerIndex =
      regionMapping._imageryLayer._layerIndex; // Would prefer not to access an internal variable of imageryLayer.
    if (!defined(regionMapping._hadImageryAtLayerIndex)) {
      regionMapping._hadImageryAtLayerIndex = true;
    }
    ImageryLayerCatalogItem.hideLayer(
      regionMapping._catalogItem,
      regionMapping._imageryLayer
    );
    ImageryLayerCatalogItem.disableLayer(
      regionMapping._catalogItem,
      regionMapping._imageryLayer
    );
    regionMapping._imageryLayer = undefined;
  }
};

function reviseLegendHelper(regionMapping) {
  // Currently we only use the first possible region column.
  var activeColumn = regionMapping._tableStructure.activeItems[0];
  var regionProvider = defined(regionMapping._regionDetails)
    ? regionMapping._regionDetails[0].regionProvider
    : undefined;
  regionMapping._legendHelper = new LegendHelper(
    activeColumn,
    regionMapping._tableStyle,
    regionProvider,
    regionMapping._catalogItem.name
  );
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
  if (defined(regionMapping._regionDetails)) {
    reviseLegendHelper(regionMapping);
    if (!regionMapping._loadingData) {
      if (
        defined(regionMapping._imageryLayer) ||
        defined(regionMapping._hadImageryAtLayerIndex)
      ) {
        redisplayRegions(regionMapping);
      }
      regionMapping._changed.raiseEvent(regionMapping);
    }
  } else {
    regionMapping._legendHelper = undefined;
    regionMapping._legendUrl = undefined;
  }
}

RegionMapping.prototype.showOnSeparateMap = function(globeOrMap) {
  if (defined(this._regionDetails)) {
    var layer = createNewRegionImageryLayer(
      this,
      0,
      undefined,
      globeOrMap,
      globeOrMap.terria.clock.currentTime
    );
    ImageryLayerCatalogItem.showLayer(this._catalogItem, layer, globeOrMap);

    var that = this;
    return function() {
      ImageryLayerCatalogItem.hideLayer(that._catalogItem, layer, globeOrMap);
      ImageryLayerCatalogItem.disableLayer(
        that._catalogItem,
        layer,
        globeOrMap
      );
    };
  }
};

// The functions enable, disable, show and hide are required for region mapping.
RegionMapping.prototype.enable = function(layerIndex) {
  if (defined(this._regionDetails)) {
    setNewRegionImageryLayer(this, layerIndex);
  }
};

RegionMapping.prototype.disable = function() {
  if (defined(this._regionDetails)) {
    ImageryLayerCatalogItem.disableLayer(this._catalogItem, this._imageryLayer);
    this._imageryLayer = undefined;
  }
};

RegionMapping.prototype.show = function() {
  if (defined(this._regionDetails)) {
    ImageryLayerCatalogItem.showLayer(this._catalogItem, this._imageryLayer);
  }
};

RegionMapping.prototype.hide = function() {
  if (defined(this._regionDetails)) {
    ImageryLayerCatalogItem.hideLayer(this._catalogItem, this._imageryLayer);
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
 * 0. Wait for the data to be ready, if needed. (For loaded tables, this is trivially true, but it might be constructed elsewhere.)
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
  return RegionProviderList.fromUrl(
    regionMapping._regionMappingDefinitionsUrl,
    this._catalogItem.terria.corsProxy
  ).then(function(regionProviderList) {
    var targetRegionVariableName, targetRegionType;
    if (defined(regionMapping._tableStyle)) {
      targetRegionVariableName = regionMapping._tableStyle.regionVariable;
      targetRegionType = regionMapping._tableStyle.regionType;
    }
    // We have a region provider list, now get the region provider and load its region ids (another async job).
    // Provide the user-specified region variable name and type. If specified, getRegionDetails will return them as the first object in the returned array.
    var rawRegionDetails = regionProviderList.getRegionDetails(
      regionMapping._tableStructure.getColumnNames(),
      targetRegionVariableName,
      targetRegionType
    );
    if (rawRegionDetails.length > 0) {
      return loadRegionIds(regionMapping, rawRegionDetails);
    }
    return when(); // Nothing more to return.
  });
};

// Loads region ids from the region providers, and returns the region details.
function loadRegionIds(regionMapping, rawRegionDetails) {
  var promises = rawRegionDetails.map(function(rawRegionDetail) {
    return rawRegionDetail.regionProvider.loadRegionIDs();
  });
  return when
    .all(promises)
    .then(function() {
      // Cache the details in a nicer format, storing the actual columns rather than just the column names.
      regionMapping._regionDetails = rawRegionDetails.map(function(
        rawRegionDetail
      ) {
        return {
          regionProvider: rawRegionDetail.regionProvider,
          columnName: rawRegionDetail.variableName,
          disambigColumnName: rawRegionDetail.disambigVariableName
        };
      });
      return regionMapping._regionDetails;
    })
    .otherwise(function(e) {
      console.log("error loading region ids", e);
    });
}

/**
 * Returns an array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 * Takes the current time into account if a time is provided, and there is a time column with timeIntervals defined.
 * @private
 * @param {RegionMapping} regionMapping The table data source.
 * @param {JulianDate} [time] The current time, eg. terria.clock.currentTime. NOT the time column's ._clock's time, which is different (and comes from a DataSourceClock).
 * @param {Array} [failedMatches] An optional empty array. If provided, indices of failed matches are appended to the array.
 * @param {Array} [ambiguousMatches] An optional empty array. If provided, indices of matches which duplicate prior matches are appended to the array.
 * @return {Array} An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 */
function calculateRegionIndices(
  regionMapping,
  time,
  failedMatches,
  ambiguousMatches
) {
  // As described in load, currently we only use the first possible region column.
  var regionDetail = regionMapping._regionDetails[0];
  var tableStructure = regionMapping._tableStructure;
  var regionColumn = tableStructure.getColumnWithNameIdOrIndex(
    regionDetail.columnName
  );
  if (!defined(regionColumn)) {
    return;
  }
  var regionColumnValues = regionColumn.values;
  // Wipe out the region names from the rows that do not apply at this time, if there is a time column.
  var timeColumn = tableStructure.activeTimeColumn;
  var disambigColumn = defined(regionDetail.disambigColumnName)
    ? tableStructure.getColumnWithNameIdOrIndex(regionDetail.disambigColumnName)
    : undefined;
  // regionIndices will be an array the same length as regionProvider.regions, giving the index of each region into the table.
  var regionIndices = regionDetail.regionProvider.mapRegionsToIndicesInto(
    regionColumnValues,
    disambigColumn && disambigColumn.values,
    failedMatches,
    ambiguousMatches,
    defined(timeColumn) ? timeColumn.timeIntervals : undefined,
    time
  );
  return regionIndices;
}

function getRegionValuesFromIndices(regionIndices, tableStructure) {
  var regionValues = regionIndices; // Appropriate if no active column: color each region according to its index into the table.
  if (tableStructure.activeItems.length > 0) {
    var activeColumn = tableStructure.activeItems[0];
    regionValues = regionIndices.map(function(i) {
      return activeColumn.values[i];
    });
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
function addDescriptionAndProperties(
  regionMapping,
  regionIndices,
  regionImageryProvider
) {
  var tableStructure = regionMapping._tableStructure;
  var rowObjects = tableStructure.toStringAndNumberRowObjects();
  if (rowObjects.length === 0) {
    return;
  }
  var columnAliases = tableStructure.getColumnAliases();
  var rowDescriptions = tableStructure.toRowDescriptions(
    regionMapping._tableStyle.featureInfoFields
  );
  var regionDetail = regionMapping._regionDetails[0];
  var uniqueIdProp = regionDetail.regionProvider.uniqueIdProp;
  var idColumnNames = [regionDetail.columnName];
  if (defined(regionDetail.disambigColumnName)) {
    idColumnNames.push(regionDetail.disambigColumnName);
  }
  var rowNumbersMap = tableStructure.getIdMapping(idColumnNames);

  if (!regionMapping.hasActiveTimeColumn) {
    regionMapping._constantRegionRowObjects = regionIndices.map(function(i) {
      return rowObjects[i];
    });
    regionMapping._constantRegionRowDescriptions = regionIndices.map(function(
      i
    ) {
      return rowDescriptions[i];
    });
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
      // result parameter is unsupported (should it be supported?)
      if (!regionMapping.hasActiveTimeColumn) {
        return (
          regionMapping._constantRegionRowDescriptions[uniqueId] || "No data"
        );
      }
      var timeSpecificRegionIndices = calculateRegionIndices(
        regionMapping,
        time
      );
      var timeSpecificRegionRowDescriptions = timeSpecificRegionIndices.map(
        function(i) {
          return rowDescriptions[i];
        }
      );

      if (defined(timeSpecificRegionRowDescriptions[uniqueId])) {
        return timeSpecificRegionRowDescriptions[uniqueId];
      }
      // If it's not defined at this time, is it defined at any time?
      // Give a different description in each case.
      var timeAgnosticRegionIndices = calculateRegionIndices(regionMapping);
      var rowNumberWithThisRegion = timeAgnosticRegionIndices[uniqueId];
      if (defined(rowNumberWithThisRegion)) {
        return i18next.t("models.regionMapping.noDataForDate");
      }
      return i18next.t("models.regionMapping.noDataForRegion");
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
      // result parameter is unsupported (should it be supported?)
      if (!regionMapping.hasActiveTimeColumn) {
        // Only changes due to polling.
        var rowObject = regionMapping._constantRegionRowObjects[uniqueId];
        if (!defined(rowObject)) {
          return {};
        }
        var constantProperties = rowObject.string;
        constantProperties._terria_columnAliases = columnAliases;
        constantProperties._terria_numericalProperties = rowObject.number;
        return constantProperties;
      }
      // Changes due to time column in the table (and maybe polling too).
      var timeSpecificRegionIndices = calculateRegionIndices(
        regionMapping,
        time
      );
      var timeSpecificRegionRowObjects = timeSpecificRegionIndices.map(function(
        i
      ) {
        return rowObjects[i];
      });
      var tsRowObject = timeSpecificRegionRowObjects[uniqueId];
      var properties = (tsRowObject && tsRowObject.string) || {};
      properties._terria_columnAliases = columnAliases;
      properties._terria_numericalProperties =
        (tsRowObject && tsRowObject.number) || {};
      // Even if there is no data for this region at this time,
      // we want to get data for all other times for this region so we can chart it.
      // So get the region indices again, this time ignoring time,
      // so that we can get a row number in the table where this region occurs (if there is one at any time).
      // This feels like a slightly roundabout approach. Is there a more streamlined way?
      var timeAgnosticRegionIndices = calculateRegionIndices(regionMapping);
      var regionIdString = tableStructure.getIdStringForRowNumber(
        timeAgnosticRegionIndices[uniqueId],
        idColumnNames
      );
      var rowNumbersForThisRegion = rowNumbersMap[regionIdString];
      if (defined(rowNumbersForThisRegion)) {
        properties._terria_getChartDetails = function() {
          return tableStructure.getChartDetailsForRowNumbers(
            rowNumbersForThisRegion
          );
        };
      }
      return properties;
    };
  }

  switch (regionDetail.regionProvider.serverType) {
    case "MVT":
      return function constructMVTFeatureInfo(feature) {
        var imageryLayerFeatureInfo = new ImageryLayerFeatureInfo();
        imageryLayerFeatureInfo.name =
          feature.properties[regionDetail.regionProvider.nameProp];
        var uniqueId = feature.properties[uniqueIdProp];

        if (!regionMapping.hasActiveTimeColumn && !regionMapping.isPolled) {
          // Constant over time - no time column, and no polling.
          imageryLayerFeatureInfo.description =
            regionMapping._constantRegionRowDescriptions[uniqueId];
          var cRowObject = regionMapping._constantRegionRowObjects[uniqueId];
          if (defined(cRowObject)) {
            cRowObject.string._terria_columnAliases = columnAliases;
            cRowObject.string._terria_numericalProperties = cRowObject.number;
            imageryLayerFeatureInfo.properties = combine(
              feature.properties,
              cRowObject.string
            );
          } else {
            return;
          }
        } else {
          // Time-varying.
          imageryLayerFeatureInfo.description = new CallbackProperty(
            getRegionRowDescriptionPropertyCallbackForId(uniqueId),
            false
          );
          // Merge vector tile and data properties
          var propertiesCallback = getRegionRowPropertiesPropertyCallbackForId(
            uniqueId
          );
          imageryLayerFeatureInfo.properties = new CallbackProperty(
            time => combine(feature.properties, propertiesCallback(time)),
            false
          );
        }
        imageryLayerFeatureInfo.data = { id: uniqueId }; // For region highlight
        return imageryLayerFeatureInfo;
      };
    case "WMS":
      ImageryProviderHooks.addPickFeaturesHook(regionImageryProvider, function(
        imageryLayerFeatureInfos
      ) {
        if (
          !defined(imageryLayerFeatureInfos) ||
          imageryLayerFeatureInfos.length === 0
        ) {
          return;
        }
        for (var i = 0; i < imageryLayerFeatureInfos.length; ++i) {
          var imageryLayerFeatureInfo = imageryLayerFeatureInfos[i];
          var uniqueId = imageryLayerFeatureInfo.data.properties[uniqueIdProp];

          if (!regionMapping.hasActiveTimeColumn && !regionMapping.isPolled) {
            // Constant over time - no time column, and no polling.
            imageryLayerFeatureInfo.description =
              regionMapping._constantRegionRowDescriptions[uniqueId];
            var cRowObject = regionMapping._constantRegionRowObjects[uniqueId];
            if (defined(cRowObject)) {
              cRowObject.string._terria_columnAliases = columnAliases;
              cRowObject.string._terria_numericalProperties = cRowObject.number;
              imageryLayerFeatureInfo.properties = cRowObject.string;
            } else {
              imageryLayerFeatureInfo.properties = {};
            }
          } else {
            // Time-varying.
            imageryLayerFeatureInfo.description = new CallbackProperty(
              getRegionRowDescriptionPropertyCallbackForId(uniqueId),
              false
            );
            imageryLayerFeatureInfo.properties = new CallbackProperty(
              getRegionRowPropertiesPropertyCallbackForId(uniqueId),
              false
            );
          }
        }

        // If there was no description or property for a layer then we have nothing to display for it, so just filter it out.
        // This helps in cases where the imagery provider returns a feature that doesn't actually match the region.
        return imageryLayerFeatureInfos.filter(
          info => info.properties || info.description
        );
      });
      break;
  }
}

/**
 * Creates and enables a new ImageryLayer onto terria, showing appropriately colored regions.
 * @private
 * @param {RegionMapping} regionMapping    The table data source.
 * @param {Number} [layerIndex] The layer index of the new imagery layer.
 *
 * @param {Array} [regionIndices] An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 *                  If not provided, it is calculated, and failed/ambiguous warnings are displayed to the user.
 */
function setNewRegionImageryLayer(regionMapping, layerIndex, regionIndices) {
  if (!defined(regionMapping._tableStructure.activeTimeColumn)) {
    regionMapping._imageryLayer = createNewRegionImageryLayer(
      regionMapping,
      layerIndex,
      regionIndices
    );
  } else {
    var catalogItem = regionMapping._catalogItem;
    var currentTime = catalogItem.currentTime;

    // Calulate the interval of time that the next imagery layer is valid for
    var { nextInterval, currentInterval } = calculateImageryLayerIntervals(
      regionMapping._tableStructure.activeTimeColumn,
      currentTime,
      catalogItem.terria.clock.multiplier >= 0.0
    );
    if (
      currentInterval === regionMapping._imageryLayerInterval &&
      nextInterval === regionMapping._nextImageryLayerInterval
    ) {
      // No change in intervals, so nothing to do.
      return;
    }

    if (currentInterval !== regionMapping._imageryLayerInterval) {
      // Current layer is incorrect.  Can we use the next one?
      if (
        regionMapping._nextImageryLayerInterval &&
        TimeInterval.contains(
          regionMapping._nextImageryLayerInterval,
          currentTime
        )
      ) {
        setOpacity(
          catalogItem,
          regionMapping._nextImageryLayer,
          catalogItem.opacity
        );
        fixNextLayerOrder(
          catalogItem,
          regionMapping._imageryLayer,
          regionMapping._nextImageryLayer
        );
        ImageryLayerCatalogItem.disableLayer(
          catalogItem,
          regionMapping._imageryLayer
        );
        regionMapping._imageryLayer = regionMapping._nextImageryLayer;
        regionMapping._imageryLayerInterval =
          regionMapping._nextImageryLayerInterval;
        regionMapping._nextImageryLayer = undefined;
        regionMapping._nextImageryLayerInterval = null;
      } else {
        // Next is not right, either, possibly because the user is randomly scrubbing
        // on the timeline.  So create a new layer.
        ImageryLayerCatalogItem.disableLayer(
          catalogItem,
          regionMapping._imageryLayer
        );
        regionMapping._imageryLayer = createNewRegionImageryLayer(
          regionMapping,
          layerIndex,
          regionIndices
        );
        regionMapping._imageryLayerInterval = currentInterval;
      }
    }

    if (nextInterval !== regionMapping._nextImageryLayerInterval) {
      // Next layer is incorrect, so recreate it.
      ImageryLayerCatalogItem.disableLayer(
        catalogItem,
        regionMapping._nextImageryLayer
      );

      if (nextInterval) {
        regionMapping._nextImageryLayer = createNewRegionImageryLayer(
          regionMapping,
          layerIndex,
          undefined,
          undefined,
          nextInterval.start,
          0.0
        );
        ImageryLayerCatalogItem.showLayer(
          catalogItem,
          regionMapping._nextImageryLayer
        );
      } else {
        regionMapping._nextImageryLayer = undefined;
      }
      regionMapping._nextImageryLayerInterval = nextInterval;
    }
  }
}

function createNewRegionImageryLayer(
  regionMapping,
  layerIndex,
  regionIndices,
  globeOrMap,
  time,
  overrideOpacity
) {
  var catalogItem = regionMapping._catalogItem;

  var opacity = defaultValue(overrideOpacity, catalogItem.opacity);

  globeOrMap = defaultValue(globeOrMap, catalogItem.terria.currentViewer);
  time = defaultValue(time, catalogItem.currentTime);

  var regionDetail = regionMapping._regionDetails[0];
  var legendHelper = regionMapping._legendHelper;
  if (!defined(legendHelper)) {
    return; // Give up. This can happen if a time-series region-mapped table is charted over time; the chart looks like a region-mapped file.
  }
  var tableStructure = regionMapping._tableStructure;
  var failedMatches, ambiguousMatches;
  if (!defined(regionIndices)) {
    failedMatches = [];
    ambiguousMatches = [];
    regionIndices = calculateRegionIndices(
      regionMapping,
      time,
      failedMatches,
      ambiguousMatches
    );
    if (!regionMapping._hasDisplayedFeedback && catalogItem.showWarnings) {
      regionMapping._hasDisplayedFeedback = true;
      displayFailedAndAmbiguousMatches(
        regionMapping,
        failedMatches,
        ambiguousMatches
      );
    }
  }
  if (!defined(regionIndices)) {
    return;
  }
  var regionValues = getRegionValuesFromIndices(regionIndices, tableStructure);
  if (!defined(regionValues)) {
    return;
  }
  // Recolor the regions.
  var colorFunction = regionDetail.regionProvider.getColorLookupFunc(
    regionValues,
    legendHelper.getColorArrayFromValue.bind(legendHelper)
  );

  var regionImageryProvider;
  var layer;

  // Handle the case where a region mapped dataset crosses the antimeridian
  // and we get 404's retrieving tiles, this prevents the catalog item
  // from crashing
  catalogItem.treat404AsError = false;

  switch (regionDetail.regionProvider.serverType) {
    case "MVT":
      var terria = globeOrMap.terria;

      // Inform the user that region mapping is not supported in old browsers.
      if (typeof ArrayBuffer === "undefined") {
        throw new TerriaError({
          sender: catalogItem,
          title:
            terria.configParameters.oldBrowserRegionMappingTitle ||
            i18next.t("models.regionMapping.outdatedBrowserTitle"),
          message:
            terria.configParameters.oldBrowserRegionMappingMessage ||
            i18next.t("models.regionMapping.outdatedBrowserMessage", {
              email:
                '<a href="mailto:' +
                terria.supportEmail +
                '">' +
                terria.supportEmail +
                "</a>"
            })
        });
      }

      regionImageryProvider = new MapboxVectorTileImageryProvider({
        url: regionDetail.regionProvider.server,
        layerName: regionDetail.regionProvider.layerName,
        styleFunc: function(id) {
          var terria = catalogItem.terria;
          var color = colorFunction(id);
          return color
            ? {
                // color is an Array-like object (note: typed arrays don't have a 'join' method in IE10 & IE11)
                fillStyle:
                  "rgba(" + Array.prototype.join.call(color, ",") + ")",
                strokeStyle: terria.baseMapContrastColor,
                lineWidth: 1
              }
            : undefined;
        },
        subdomains: regionDetail.regionProvider.serverSubdomains,
        rectangle: Rectangle.fromDegrees.apply(
          null,
          regionDetail.regionProvider.bbox
        ),
        minimumZoom: regionDetail.regionProvider.serverMinZoom,
        maximumNativeZoom: regionDetail.regionProvider.serverMaxNativeZoom,
        maximumZoom: regionDetail.regionProvider.serverMaxZoom,
        uniqueIdProp: regionDetail.regionProvider.uniqueIdProp,
        featureInfoFunc: addDescriptionAndProperties(
          regionMapping,
          regionIndices,
          regionImageryProvider
        )
      });
      layer = ImageryLayerCatalogItem.enableLayer(
        catalogItem,
        regionImageryProvider,
        opacity,
        layerIndex,
        globeOrMap,
        undefined
      );
      break;

    case "WMS":
      // Recolor the regions, and add feature descriptions.
      regionImageryProvider = new WebMapServiceImageryProvider({
        url: proxyCatalogItemUrl(
          catalogItem,
          regionDetail.regionProvider.server
        ),
        layers: regionDetail.regionProvider.layerName,
        parameters: WebMapServiceCatalogItem.defaultParameters,
        getFeatureInfoParameters: WebMapServiceCatalogItem.defaultParameters,
        tilingScheme: new WebMercatorTilingScheme()
      });

      addDescriptionAndProperties(
        regionMapping,
        regionIndices,
        regionImageryProvider
      );

      ImageryProviderHooks.addRecolorFunc(regionImageryProvider, colorFunction);
      layer = ImageryLayerCatalogItem.enableLayer(
        catalogItem,
        regionImageryProvider,
        opacity,
        layerIndex,
        globeOrMap,
        undefined
      );
      if (globeOrMap instanceof Leaflet && colorFunction) {
        layer.options.crossOrigin = true; // Allow cross origin tiles
        layer.on("tileload", function(evt) {
          if (evt.tile._recolored) {
            // Already recoloured (this event is called when the recoloured tile "loads")
            return;
          }
          // Below code adapted from Leaflet.TileLayer.Filter (https://github.com/humangeo/leaflet-tilefilter)
          /*
                @preserve Leaflet Tile Filters, a JavaScript plugin for applying image filters to tile images
                (c) 2014, Scott Fairgrieve, HumanGeo
                */
          var canvas;
          var size = 256;
          if (!evt.tile.canvasContext) {
            canvas = document.createElement("canvas");
            canvas.width = canvas.height = size;
            evt.tile.canvasContext = canvas.getContext("2d");
          }
          var ctx = evt.tile.canvasContext;
          if (ctx) {
            ctx.drawImage(evt.tile, 0, 0);
            var imgd = ctx.getImageData(0, 0, size, size);
            imgd = ImageryProviderHooks.recolorImage(imgd, colorFunction);
            ctx.putImageData(imgd, 0, 0);
            evt.tile.onload = null;
            evt.tile.src = ctx.canvas.toDataURL();
            evt.tile._recolored = true;
          }
        });
      }
      break;

    default:
      throw new TerriaError({
        title: i18next.t("models.regionMapping.invalidServerTypeTitle", {
          serverType: regionDetail.regionProvider.serverType
        }),
        message:
          "<div>" +
          i18next.t("models.regionMapping.invalidServerTypeTitle", {
            serverType: regionDetail.regionProvider.serverType
          }) +
          "</div>"
      });
  }

  return layer;
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
    regionMapping.hideImageryLayer();
    setNewRegionImageryLayer(
      regionMapping,
      regionMapping._hadImageryAtLayerIndex,
      regionIndices
    );
    if (regionMapping._catalogItem.isShown) {
      ImageryLayerCatalogItem.showLayer(
        regionMapping._catalogItem,
        regionMapping._imageryLayer
      );
    }
    regionMapping._catalogItem.terria.currentViewer.updateItemForSplitter(
      regionMapping._catalogItem
    );
  }
}

function onClockTick(regionMapping) {
  // Check if record data has changed.
  if (
    regionMapping._imageryLayerInterval &&
    TimeInterval.contains(
      regionMapping._imageryLayerInterval,
      regionMapping.clock.currentTime
    )
  ) {
    return;
  }
  redisplayRegions(regionMapping);
}

function displayFailedAndAmbiguousMatches(
  regionMapping,
  failedMatches,
  ambiguousMatches
) {
  var msg = "";
  var regionDetail = regionMapping._regionDetails[0];
  var regionColumnValues = regionMapping._tableStructure.getColumnWithNameIdOrIndex(
    regionDetail.columnName
  ).values;
  var timeColumn = regionMapping._tableStructure.activeTimeColumn;

  if (failedMatches.length > 0) {
    var failedNames = failedMatches.map(function(indexOfFailedMatch) {
      return regionColumnValues[indexOfFailedMatch];
    });
    msg += i18next.t("models.regionMapping.notRecognised", {
      notRecognisedText:
        '<span class="warning-text">' +
        i18next.t("models.regionMapping.notRecognisedText") +
        "</span>: <br><br/>" +
        "<samp>" +
        failedNames.join("</samp>, <samp>") +
        "</samp>" +
        "<br/><br/>"
    });
  }
  // Only show ambiguous matches if there is no time column.
  // There could still be ambiguous matches, but our code doesn't calculate that.
  if (ambiguousMatches.length > 0 && !defined(timeColumn)) {
    var ambiguousNames = ambiguousMatches.map(function(indexOfAmbiguousMatch) {
      return regionColumnValues[indexOfAmbiguousMatch];
    });
    msg += i18next.t("models.regionMapping.moreThanOneValue", {
      moreThanOneValueText:
        '<span class="warning-text">' +
        i18next.t("models.regionMapping.moreThanOneValueText") +
        "</span>: <br/><br/>" +
        "<samp>" +
        uniq(ambiguousNames).join("</samp>, <samp>") +
        "</samp>" +
        "<br/><br/>"
    });
  }
  if (msg) {
    msg += i18next.t("models.regionMapping.msg", {
      link:
        '<a href="https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au">' +
        i18next.t("models.regionMapping.csvSpecification") +
        "</a>"
    });
    var error = new TerriaError({
      title: i18next.t("models.regionMapping.issuesLoadingTitle", {
        name: regionMapping._catalogItem.name.slice(0, 20) // Long titles mess up the message body.
      }),
      message: "<div>" + msg + "</div>"
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
  // TODO: Don't we need to explicitly unsubscribe from the clock?
  // The comments for destroyObject suggest this is not useful for a RegionMapping object.
  return destroyObject(this);
};

module.exports = RegionMapping;

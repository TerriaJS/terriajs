/*global require*/
"use strict";

/*
 * TableDataSource object for displaying geo-located datasets.
 */
var L = require('leaflet');

var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var ClockRange = require('terriajs-cesium/Source/Core/ClockRange');
var ClockStep = require('terriajs-cesium/Source/Core/ClockStep');
var Color = require('terriajs-cesium/Source/Core/Color');
var createGuid = require('terriajs-cesium/Source/Core/createGuid');
var DataSourceClock = require('terriajs-cesium/Source/DataSources/DataSourceClock');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
// var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var EntityCollection = require('terriajs-cesium/Source/DataSources/EntityCollection');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var HorizontalOrigin = require('terriajs-cesium/Source/Scene/HorizontalOrigin');
var Iso8601 = require('terriajs-cesium/Source/Core/Iso8601');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var TimeIntervalCollection = require('terriajs-cesium/Source/Core/TimeIntervalCollection');
var TimeIntervalCollectionProperty = require('terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty');
var VerticalOrigin = require('terriajs-cesium/Source/Scene/VerticalOrigin');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var VarType = require('../Map/VarType');
var formatPropertyValue = require('../Core/formatPropertyValue');
var ImageryProviderHooks = require('../Map/ImageryProviderHooks');
var LegendHelper = require('../Map/LegendHelper');
var RegionProviderList = require('../Map/RegionProviderList');
var TableStructure = require('../Core/TableStructure');
var TableStyle = require('../Map/TableStyle');

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

var defaultEntityName = 'Site Data';

/**
* A DataSource for table-based data.
* Handles the graphical display of point datasets, generating Cesium entities for each row.
* Displaying the points requires knowledge of the legend, so this is also handled by TableDataSource.
* 
* @name TableDataSource
*
* @alias TableDataSource
* @constructor
* @param {CatalogItem} [catalogItem] The CatalogItem instance. Used for region mapping only,
*        specifically catalogItem.terria.regionMappingDefinitionsUrl and as an argument to proxyCatalogItemUrl.
*/
var TableDataSource = function(catalogItem) {
    this._name = name;
    this._changed = new CesiumEvent();
    this._error = new CesiumEvent();
    this._loading = new CesiumEvent();
    this._clock = undefined;
    this._entityCollection = new EntityCollection(this);

    this._tableStructure = new TableStructure();
    this._tableStyle = undefined;
    this._legendHelper = undefined;
    this._legendUrl = undefined;
    this._extent = undefined;
    this.loadingData = false;

    this._availabilities = undefined;  // For data with a time column, cache the availability of each row.

    // For region mapped csvs
    this._catalogItem = catalogItem;
    this._regionMappingDefinitionsUrl = defined(catalogItem) ? catalogItem.terria.regionMappingDefinitionsUrl : undefined;
    this._regionDetails = undefined; // for caching the region details
    this._regionImageryLayer = undefined;
    this._regionImageryProvider = undefined;

    // Track _tableStructure so that csvCatalogItem's concepts are maintained.
    // Track _legendUrl so that csvCatalogItem can update the legend if it changes.
    // Track _regionDetails so that when it is discovered that region mapping applies,
    //       it updates the legendHelper via activeItems, and csvCatalogItem properties like supportsReordering.
    knockout.track(this, ['_tableStructure', '_legendUrl', '_regionDetails']);

    // Whenever the active item is changed, recalculate the legend and the display of all the entities.
    knockout.getObservable(this._tableStructure, 'activeItems').subscribe(function(activeItems) {
        var activeColumn = activeItems[0];
        // Currently we only use the first possible region column.
        var regionProvider = defined(this._regionDetails) ? this._regionDetails[0].regionProvider : undefined;
        this._legendHelper = new LegendHelper(activeColumn, this._tableStyle, regionProvider);
        this._legendUrl = this._legendHelper.legendUrl();
        updateEntitiesAndExtent(this);
        
        var that = this;
        if (that._regionImageryLayer) {
            that.regionPromise.then(function(regionDetails) {
                // Following previous practice, when the coloring needs to change, the item is hidden, disabled, then re-enabled and re-shown.
                // So, a new imagery layer is created (during 'enable') each time its coloring changes.
                // TODO: Can we reuse the existing one? (I found the recoloring doesn't get used.)
                var layerIndex = that._regionImageryLayer._layerIndex;  // Would prefer not to access an internal variable of imageryLayer.
                that.hide();
                that.disable();
                that.enable(layerIndex);
                that.show();
            });
        }
    }, this);
};

defineProperties(TableDataSource.prototype, {
    /**
     * Gets a human-readable name for this instance.
     * @memberof TableDataSource.prototype
     * @type {String}
     */
    name : {
        get : function() {
            return this._name;
        }
    },
    /**
     * Gets the clock settings defined by the loaded data.  If
     * only static data exists, this value is undefined.
     * @memberof TableDataSource.prototype
     * @type {DataSourceClock}
     */
   clock : {
        get : function() {
            return this._clock;
        }
    },
    /**
     * Gets the collection of {@link Entity} instances.
     * @memberof TableDataSource.prototype
     * @type {EntityCollection}
     */
   entities : {
        get : function() {
            return this._entityCollection;
        }
    },
    /**
     * Gets a value indicating if the data source is currently loading data.
     * @memberof TableDataSource.prototype
     * @type {Boolean}
     */
   isLoading : {
        get : function() {
            return this.loadingData;
        }
    },
    /**
     * Gets a CesiumEvent that will be raised when the underlying data changes.
     * @memberof TableDataSource.prototype
     * @type {CesiumEvent}
     */
   changedEvent : {
        get : function() {
            return this._changed;
        }
    },
    /**
     * Gets a CesiumEvent that will be raised if an error is encountered during processing.
     * @memberof TableDataSource.prototype
     * @type {CesiumEvent}
     */
   errorEvent : {
        get : function() {
            return this._error;
        }
    },
    /**
     * Gets a CesiumEvent that will be raised when the data source either starts or stops loading.
     * @memberof TableDataSource.prototype
     * @type {CesiumEvent}
     */
    loadingEvent : {
        get : function() {
            return this._loading;
        }
    },

    /**
     * Gets the TableStructure object holding all the data.
     * @memberof TableDataSource.prototype
     * @type {TableStructure}
     */
    tableStructure : {
        get : function() {
            return this._tableStructure;
        }
    },

    /**
     * Gets the TableStyle object showing how to style the data.
     * @memberof TableDataSource.prototype
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
     * Gets a flag which states whether this data has latitude and longitude data.
     * @type {Boolean}
     */
    hasLatitudeAndLongitude: {
        get: function() {
            var longitudeColumn = this._tableStructure.columnsByType[VarType.LON][0];
            var latitudeColumn = this._tableStructure.columnsByType[VarType.LAT][0];
            return (defined(longitudeColumn) && defined(latitudeColumn));
        }
    },

    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * Used in region mapping only.
     * This property is undefined if the data source is not enabled.
     * @memberOf TableDataSource.prototype
     * @type {Object}
     */
    regionImageryLayer : {
        get : function() {
            return this._regionImageryLayer;
        }
    },

    /**
     * Gets a promise which resolves to either:
     *   undefined if no regions;
     *   An array of objects with regionProvider, column and disambigColumn properties. 
     *   For consistently, you should call this array of objects "regionDetails", and each individual object a "regionDetail".
     * It also caches this object in this._regionDetails.
     * @type {Promise}
     */
    regionPromise: {
        get: function() {
            if (defined(this._regionDetails)) {
                // Return a promise to the cached region details.
                return when(this._regionDetails);
            }
            if (!this._regionMappingDefinitionsUrl) {
                return when();
            }
            var that = this;

            var regionProviderListPromise = RegionProviderList.fromUrl(that._regionMappingDefinitionsUrl);
            return regionProviderListPromise.then(function(regionProviderList) {
                var targetRegionVariableName, targetRegionType;
                if (defined(that._tableStyle)) {
                    targetRegionVariableName = that._tableStyle.regionVariable;
                   targetRegionType = that._tableStyle.regionType;
                }
                // We have a region provider list, now get the region provider and load its region IDs (another async job).
                // Provide the user-specified region variable name and type. If specified, getRegionDetails will return them as the first object in the returned array.
                var rawRegionDetails = regionProviderList.getRegionDetails(that._tableStructure.getColumnNames(), targetRegionVariableName, targetRegionType);
                if (rawRegionDetails.length > 0) {
                    var promises = rawRegionDetails.map(function(rawRegionDetail) { return rawRegionDetail.regionProvider.loadRegionIDs(); });
                    return when.all(promises).then(function(requiredReload) {
                        // Cache the details in a nicer format, storing the actual columns rather than just the column names.
                        that._regionDetails = rawRegionDetails.map(function(rawRegionDetail) { 
                            return {
                                regionProvider: rawRegionDetail.regionProvider,
                                column: that._tableStructure.getColumnWithName(rawRegionDetail.variableName),
                                disambigColumn: that._tableStructure.getColumnWithName(rawRegionDetail.disambigVariableName),
                            };
                        });
                        return that._regionDetails;
                    });
                } else {
                    return undefined;
                }
            });
        }
    },

    /**
     * Once the region promise has resolved, gets the region details.
     * @type {Object[]} Array of "regionDetail" objects, with regionProvider, column and disambigColumn properties
     */
    regionDetails: {
        get: function() {
            return this._regionDetails;
        }
    },
});


// TableDataSource.prototype.loadUrl = function(url) {
//     var that = this;
//     return loadText(url).then(function(text) {
//         that.loadText(text);
//     }).otherwise(function(error) {
//     });
// };

/**
 * Creates a new instance loaded with the provided csv data.
 *
 * @param {String} csvString The csv data as a string.
 * @param {TableStyle} [tableStyle] The table style for this table.
 * @returns {TableDataSource} A new TableDataSource instance.
 */
TableDataSource.load = function(csvString, tableStyle) {
    var dataSource = new TableDataSource();
    dataSource.load(csvString, tableStyle);
};

function chooseAndActivateAColumn(tableStructure) {
    // Find and activate the first SCALAR or ENUM column.
    var suitableColumns = tableStructure.columns.filter(function(col) {
        return ([VarType.SCALAR, VarType.ENUM].indexOf(col.type) >= 0);
    });
    if (suitableColumns.length > 0) {
        suitableColumns[0].toggleActive();
    }
}

/**
 * Loads the Table from a csv string, replacing any existing data.
 * Chooses a sensible default active column.
 *
 * @param {String} csvString The text to be processed.
 * @param {TableStyle} [tableStyle] The table style for this table.
 *
 */
TableDataSource.prototype.load = function(csvString, tableStyle) {
    // Keep our own reference to tableStyle, although it is on the catalogItem too.
    if (defined(tableStyle) && !(tableStyle instanceof TableStyle)) {
        throw new DeveloperError('Please pass a TableStyle object.');
    }
    this._tableStyle = tableStyle;
    this._tableStructure.loadFromCsv(csvString);

    // If there's a time column, cache the time intervals for each entry upfront. Assume the first time column is the one.
    // Note that this._tableStructure.loadFromCsv changes activeItems, which triggers a knockout.getObservable call, which
    // triggers updateEntitiesAndExtent and the region-mapping equivalent, possibly before this ever happens.
    // However, when we activate a column below, those will all happen again, this time with availabilities defined.
    // TODO: can we stop this double-triggering?
    if (this.tableStructure.columnsByType[VarType.TIME].length > 0) {
        var timeColumn = this.tableStructure.columnsByType[VarType.TIME][0];
        this._availabilities = timeColumn.values.map(function(value, index) {
            return calculateAvailability(index, timeColumn, tableStyle);
        });
        var availabilityCollection = new TimeIntervalCollection();
        this._availabilities.forEach(function(availability) {
            availabilityCollection.addInterval(availability);
        });
        updateClock(this, availabilityCollection);
    }

    var columnToActivate;
    if (defined(tableStyle) && defined(tableStyle.dataVariable)) {
        columnToActivate = this._tableStructure.getColumnWithName(tableStyle.dataVariable);
        if (columnToActivate) {
            columnToActivate.toggleActive();
        }
    }
    if (this.hasLatitudeAndLongitude) {
        // If it has lat & lon, just choose a sensible active column, if not already set by tableStyle.
        if (!defined(columnToActivate)) {
            chooseAndActivateAColumn(this._tableStructure);
        }
    } else {
        // If it doesn't, it may be a region mapped csv. This is an async check.
        var that = this;
        this.regionPromise.then(function(regionDetails) {
            if (regionDetails) {
                // It has a region column.
                // Set the region column types and choose a sensible active column, if not already set by tableStyle.
                // Currently we only use the first possible region column, and leave any others as they are.
                var regionDetail = regionDetails[0];
                console.log('Found region match based on ' + regionDetail.column.name + (defined(regionDetail.disambigColumn) ? (' and ' + regionDetail.disambigColumn.name) : ''));
                regionDetail.column.type = VarType.REGION;
                if (defined(regionDetail.disambigColumn)) {
                    regionDetail.disambigColumn.type = VarType.REGION;
                }
                if (!defined(columnToActivate)) {
                    chooseAndActivateAColumn(that._tableStructure);
                }
            } else {
                console.log('No lat & lon or regional columns found in csv file.');
            }
        });
    }
};

// The functions enable, disable, show and hide are required for region mapping.
TableDataSource.prototype.enable = function(layerIndex) {
    var that = this;
    this.regionPromise.then(function(regionDetails) {
        if (regionDetails) {
            setNewRegionImageryLayer(that, layerIndex);
        }
    });
};

TableDataSource.prototype.disable = function() {
    var that = this;
    this.regionPromise.then(function(regionDetails) {
        if (regionDetails) {
            ImageryLayerCatalogItem.disableLayer(that._catalogItem, that._regionImageryLayer);
            that._regionImageryLayer = undefined;
        }
    });
};

TableDataSource.prototype.show = function() {
    var that = this;
    this.regionPromise.then(function(regionDetails) {
        if (regionDetails) {
            ImageryLayerCatalogItem.showLayer(that._catalogItem, that._regionImageryLayer);
        } else {
            var dataSources = that._catalogItem.terria.dataSources;
            if (dataSources.contains(that)) {
                throw new DeveloperError('This data source is already shown.');
            }
            dataSources.add(that);
        }
    });
};

TableDataSource.prototype.hide = function() {
    var that = this;
    this.regionPromise.then(function(regionDetails) {
        if (regionDetails) {
            ImageryLayerCatalogItem.hideLayer(that._catalogItem, that._regionImageryLayer);
        } else {
            var dataSources = that._catalogItem.terria.dataSources;
            if (!dataSources.contains(that)) {
                throw new DeveloperError('This data source is not shown.');
            }
            dataSources.remove(that, false);
        }
    });
};

var endScratch = new JulianDate();


/**
 * Calculate and return the availability interval for the index'th entry in timeColumn.
 *
 * @param  {Integer} index The index into the time column.
 * @param  {TableColumn} timeColumn The time column that applies to this data.
 * @param  {[TableStyle]} tableStyle The tableStyle.displayDuration is used if it is defined.
 * @return {TimeInterval} The time interval over which this entry is visible.
 */
function calculateAvailability(index, timeColumn, tableStyle) {
    var availability = new TimeIntervalCollection();
    var finishJulianDate;
    if (!defined(tableStyle) || !defined(tableStyle.displayDuration)) {
        finishJulianDate = timeColumn.finishJulianDates[index];
    } else {
        finishJulianDate = JulianDate.addMinutes(timeColumn.julianDates[index], tableStyle.displayDuration, endScratch);
    }
    var availabilityInterval = new TimeInterval({start: timeColumn.julianDates[index], stop: finishJulianDate});
    availability.addInterval(availabilityInterval);
    return availability;
}

/**
 * Calculate the "show" interval collection property, given the availability.
 * The show property has data=true/false over the period it is visible/invisible.
 * If availability is undefined, it has data=false over all possible time.
 *
 * @param  {[TimeIntervalCollection]} availability The availability interval, used to get the start and stop dates. Only the first interval in the collection is used.
 * @return {TimeIntervalCollectionProperty} Has data=false/true over the period this entry is invisible/visible (even if timeColumn is undefined).
 */
function calculateShow(availability) {
    var show = new TimeIntervalCollectionProperty();
    if (!defined(availability)) {
        show.intervals.addInterval(new TimeInterval({start: Iso8601.MINIMUM_VALUE, stop: Iso8601.MAXIMUM_VALUE, data: true}));
    } else {
        var start = availability.findInterval(0).start;
        var stop = availability.findInterval(0).stop;
        show.intervals.addInterval(new TimeInterval({start: Iso8601.MINIMUM_VALUE, stop: Iso8601.MAXIMUM_VALUE, data: false}));
        show.intervals.addInterval(new TimeInterval({start: start, stop: stop, data: true}));
    }
    return show;
}

// Set the features (entities) on this data source, using tableColumn to provide values and tableStyle for styling.
// Set the extent based on those entities.
function updateEntitiesAndExtent(dataSource) {
    var tableStructure = dataSource._tableStructure;
    var legendHelper = dataSource._legendHelper;
    var tableColumn = legendHelper.tableColumn;
    var tableStyle = legendHelper.tableStyle;
    var longitudeColumn = tableStructure.columnsByType[VarType.LON][0];
    var latitudeColumn = tableStructure.columnsByType[VarType.LAT][0];
    if (defined(longitudeColumn) && defined(latitudeColumn)) {
        // remove existing entities first
        dataSource._entityCollection.removeAll();

        var heightColumn = tableStructure.columnsByType[VarType.ALT][0];
        var timeColumn = tableStructure.columnsByType[VarType.TIME][0];

        var rowObjects = tableStructure.toRowObjects();
        var fallbackNameField = chooseFallbackNameField(tableStructure.getColumnNames());

        for (var i = 0; i < rowObjects.length; i++) {
            var rowObject = rowObjects[i];
            var objectId = createGuid();
            var entity = new Entity({
                id: objectId,
                name: rowObject.title || rowObject[fallbackNameField] || defaultEntityName
            });
            entity.description = describeRow(rowObject, tableStyle);
            entity.position = Cartesian3.fromDegrees(
                longitudeColumn.values[i],
                latitudeColumn.values[i],
                defined(heightColumn) ? heightColumn.values[i] : undefined
            );
            if (entity.propertyNames.indexOf('properties') === -1) {
                // not defined yet, but could be in future
                entity.addProperty('properties');
            }
            entity.properties = rowObject;

            var value = defined(tableColumn) ? tableColumn.indicesOrNumericalValues[i] : undefined;
            var color = legendHelper.getColorFromValue(value);
            var scale = legendHelper.getScaleFromValue(value);

            entity.availability = timeColumn && dataSource._availabilities && dataSource._availabilities[i];
            var show = calculateShow(entity.availability);

            //no image so use point
            if (!defined(tableStyle) || !defined(tableStyle.imageUrl) || tableStyle.imageUrl === '') {
                entity.point = {
                    outlineColor: new Color(0, 0, 0, 1),
                    outlineWidth: 1,
                    pixelSize: 8 * scale,
                    color: color,
                    show: show
                };
            } else {
                entity.billboard = {
                    horizontalOrigin : HorizontalOrigin.CENTER,
                    verticalOrigin : VerticalOrigin.BOTTOM,
                    image : tableStyle.imageUrl,
                    scale : scale,
                    color : color,
                    show : show
                };
            }
            dataSource._entityCollection.add(entity);
        }

        dataSource._changed.raiseEvent(dataSource);
        
        dataSource._extent = Rectangle.fromDegrees(
            longitudeColumn.minimumValue, latitudeColumn.minimumValue, longitudeColumn.maximumValue, latitudeColumn.maximumValue
        );
    }
}

function updateClock(dataSource, availabilityCollection) {
    var clock;
    if (!defined(dataSource._clock)) {
        if (!availabilityCollection.start.equals(Iso8601.MINIMUM_VALUE)) {
            var startTime = availabilityCollection.start;
            var stopTime = availabilityCollection.stop;
            var totalSeconds = JulianDate.secondsDifference(stopTime, startTime);
            var multiplier = Math.round(totalSeconds / 120.0);

            clock = new DataSourceClock();
            clock.startTime = JulianDate.clone(startTime);
            clock.stopTime = JulianDate.clone(stopTime);
            clock.clockRange = ClockRange.LOOP_STOP;
            clock.multiplier = multiplier;
            clock.currentTime = JulianDate.clone(startTime);
            clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
            dataSource._clock = clock;
            return true;
        }
    }
    return false;
}

function describeRow(rowObject, tableStyle) {
    if (!defined(rowObject) || rowObject === null) {
        return '';
    }
    tableStyle = defaultValue(tableStyle, defaultValue.EMPTY_OBJECT);

    var infoFields = defined(tableStyle.featureInfoFields) ? tableStyle.featureInfoFields : rowObject;
    if (infoFields instanceof Array) {
        // allow [ "FIELD1", "FIELD2" ] as a shorthand for { "FIELD1": "FIELD1", "FIELD2": "FIELD2" }
        var o = {};
        infoFields.map(function(s) { o[s] = s; } );
        infoFields = o;
    }

    var html = '<table class="cesium-infoBox-defaultTable">';
    for ( var key in infoFields) {
        if (infoFields.hasOwnProperty(key)) {
            var value = rowObject[key];
            var name = defined(tableStyle.featureInfoFields) ? infoFields[key] : key;
            if (defined(value)) {
                    //see if we should skip this in the details - starts with __
                if (key.substring(0, 2) === '__') {
                    continue;
                } else if (value instanceof JulianDate) {
                    value = JulianDate.toDate(value).toDateString();
                }
                if (typeof value === 'object') {
                    value = describeRow(value, tableStyle);
                } else {
                    value = formatPropertyValue(value);
                }
                html += '<tr><td>' + name + '</td><td>' + value + '</td></tr>';
            }
        }
    }
    html += '</table>';
    return html;
}

function chooseFallbackNameField(keys) {
    // Choose a name field by the same logic as Cesium's GeoJsonDataSource.
    // Following Cesium's approach, we override this with 'title' if it is truthy.
    //1) The first case-insensitive property with the name 'title',
    //2) The first case-insensitive property with the name 'name',
    //3) The first property containing the word 'title'.
    //4) The first property containing the word 'name',
    var nameProperty;
    var namePropertyPrecedence = Number.MAX_VALUE;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var lowerKey = key.toLowerCase();
        if (namePropertyPrecedence > 1 && lowerKey === 'title') {
            namePropertyPrecedence = 1;
            nameProperty = key;
            break;
        } else if (namePropertyPrecedence > 2 && lowerKey === 'name') {
            namePropertyPrecedence = 2;
            nameProperty = key;
        } else if (namePropertyPrecedence > 3 && /title/i.test(key)) {
            namePropertyPrecedence = 3;
            nameProperty = key;
        } else if (namePropertyPrecedence > 4 && /name/i.test(key)) {
            namePropertyPrecedence = 4;
            nameProperty = key;
        }
    }
    return nameProperty;
}

/**
 * Returns an array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 * Takes the current time into account if there is a time column and _avalabilities is defined.
 *
 * @param  {TableDataSource} dataSource The table data source.
 * @return {Array} An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source.
 */
function calculateRegionIndices(dataSource) {
    // As described in load, currently we only use the first possible region column.
    var regionDetail = dataSource._regionDetails[0];
    var tableStructure = dataSource._tableStructure;
    var regionColumnValues = regionDetail.column.values;
    // Wipe out the region names from the rows that do not apply at this time, if there is a time column.
    var timeColumn = tableStructure.columnsByType[VarType.TIME][0];
    if (defined(timeColumn) && dataSource._availabilities) {
        regionColumnValues = regionColumnValues.map(function(value, index) {
            return (dataSource._availabilities[index].contains(dataSource.clock.currentTime) ? value : undefined);
        });
    }
    // regionIndices will be an array the same length as regionProvider.regions, giving the index of each region into the table.
    var regionIndices = regionDetail.regionProvider.mapRegionsToIndicesInto(
        regionColumnValues,
        defined(regionDetail.disambigColumn) ? regionDetail.disambigColumn.values : undefined
    );
    return regionIndices;
}

/**
 * Creates and enables a new ImageryLayer onto terria, showing appropriately colored regions with feature descriptions.
 *
 * @param {TableDataSource} dataSource    The table data source.
 * @param {[Number]} layerIndex The layer index of the new imagery layer.
 * @param {[Array]} regionIndices An array the same length as regionProvider.regions, mapping each region into the relevant index into the table data source. If not provided, calculated.
 */
function setNewRegionImageryLayer(dataSource, layerIndex, regionIndices) {
    var catalogItem = dataSource._catalogItem;
    var regionDetail = dataSource._regionDetails[0];
    var legendHelper = dataSource._legendHelper;
    var tableStructure = dataSource._tableStructure;
    if (!defined(regionIndices)) {
        var regionIndices = calculateRegionIndices(dataSource);
    }

    var regionValues = regionIndices;  // Appropriate if no active column: color each region according to its index into the table.
    if (tableStructure.activeItems.length > 0) {
        var activeColumn = tableStructure.activeItems[0];
        regionValues = regionIndices.map(function(i) { return activeColumn.values[i]; });
        if (activeColumn.usesIndicesIntoUniqueValues) {
            // Convert the region's value to an index into the uniqueValues array.
            regionValues = regionValues.map(function(value) { return activeColumn.uniqueValues.indexOf(value); });
        }
    }

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
    var rowObjects = tableStructure.toRowObjects();
    var regionRowObjects = regionIndices.map(function(i) { return rowObjects[i]; });
    ImageryProviderHooks.addPickFeaturesHook(regionImageryProvider, function(results) {
        if (!defined(results) || results.length === 0) {
            return;
        }
        for (var i = 0; i < results.length; ++i) {
            var uniqueId = results[i].data.properties[regionDetail.regionProvider.uniqueIdProp];
            results[i].description = describeRow(regionRowObjects[uniqueId], dataSource._tableStyle);
        }
        return results;
    });
    dataSource._regionImageryLayer = ImageryLayerCatalogItem.enableLayer(catalogItem, regionImageryProvider, catalogItem.opacity, layerIndex);
    // Would like to move this leaflet-specific behavior somewhere better.
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
* Destroy the object and release resources
*
*/
TableDataSource.prototype.destroy = function() {
    return destroyObject(this);
};

module.exports = TableDataSource;

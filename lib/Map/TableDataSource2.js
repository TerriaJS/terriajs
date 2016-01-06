/*global require*/
"use strict";

/*
 * TableDataSource object for displaying geo-located datasets.
 */

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
var LegendHelper = require('../Map/LegendHelper');
var RegionProviderList = require('../Map/RegionProviderList');
var TableStructure = require('../Core/TableStructure');

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

    this._catalogItem = catalogItem;
    this._regionMappingDefinitionsUrl = defined(catalogItem) ? catalogItem.terria.regionMappingDefinitionsUrl : undefined;
    this._region = undefined; // for caching the region details

    knockout.track(this, ['_tableStructure', '_legendUrl']);  // track the tableStructure so that csvCatalogItem's concepts are maintained

    // Whenever the active item is changed, recalculate the legend and the display of all the entities.
    knockout.getObservable(this._tableStructure, 'activeItems').subscribe(function(activeItems) {
        var selectedColumn = activeItems[0];
        this._legendHelper = new LegendHelper(selectedColumn, this._tableStyle);
        this._legendUrl = this._legendHelper.legendUrl();
        updateEntitiesAndExtent(this);
        // var that = this;
        // this.regionPromise.then(function(region) {
        //     // TODO: not quite right yet - region promise should also get the IDs
        //     if (defined(that.activeItems[0])) {
        //         // only recolor the regions if there is a variable to base the recoloring on
        //         var regionValues = region.regionProvider.getRegionValues(that.activeItems[0].values, region.column.values, region.disambigColumn.values);
        //         var colorFunction = region.regionProvider.getColorLookupFunc(regionValues, that._legendHelper.getColorFromValue.bind(legendHelper));
        //         ImageryProviderHooks.addRecolorFunc(catalogItem._regionImageryProvider, colorFunction);
        //     }
        // });
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
     * Gets a promise which resolves to either:
     *   undefined if no regions.
     *   a "region" object with regionProvider, column and disambigColumn properties.
     * @type {Promise}
     */
    regionPromise: {
        get: function() {
            if (defined(this._region)) {
                // Return a promise to the cached region details.
                return when(this._region);
            }
            if (!this._regionMappingDefinitionsUrl) {
                return when();
            }
            var that = this;
            var regionProviderListPromise = RegionProviderList.fromUrl(this._regionMappingDefinitionsUrl);
            return regionProviderListPromise.then(function(regionProviderList) {
                // We have a region provider list, now get the region provider and load its region IDs (another async job).
                var rawRegionDetails = regionProviderList.chooseRegionProvider(that._tableStructure.getColumnNames());
                if (defined(rawRegionDetails)) {
                    console.log('Found match based on region', rawRegionDetails);
                    return rawRegionDetails.regionProvider.loadRegionIDs().then(function(requiredReload) {
                        // cache the details in a nicer format
                        that._region = {
                            regionProvider: rawRegionDetails.regionProvider,
                            column: that._tableStructure.getColumnWithName(rawRegionDetails.regionVariable),
                            disambigColumn: that._tableStructure.getColumnWithName(rawRegionDetails.disambigVariable),
                        };
                        console.log('Loaded region ids', requiredReload, that._region);
                        return that._region;
                    });
                } else {
                    console.log('No lat&lon or regional columns found in csv file.');
                    return undefined;
                }
            });
        }
    },

    /**
     * Once the region promise has resolved, gets the region details.
     * @type {Object} with regionProvider, column and disambigColumn properties
     */
    region: {
        get: function() {
            return this._region;
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

/**
 * Loads the Table from a csv string, replacing any existing data.
 * Creates the legend and the entities.
 *
 * @param {String} csvString The text to be processed.
 * @param {TableStyle} [tableStyle] The table style for this table.
 *
 */
TableDataSource.prototype.load = function(csvString, tableStyle) {
    this._tableStyle = tableStyle;
    this._tableStructure.loadFromCsv(csvString);
};

var endScratch = new JulianDate();

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

            var color = legendHelper.getColorFromValue(tableColumn && tableColumn.values[i]);
            var scale = legendHelper.getScaleFromValue(tableColumn && tableColumn.values[i]);

            var show = new TimeIntervalCollectionProperty();

            if (defined(timeColumn)) {
                var finish;
                if (!defined(tableStyle) || !defined(tableStyle.displayDuration)) {
                    finish = timeColumn.finishJulianDates[i];
                } else {
                    finish = JulianDate.addMinutes(timeColumn.julianDates[i], tableStyle.displayDuration, endScratch);
                }
                entity.availability = new TimeIntervalCollection();
                var availabilityInterval = new TimeInterval({start: timeColumn.julianDates[i], stop: finish});
                entity.availability.addInterval(availabilityInterval);
                show.intervals.addInterval(new TimeInterval({start: Iso8601.MINIMUM_VALUE, stop: Iso8601.MAXIMUM_VALUE, data: false}));
                show.intervals.addInterval(new TimeInterval({start: timeColumn.julianDates[i], stop: finish, data: true}));
            }
            else {
                show.intervals.addInterval(new TimeInterval({start: Iso8601.MINIMUM_VALUE, stop: Iso8601.MAXIMUM_VALUE, data: true}));
            }

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
        updateClock(dataSource);

        dataSource._extent = Rectangle.fromDegrees(
            longitudeColumn.minimumValue, latitudeColumn.minimumValue, longitudeColumn.maximumValue, latitudeColumn.maximumValue
        );
    }
}

function updateClock(dataSource) {
    var clock;
    if (!defined(dataSource._clock)) {
        var availability = dataSource._entityCollection.computeAvailability();
        if (!availability.start.equals(Iso8601.MINIMUM_VALUE)) {
            var startTime = availability.start;
            var stopTime = availability.stop;
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
* Destroy the object and release resources
*
*/
TableDataSource.prototype.destroy = function() {
    return destroyObject(this);
};

module.exports = TableDataSource;

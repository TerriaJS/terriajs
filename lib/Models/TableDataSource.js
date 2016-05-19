/*global require*/
"use strict";

var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var Color = require('terriajs-cesium/Source/Core/Color');
var createGuid = require('terriajs-cesium/Source/Core/createGuid');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var EntityCollection = require('terriajs-cesium/Source/DataSources/EntityCollection');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var HorizontalOrigin = require('terriajs-cesium/Source/Scene/HorizontalOrigin');
var Iso8601 = require('terriajs-cesium/Source/Core/Iso8601');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var TimeIntervalCollectionProperty = require('terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty');
var VerticalOrigin = require('terriajs-cesium/Source/Scene/VerticalOrigin');

var LegendHelper = require('../Models/LegendHelper');
var TableStructure = require('../Map/TableStructure');
var TableStyle = require('../Models/TableStyle');
var VarType = require('../Map/VarType');

var defaultEntityName = 'Site Data';

/**
* A DataSource for table-based data where each row corresponds to a single feature or point - not region-mapped.
* Generates Cesium entities for each row.
* Displaying the points requires a legend.
*
* @name TableDataSource
*
* @alias TableDataSource
* @constructor
* @param {TableStructure} [tableStructure] The Table Structure instance; defaults to a new one.
* @param {TableStyle} [tableStyle] The table style; defaults to undefined.
* @param {String} [name] A name to show in the legend if no columns are available.
*/
var TableDataSource = function(tableStructure, tableStyle, name) {
    this._name = name;
    this._changed = new CesiumEvent();
    this._error = new CesiumEvent();
    this._loading = new CesiumEvent();
    this._entityCollection = new EntityCollection(this);

    this._tableStructure = defined(tableStructure) ? tableStructure : new TableStructure();
    if (defined(tableStyle) && !(tableStyle instanceof TableStyle)) {
        throw new DeveloperError('Please pass a TableStyle object.');
    }

    /**
     * Gets the TableStyle object showing how to style the data.
     * @memberof TableDataSource.prototype
     * @type {TableStyle}
     */
    this.tableStyle = tableStyle;  // Can be undefined.

    this._legendHelper = undefined;
    this._legendUrl = undefined;
    this._extent = undefined;

    this.loadingData = false;

    // Track _tableStructure so that csvCatalogItem's concepts are maintained.
    // Track _legendUrl so that csvCatalogItem can update the legend if it changes.
    knockout.track(this, ['_tableStructure', '_legendUrl']);

    // Whenever the active item is changed, recalculate the legend and the display of all the entities.
    // This is triggered both on deactivation and on reactivation, ie. twice per change; it would be nicer to trigger once.
    knockout.getObservable(this._tableStructure, 'activeItems').subscribe(changedActiveItems.bind(null, this), this);
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
            var timeColumn = this._tableStructure.activeTimeColumn;
            if (defined(timeColumn)) {
                return timeColumn.clock;
            }
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
    }

});

/**
 * Creates a table structure from the csv provided, and attaches it to this datasource.
 * @param  {String} csvString Csv-formatted string.
 */

TableDataSource.prototype.loadFromCsv = function(csvString) {
    this._tableStructure.loadFromCsv(csvString);
};

function reviseLegendHelper(dataSource) {
    // Currently we only use the first possible region column.
    var activeColumn = dataSource._tableStructure.activeItems[0];
    var regionProvider = defined(dataSource._regionDetails) ? dataSource._regionDetails[0].regionProvider : undefined;
    dataSource._legendHelper = new LegendHelper(activeColumn, dataSource.tableStyle, regionProvider, dataSource.name);
    dataSource._legendUrl = dataSource._legendHelper.legendUrl();
}

/**
 * Call when the active column changes, or when the table data source is first shown.
 * Generates a LegendHelper.
 * For lat/lon files, updates entities and extent.
 * For region files, rebuilds and redisplays the regionImageryLayer.
 * @private
 */
function changedActiveItems(dataSource) {
    reviseLegendHelper(dataSource);
    updateEntitiesAndExtent(dataSource);  // Only does anything if there are lat & lon columns.
    dataSource._changed.raiseEvent(dataSource);
}


/**
 * Calculate the "show" interval collection property, given the availability.
 * The show property has data=true/false over the period it is visible/invisible.
 * If availability is undefined, it has data=false over all possible time.
 * @private
 * @param  {TimeIntervalCollection} [availability] The availability interval, used to get the start and stop dates. Only the first interval in the collection is used.
 * @return {TimeIntervalCollectionProperty} Has data=false/true over the period this entry is invisible/visible (even if timeColumn is undefined).
 */
function calculateShow(availability) {
    var show = new TimeIntervalCollectionProperty();
    if (!defined(availability) || !defined(availability.start)) {
        show.intervals.addInterval(new TimeInterval({start: Iso8601.MINIMUM_VALUE, stop: Iso8601.MAXIMUM_VALUE, data: true}));
    } else {
        var start = availability.findInterval(0).start;
        var stop = availability.findInterval(0).stop;
        show.intervals.addInterval(new TimeInterval({start: Iso8601.MINIMUM_VALUE, stop: Iso8601.MAXIMUM_VALUE, data: false}));
        show.intervals.addInterval(new TimeInterval({start: start, stop: stop, data: true}));
    }
    return show;
}

// Adds a point of the given scale, color and show (availability) to the entity.
// If there is an image defined in the tableColumnStyle, use a billboard instead.
function addPointToEntity(entity, tableColumnStyle, scale, color, show) {
    //no image so use point
    if (!defined(tableColumnStyle) || !defined(tableColumnStyle.imageUrl) || tableColumnStyle.imageUrl === '') {
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
            image : tableColumnStyle.imageUrl,
            scale : scale,
            color : color,
            show : show
        };
    }
}

// Effectively just does entity.properties = properties, but adding the property 'properties' to entity if needed.
function setEntityProperties(entity, properties, columnAliases) {
    if (entity.propertyNames.indexOf('properties') === -1) {
        // not defined yet, but could be in future
        entity.addProperty('properties');
    }
    entity.properties = properties;
    entity.properties._terria_columnAliases = columnAliases;
}

// Set the features (entities) on this data source, using tableColumn to provide values and tableStyle + legendHelper.tableColumnStyle for styling.
// Set the extent based on those entities.
function updateEntitiesAndExtent(dataSource) {
    var tableStructure = dataSource._tableStructure;
    var legendHelper = dataSource._legendHelper;
    var tableColumn = legendHelper.tableColumn;
    var tableStyle = legendHelper.tableStyle;
    var tableColumnStyle = legendHelper.tableColumnStyle;
    var longitudeColumn = tableStructure.columnsByType[VarType.LON][0];
    var latitudeColumn = tableStructure.columnsByType[VarType.LAT][0];
    if (defined(longitudeColumn) && defined(latitudeColumn)) {
        // remove existing entities first
        dataSource._entityCollection.removeAll();

        var heightColumn = tableStructure.columnsByType[VarType.ALT][0];
        var timeColumn = tableStructure.activeTimeColumn;

        var rowObjects = tableStructure.toRowObjects();
        var fallbackNameField = chooseFallbackNameField(tableStructure.getColumnNames());
        var rowDescriptions = tableStructure.toRowDescriptions(tableStyle && tableStyle.featureInfoFields);

        for (var i = 0; i < rowObjects.length; i++) {
            if (!defined(latitudeColumn.values[i]) || !defined(longitudeColumn.values[i])) {
                console.log('Missing lat/lon on row ' + i);
                continue;
            }
            var rowObject = rowObjects[i];
            var objectId = createGuid();
            var entity = new Entity({
                id: objectId,
                name: rowObject.title || rowObject[fallbackNameField] || defaultEntityName
            });
            entity.description = rowDescriptions[i];
            entity.position = Cartesian3.fromDegrees(
                longitudeColumn.values[i],
                latitudeColumn.values[i],
                defined(heightColumn) ? heightColumn.values[i] : undefined
            );
            setEntityProperties(entity, rowObject, tableStructure.getColumnAliases());

            var value = defined(tableColumn) ? tableColumn.indicesOrValues[i] : undefined;
            var color = legendHelper.getColorFromValue(value);
            var scale = legendHelper.getScaleFromValue(value);
            entity.availability = timeColumn && timeColumn.availabilities && timeColumn.availabilities[i];
            var show = calculateShow(entity.availability);
            addPointToEntity(entity, tableColumnStyle, scale, color, show);
            dataSource._entityCollection.add(entity);
        }

        dataSource._extent = Rectangle.fromDegrees(
            longitudeColumn.minimumValue, latitudeColumn.minimumValue, longitudeColumn.maximumValue, latitudeColumn.maximumValue
        );
    }
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
*/
TableDataSource.prototype.destroy = function() {
    // Do we need to explicitly unsubscribe from the clock?
    return destroyObject(this);
};

module.exports = TableDataSource;

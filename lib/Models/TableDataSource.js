/*global require*/
"use strict";

var i18next = require("i18next").default;
var CallbackProperty = require("terriajs-cesium/Source/DataSources/CallbackProperty")
  .default;
var Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var createGuid = require("terriajs-cesium/Source/Core/createGuid").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var destroyObject = require("terriajs-cesium/Source/Core/destroyObject")
  .default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var EntityCollection = require("terriajs-cesium/Source/DataSources/EntityCollection")
  .default;
var EntityCluster = require("terriajs-cesium/Source/DataSources/EntityCluster")
  .default;
var CesiumEvent = require("terriajs-cesium/Source/Core/Event").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var HorizontalOrigin = require("terriajs-cesium/Source/Scene/HorizontalOrigin")
  .default;
var Iso8601 = require("terriajs-cesium/Source/Core/Iso8601").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var SampledPositionProperty = require("terriajs-cesium/Source/DataSources/SampledPositionProperty")
  .default;
var SampledProperty = require("terriajs-cesium/Source/DataSources/SampledProperty")
  .default;
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var TimeIntervalCollection = require("terriajs-cesium/Source/Core/TimeIntervalCollection")
  .default;
var TimeIntervalCollectionPositionProperty = require("terriajs-cesium/Source/DataSources/TimeIntervalCollectionPositionProperty")
  .default;
var TimeIntervalCollectionProperty = require("terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty")
  .default;
var VerticalOrigin = require("terriajs-cesium/Source/Scene/VerticalOrigin")
  .default;

var Feature = require("../Models/Feature");
var LegendHelper = require("../Models/LegendHelper");
var TableStructure = require("../Map/TableStructure");
var TableStyle = require("../Models/TableStyle");
var TerriaError = require("../Core/TerriaError");
var VarType = require("../Map/VarType");

var defaultFeatureName = "Site Data";

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
 * @param {Boolean} [isUpdating] Is the underlying data going to update? Defaults to false.
 *                  If true, replaces constant feature properties and description with a CallbackProperty.
 */
var TableDataSource = function(
  terria,
  tableStructure,
  tableStyle,
  name,
  isUpdating
) {
  this._guid = createGuid(); // Used internally to give features a globally unique id.
  this._name = name;
  this._isUpdating = isUpdating || false;
  this._hasFeaturePerRow = undefined; // If this changes, need to remove old features.
  this._changed = new CesiumEvent();
  this._error = new CesiumEvent();
  this._loading = new CesiumEvent();
  this._entityCollection = new EntityCollection(this);
  this._entityCluster = new EntityCluster();
  this._terria = terria;

  this._tableStructure = defined(tableStructure)
    ? tableStructure
    : new TableStructure();
  if (defined(tableStyle) && !(tableStyle instanceof TableStyle)) {
    throw new DeveloperError("Please pass a TableStyle object.");
  }

  /**
   * Gets the TableStyle object showing how to style the data.
   * @memberof TableDataSource.prototype
   * @type {TableStyle}
   */
  this.tableStyle = tableStyle; // Can be undefined.

  this._legendHelper = undefined;
  this._legendUrl = undefined;
  this._extent = undefined;
  this._rowObjects = undefined; // The most recent properties and descriptions are saved here.
  this._rowDescriptions = undefined;

  this.loadingData = false;

  // Track _tableStructure so that csvCatalogItem's concepts are maintained.
  // Track _legendUrl so that csvCatalogItem can update the legend if it changes.
  // Track _extent so that the TableCatalogItem's rectangle updates properly, which also feeds into catalog item's canZoomTo property.
  knockout.track(this, ["_tableStructure", "_legendUrl", "_extent"]);

  // Whenever the active item is changed, recalculate the legend and the display of all the entities.
  // This is triggered both on deactivation and on reactivation, ie. twice per change; it would be nicer to trigger once.
  knockout
    .getObservable(this._tableStructure, "activeItems")
    .subscribe(changedActiveItems.bind(null, this), this);
};

Object.defineProperties(TableDataSource.prototype, {
  /**
   * Gets a human-readable name for this instance.
   * @memberof TableDataSource.prototype
   * @type {String}
   */
  name: {
    get: function() {
      return this._name;
    }
  },
  /**
   * Gets the clock settings defined by the loaded data.  If
   * only static data exists, this value is undefined.
   * @memberof TableDataSource.prototype
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
   * Gets the collection of {@link Entity} instances.
   * @memberof TableDataSource.prototype
   * @type {EntityCollection}
   */
  entities: {
    get: function() {
      return this._entityCollection;
    }
  },
  /**
   * Gets a value indicating if the data source is currently loading data.
   * @memberof TableDataSource.prototype
   * @type {Boolean}
   */
  isLoading: {
    get: function() {
      return this.loadingData;
    }
  },
  /**
   * Gets a CesiumEvent that will be raised when the underlying data changes.
   * @memberof TableDataSource.prototype
   * @type {CesiumEvent}
   */
  changedEvent: {
    get: function() {
      return this._changed;
    }
  },
  /**
   * Gets a CesiumEvent that will be raised if an error is encountered during processing.
   * @memberof TableDataSource.prototype
   * @type {CesiumEvent}
   */
  errorEvent: {
    get: function() {
      return this._error;
    }
  },
  /**
   * Gets a CesiumEvent that will be raised when the data source either starts or stops loading.
   * @memberof TableDataSource.prototype
   * @type {CesiumEvent}
   */
  loadingEvent: {
    get: function() {
      return this._loading;
    }
  },

  /**
   * Gets the TableStructure object holding all the data.
   * @memberof TableDataSource.prototype
   * @type {TableStructure}
   */
  tableStructure: {
    get: function() {
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
  },

  /**
   * Gets or sets the clustering options for this data source. This object can be shared between multiple data sources.
   *
   * @memberof CustomDataSource.prototype
   * @type {EntityCluster}
   */
  clustering: {
    get: function() {
      return this._entityCluster;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value must be defined.");
      }
      //>>includeEnd('debug');
      this._entityCluster = value;
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
  var regionProvider = defined(dataSource._regionDetails)
    ? dataSource._regionDetails[0].regionProvider
    : undefined;
  dataSource._legendHelper = new LegendHelper(
    activeColumn,
    dataSource.tableStyle,
    regionProvider,
    dataSource.name
  );
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
  updateEntitiesAndExtent(dataSource); // Only does anything if there are lat & lon columns.
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
    show.intervals.addInterval(
      new TimeInterval({
        start: Iso8601.MINIMUM_VALUE,
        stop: Iso8601.MAXIMUM_VALUE,
        data: true
      })
    );
  } else {
    var start = availability.start;
    var stop = availability.stop;
    show.intervals.addInterval(
      new TimeInterval({
        start: Iso8601.MINIMUM_VALUE,
        stop: Iso8601.MAXIMUM_VALUE,
        data: false
      })
    );
    show.intervals.addInterval(
      new TimeInterval({ start: start, stop: stop, data: true })
    );
  }
  return show;
}

// Adds a point of the given scale or pixelSize, color and show (availability) to the entity.
// If there is an image defined in the tableColumnStyle, use a billboard instead.
function addPointToEntity(
  entity,
  tableColumnStyle,
  scale,
  pixelSize,
  color,
  show
) {
  //no image so use point
  if (
    !defined(tableColumnStyle) ||
    !defined(tableColumnStyle.imageUrl) ||
    tableColumnStyle.imageUrl === ""
  ) {
    entity.point = {
      outlineColor: new Color(0, 0, 0, 1),
      outlineWidth: 1,
      pixelSize: pixelSize,
      color: color,
      show: show
    };
  } else {
    entity.billboard = {
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.BOTTOM,
      image: tableColumnStyle.imageUrl,
      scale: scale,
      color: color,
      show: show
    };
  }
}

function getPositionOfRowNumber(specialColumns, rowNumber) {
  if (
    !defined(specialColumns.latitude.values[rowNumber]) ||
    !defined(specialColumns.longitude.values[rowNumber])
  ) {
    console.log("Missing lat/lon on row " + rowNumber);
    return;
  }
  return Cartesian3.fromDegrees(
    specialColumns.longitude.values[rowNumber],
    specialColumns.latitude.values[rowNumber],
    defined(specialColumns.height) && !isNaN(specialColumns.height)
      ? specialColumns.height.values[rowNumber]
      : undefined
  );
}

function setOneFeaturePerRow(dataSource, tableStructure, specialColumns) {
  // These two subfunctions are only used for POLLED csv items.
  // If tableStructure.idColumnNameOrIds (from csvItem.idColumns) is not specified, use the row number to link rows.
  function getRowDescriptionPropertyCallbackForRow(rowNumber) {
    return function callback() {
      return dataSource._rowDescriptions[rowNumber];
    };
  }
  function getRowPropertiesPropertyCallbackForRow(rowNumber) {
    return function callback() {
      var properties = dataSource._rowObjects[rowNumber].string;
      properties._terria_columnAliases = tableStructure.getColumnAliases();
      properties._terria_numericalProperties =
        dataSource._rowObjects[rowNumber].number;
      return properties;
    };
  }

  var legendHelper = dataSource._legendHelper;
  var tableColumnStyle = legendHelper.tableColumnStyle;
  var fallbackNameField = chooseFallbackNameField(
    tableStructure.getColumnNames()
  );

  // If there more entities already exist than there are in the table,
  // remove the extras.
  var entities = dataSource._entityCollection;
  if (entities.values.length > dataSource._rowObjects.length) {
    for (
      var i = dataSource._rowObjects.length;
      i < entities.values.length;
      i++
    ) {
      entities.removeById(dataSource._guid + "-" + i);
    }
  }
  // Simply overwrite the others, and add to the collection if there are more.
  var isNewFeature;
  var nanErrorDisplayed = false;
  for (i = 0; i < dataSource._rowObjects.length; i++) {
    if (
      !defined(specialColumns.latitude.values[i]) ||
      !defined(specialColumns.longitude.values[i])
    ) {
      // console.log('Missing lat/lon on row ' + i);
      continue;
    }
    if (
      isNaN(specialColumns.latitude.values[i]) ||
      isNaN(specialColumns.longitude.values[i])
    ) {
      if (!nanErrorDisplayed) {
        // Only show this error once even if there are lots of badly formed rows
        dataSource._terria.error.raiseEvent(
          new TerriaError({
            sender: dataSource,
            title: i18next.t("models.tableData.unsupportedCharactersTitle"),
            message: i18next.t(
              "models.tableData.unsupportedCharactersMessage",
              {
                longitude: specialColumns.longitude.values[i],
                latitude: specialColumns.latitude.values[i]
              }
            )
          })
        );
        nanErrorDisplayed = true;
      }
      continue;
    }
    var rowObject = dataSource._rowObjects[i].string;
    var feature = entities.getById(dataSource._guid + "-" + i);
    isNewFeature = !defined(feature);
    if (isNewFeature) {
      feature = new Feature({
        id: dataSource._guid + "-" + i
      });
    }
    feature.name =
      rowObject.title || rowObject[fallbackNameField] || defaultFeatureName;
    feature.position = getPositionOfRowNumber(specialColumns, i);
    if (!dataSource._isUpdating) {
      feature.description = dataSource._rowDescriptions[i];
      rowObject._terria_columnAliases = tableStructure.getColumnAliases();
      rowObject._terria_numericalProperties = dataSource._rowObjects[i].number;
      feature.properties = rowObject;
    } else {
      feature.description = new CallbackProperty(
        getRowDescriptionPropertyCallbackForRow(i),
        false
      );
      feature.properties = new CallbackProperty(
        getRowPropertiesPropertyCallbackForRow(i),
        false
      );
    }

    var value = defined(specialColumns.value)
      ? specialColumns.value.values[i]
      : undefined;
    var color = legendHelper.getColorFromValue(value);
    var scale = legendHelper.getScaleFromValue(value);
    if (
      specialColumns.time &&
      specialColumns.time.timeIntervals &&
      specialColumns.time.timeIntervals[i]
    ) {
      feature.availability = new TimeIntervalCollection([
        specialColumns.time.timeIntervals[i]
      ]);
    }
    var show = calculateShow(feature.availability);
    addPointToEntity(feature, tableColumnStyle, scale, scale * 8, color, show);
    if (isNewFeature) {
      dataSource._entityCollection.add(feature);
    }
  }
}

/**
 * Set up features which are maintained over time, using their ids.
 * Only appropriate if there is a time column and idColumns are specified.
 * @private
 */
function setOneFeaturePerId(dataSource, tableStructure, specialColumns) {
  var legendHelper = dataSource._legendHelper;
  var tableColumnStyle = legendHelper.tableColumnStyle;
  var fallbackNameField = chooseFallbackNameField(
    tableStructure.getColumnNames(),
    tableStructure.idColumnNames
  );
  var rowNumbersMap = tableStructure.getIdMapping();
  var columnAliases = tableStructure.getColumnAliases();
  var isSampled = tableStructure.isSampled;
  var shouldInterpolateColorAndSize =
    isSampled &&
    (defined(specialColumns.value) && !specialColumns.value.isEnum);

  if (dataSource._hasFeaturePerRow) {
    // If for any reason features were set up per row already (eg. if time column was set after first load),
    // remove those features.
    dataSource._entityCollection.removeAll();
  }

  function getChartDetailsFunction(tableStructure, rowNumbersForThisFeatureId) {
    return function() {
      return tableStructure.getChartDetailsForRowNumbers(
        rowNumbersForThisFeatureId
      );
    };
  }

  for (var key in rowNumbersMap) {
    if (rowNumbersMap.hasOwnProperty(key)) {
      var firstRow = dataSource._rowObjects[rowNumbersMap[key][0]].string;
      var featureId = dataSource._guid + "-" + key;
      var feature = dataSource._entityCollection.getById(featureId);
      var isExistingFeature = defined(feature);
      if (!isExistingFeature) {
        feature = new Feature({
          id: featureId,
          name:
            firstRow.title || firstRow[fallbackNameField] || defaultFeatureName
        });
      }
      var availability = new TimeIntervalCollection();

      var position;
      if (isSampled) {
        position = new SampledPositionProperty();
      } else {
        position = new TimeIntervalCollectionPositionProperty();
      }
      // Color and size are never interpolated when they are drawn from a text column.
      var color, scale, pixelSize;
      if (shouldInterpolateColorAndSize) {
        color = new SampledProperty(Color);
        scale = new SampledProperty(Number);
        pixelSize = new SampledProperty(Number);
      } else {
        color = new TimeIntervalCollectionProperty();
        scale = new TimeIntervalCollectionProperty();
        pixelSize = new TimeIntervalCollectionProperty();
      }
      var properties = new TimeIntervalCollectionProperty();
      var description = new TimeIntervalCollectionProperty();

      var rowNumbersForThisFeatureId = rowNumbersMap[key];
      var chartDetailsFunction = getChartDetailsFunction(
        tableStructure,
        rowNumbersForThisFeatureId
      );
      for (var i = 0; i < rowNumbersForThisFeatureId.length; i++) {
        var rowNumber = rowNumbersForThisFeatureId[i];
        var point = getPositionOfRowNumber(specialColumns, rowNumber);
        var interval = specialColumns.time.timeIntervals[rowNumber];
        availability.addInterval(interval);

        // Add the feature properties.
        var propertiesInterval = interval.clone();
        propertiesInterval.data = dataSource._rowObjects[rowNumber].string;
        propertiesInterval.data._terria_columnAliases = columnAliases;
        propertiesInterval.data._terria_numericalProperties =
          dataSource._rowObjects[rowNumber].number;
        if (defined(rowNumbersForThisFeatureId)) {
          propertiesInterval.data._terria_getChartDetails = chartDetailsFunction;
        }

        properties.intervals.addInterval(propertiesInterval);

        // Add the feature description.
        var descriptionInterval = interval.clone();
        descriptionInterval.data = dataSource._rowDescriptions[rowNumber];
        description.intervals.addInterval(descriptionInterval);

        // Add the feature position.
        if (isSampled) {
          if (defined(point)) {
            position.addSample(
              specialColumns.time.julianDates[rowNumber],
              point
            );
          }
        } else {
          var positionInterval = interval.clone();
          positionInterval.data = point;
          position.intervals.addInterval(positionInterval);
        }

        // Add the feature color, scale and pixelSize.
        var value = defined(specialColumns.value)
          ? specialColumns.value.values[rowNumber]
          : undefined;
        if (shouldInterpolateColorAndSize) {
          var julianDate = specialColumns.time.julianDates[rowNumber];
          color.addSample(julianDate, legendHelper.getColorFromValue(value));
          scale.addSample(julianDate, legendHelper.getScaleFromValue(value));
          pixelSize.addSample(
            julianDate,
            legendHelper.getScaleFromValue(value) * 8
          );
        } else {
          var colorInterval = interval.clone();
          var scaleInterval = interval.clone();
          var pixelSizeInterval = interval.clone();
          colorInterval.data = legendHelper.getColorFromValue(value);
          scaleInterval.data = legendHelper.getScaleFromValue(value);
          pixelSizeInterval.data = legendHelper.getScaleFromValue(value) * 8;
          color.intervals.addInterval(colorInterval);
          scale.intervals.addInterval(scaleInterval);
          pixelSize.intervals.addInterval(pixelSizeInterval);
        }
      }
      // We show this feature only when the time intervals say to.
      // Note this means a missing data point for one feature will make it disappear
      // for that period, not be interpolated.
      // We could enhance this by adding a TableStructure version of the TableColumn
      // timeInterval calculation, which uses idColumnNames and works per-feature.
      var show = calculateShow(availability);
      // Update the feature in as few commands as possible, since each one triggers a definitionChanged event.
      feature.availability = availability;
      feature.position = position;
      feature.properties = properties;
      feature.description = description;
      // Turn the color, scale, pixelSize and "show" into a Cesium entity.
      addPointToEntity(
        feature,
        tableColumnStyle,
        scale,
        pixelSize,
        color,
        show
      );
      if (!isExistingFeature) {
        dataSource._entityCollection.add(feature);
      }
    }
  }
}

// Set the features (entities) on this data source, using tableColumn to provide values and tableStyle + legendHelper.tableColumnStyle for styling.
// Set the extent based on those entities.
function updateEntitiesAndExtent(dataSource) {
  var tableStructure = dataSource._tableStructure;
  var legendHelper = dataSource._legendHelper;
  var tableStyle = legendHelper.tableStyle;
  var specialColumns = {
    longitude: tableStructure.columnsByType[VarType.LON][0],
    latitude: tableStructure.columnsByType[VarType.LAT][0],
    height: tableStructure.columnsByType[VarType.ALT][0],
    time: tableStructure.activeTimeColumn,
    value: legendHelper.tableColumn
  };
  if (defined(specialColumns.longitude) && defined(specialColumns.latitude)) {
    var rowObjects = tableStructure.toStringAndNumberRowObjects();
    var rowDescriptions = tableStructure.toRowDescriptions(
      tableStyle && tableStyle.featureInfoFields
    );
    dataSource._rowObjects = rowObjects;
    dataSource._rowDescriptions = rowDescriptions;
    var entities = dataSource._entityCollection;
    entities.suspendEvents();
    if (
      defined(specialColumns.time) &&
      defined(tableStructure.idColumnNames) &&
      tableStructure.idColumnNames.length > 0
    ) {
      setOneFeaturePerId(dataSource, tableStructure, specialColumns);
      dataSource._hasFeaturePerRow = false;
    } else {
      setOneFeaturePerRow(dataSource, tableStructure, specialColumns);
      dataSource._hasFeaturePerRow = true;
    }
    entities.resumeEvents();

    // Generate extent from all positions that aren't NaN
    dataSource._extent = Rectangle.fromCartographicArray(
      specialColumns.longitude.values
        .map((lon, i) => [lon, specialColumns.latitude.values[i]])
        .filter(pos => pos.every(v => !isNaN(v)))
        .map(pos => Cartographic.fromDegrees(...pos))
    );
  }
}

function chooseFallbackNameField(keys, idColumnNames) {
  // Choose a name field by the same logic as Cesium's GeoJsonDataSource.
  // Following Cesium's approach, we override this with 'title' if it is truthy.
  //1) The first case-insensitive property with the name 'title',
  //2) The first case-insensitive property with the name 'name',
  //3) The first property containing the word 'title',
  //4) The first property containing the word 'name',
  //5) The first idColumnNames, if provided.
  var nameProperty;
  var namePropertyPrecedence = Number.MAX_VALUE;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var lowerKey = key.toLowerCase();
    if (namePropertyPrecedence > 1 && lowerKey === "title") {
      namePropertyPrecedence = 1;
      nameProperty = key;
      break;
    } else if (namePropertyPrecedence > 2 && lowerKey === "name") {
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
  return nameProperty || (idColumnNames && idColumnNames[0]);
}

/**
 * Destroy the object and release resources
 */
TableDataSource.prototype.destroy = function() {
  // Do we need to explicitly unsubscribe from the clock?
  return destroyObject(this);
};

module.exports = TableDataSource;

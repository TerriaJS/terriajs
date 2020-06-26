"use strict";

/*global require*/
var clone = require("terriajs-cesium/Source/Core/clone").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var Resource = require("terriajs-cesium/Source/Core/Resource").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var inherit = require("../Core/inherit");
var Metadata = require("./Metadata");
var TableCatalogItem = require("./TableCatalogItem");
var TerriaError = require("../Core/TerriaError");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var readText = require("../Core/readText");
var TableStructure = require("../Map/TableStructure");
var i18next = require("i18next").default;

/**
 * A {@link CatalogItem} representing CSV data.
 *
 * @alias CsvCatalogItem
 * @constructor
 * @extends TableCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the CSV data.
 * @param {Object} [options] Initial values.
 * @param {Boolean} [options.isCsvForCharting] Whether this is solely for charting
 * @param {TableStyle} [options.tableStyle] An initial table style can be supplied if desired.
 */
var CsvCatalogItem = function(terria, url, options) {
  TableCatalogItem.call(this, terria, url, options);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * Gets or sets the character set of the data, which overrides the file information if present. Default is undefined.
   * This property is observable.
   * @type {String}
   */
  this.charSet = undefined;

  /**
   * Some catalog items are created from other catalog items.
   * Record here so that the user (eg. via "About this Dataset") can reference the source item.
   * @type {CatalogItem}
   */
  this.sourceCatalogItem = undefined;
  this.sourceCatalogItemId = undefined;
  this.regenerationOptions = {};

  /**
   * Options for the value of the animation timeline at start. Valid options in config file are:
   *     initialTimeSource: "present"                            // closest to today's date
   *     initialTimeSource: "start"                              // start of time range of animation
   *     initialTimeSource: "end"                                // end of time range of animation
   *     initialTimeSource: An ISO8601 date e.g. "2015-08-08"    // specified date or nearest if date is outside range
   * @type {String}
   */
  this.initialTimeSource = undefined;

  /**
   * Flag to be used for charting, whether this item is generated for the purposes of drawing a chart
   * @type {Boolean}
   */
  this.isCsvForCharting = defaultValue(options.isCsvForCharting, false);

  /**
   * A HTML string to show above the chart as a disclaimer
   * @type {String}
   * @default null
   */
  this.chartDisclaimer = defaultValue(options.chartDisclaimer, null);
};

inherit(TableCatalogItem, CsvCatalogItem);

Object.defineProperties(CsvCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf CsvCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "csv";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'CSV'.
   * @memberOf CsvCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.csv.name");
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf CsvCatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    //TODO: return metadata if tableDataSource defined
    get: function() {
      var result = new Metadata();
      result.isLoading = false;
      result.dataSourceErrorMessage = i18next.t(
        "models.csv.dataSourceErrorMessage"
      );
      result.serviceErrorMessage = i18next.t("models.csv.serviceErrorMessage");
      return result;
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
   * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
   * for a share link.
   * @memberOf ImageryLayerCatalogItem.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return CsvCatalogItem.defaultPropertiesForSharing;
    }
  }
});

CsvCatalogItem.defaultUpdaters = clone(TableCatalogItem.defaultUpdaters);

CsvCatalogItem.defaultUpdaters.sourceCatalogItem = function() {
  // TODO: For now, don't update from JSON. Better to do it via an id?
};

Object.freeze(CsvCatalogItem.defaultUpdaters);

CsvCatalogItem.defaultSerializers = clone(TableCatalogItem.defaultSerializers);

CsvCatalogItem.defaultSerializers.sourceCatalogItem = function() {
  // TODO: For now, don't serialize. Can we do it via an id?
};

Object.freeze(CsvCatalogItem.defaultSerializers);

CsvCatalogItem.defaultPropertiesForSharing = clone(
  TableCatalogItem.defaultPropertiesForSharing
);
CsvCatalogItem.defaultPropertiesForSharing.push("isCsvForCharting");
CsvCatalogItem.defaultPropertiesForSharing.push("dataUrl");
CsvCatalogItem.defaultPropertiesForSharing.push("sourceCatalogItemId");
CsvCatalogItem.defaultPropertiesForSharing.push("regenerationOptions");

Object.freeze(CsvCatalogItem.defaultPropertiesForSharing);

/**
 * Loads the TableStructure from a csv file.
 *
 * @param {CsvCatalogItem} item Item that tableDataSource is created for
 * @param {String} csvString String in csv format.
 * @return {Promise} A promise that resolves to true if it is a recognised format.
 * @private
 */
function loadTableFromCsv(item, csvString) {
  var tableStyle = item._tableStyle;
  var options = {
    idColumnNames: item.idColumns,
    isSampled: item.isSampled,
    initialTimeSource: item.initialTimeSource,
    displayDuration: tableStyle.displayDuration,
    replaceWithNullValues: tableStyle.replaceWithNullValues,
    replaceWithZeroValues: tableStyle.replaceWithZeroValues,
    columnOptions: tableStyle.columns // may contain per-column replacements for these
  };
  var tableStructure = new TableStructure(undefined, options);
  tableStructure.loadFromCsv(csvString);
  return item.initializeFromTableStructure(tableStructure);
}

/**
 * Regenerates a chart from a given itemJson
 * @param {Object} itemsJson The items as simple JSON data. The JSON should be in the form of an object literal, not a
 *                 string
 * @return {Promise} A promise which resolves to the newly created CsvCatalogItem
 */
CsvCatalogItem.regenerateChartItem = function(itemJson, terria) {
  // we have a csv with url so regenerate, reimplements some of `makeNewCatalogItem()` in
  // lib/ReactViews/Custom/Chart/ChartExpandAndDownloadButtons.jsx
  const newItem = new CsvCatalogItem(terria, itemJson.url, {
    tableStyle: itemJson.tableStyle,
    isCsvForCharting: true
  });
  const group = terria.catalog.chartDataGroup;
  newItem.name = itemJson.name;
  newItem.id = group.uniqueId + "/" + itemJson.name;
  group.isOpen = true;
  group.add(newItem);
  newItem.isLoading = true;
  newItem.isMappable = false;
  terria.catalog.addChartableItem(newItem); // Notify the chart panel so it shows "loading".

  // if we have sourceCatalogItemId and it's a SOS item, use the tablestructure from that to load
  if (itemJson.sourceCatalogItemId) {
    const sourceCatalogItem =
      terria.catalog.shareKeyIndex[itemJson.sourceCatalogItemId];
    newItem.sourceCatalogItem = sourceCatalogItem;
    if (
      defined(sourceCatalogItem) &&
      sourceCatalogItem.type === "sos" &&
      defined(itemJson.regenerationOptions) &&
      defined(sourceCatalogItem.load)
    ) {
      return newItem
        .updateFromJson(itemJson)
        .then(sourceCatalogItem.load.bind(sourceCatalogItem))
        .then(() => {
          newItem.data = sourceCatalogItem.loadIntoTableStructure(
            itemJson.url,
            itemJson.regenerationOptions
          );
          newItem.isEnabled = true;
        })
        .then(newItem.load.bind(newItem))
        .then(() =>
          newItem.applyTableStyleColumnsToStructure(
            itemJson.tableStyle,
            newItem.tableStructure
          )
        );
    } else {
      console.error(
        "Csv regeneration referenced a sourceCatalogItemId that we could not look up"
      );
    }
  }

  newItem.isEnabled = true; // This loads it as well.

  return newItem
    .updateFromJson(itemJson)
    .then(newItem.load.bind(newItem))
    .then(function() {
      return newItem.applyTableStyleColumnsToStructure(
        itemJson.tableStyle,
        newItem.tableStructure
      );
    });
};
/**
 * Loads csv data from a URL into a (usually temporary) table structure.
 * This is required by Chart.jsx for any non-csv format.
 * @param  {String} url The URL.
 * @return {Promise} A promise which resolves to a table structure.
 */
CsvCatalogItem.prototype.loadIntoTableStructure = function(url) {
  const item = this;
  const tableStructure = new TableStructure();
  // Note item is only used for its 'terria', 'forceProxy' and 'cacheDuration' properties
  // (which are all defined on CatalogMember, the base class of CatalogItem).
  return loadTextWithMime(proxyCatalogItemUrl(item, url, "0d")).then(
    tableStructure.loadFromCsv.bind(tableStructure)
  );
};

/**
 * Every <polling.seconds> seconds, if the csvItem is enabled,
 * request data from the polling.url || url, and update/replace this._tableStructure.
 */
CsvCatalogItem.prototype.startPolling = function() {
  const polling = this.polling;

  if (defined(polling.seconds) && polling.seconds > 0) {
    var item = this;

    // Initialise polling and timer variables, because they might not be set yet
    polling.isPolling = item.isEnabled;

    if (!defined(polling.nextScheduledUpdateTime)) {
      const tempDate = new Date();
      tempDate.setSeconds(new Date().getSeconds() + polling.seconds);
      polling.nextScheduledUpdateTime = tempDate;
    }

    this._pollTimeout = setTimeout(function() {
      if (item.isEnabled) {
        polling.isPolling = true;
        item
          .loadIntoTableStructure(polling.url || item.url)
          .then(function(newTable) {
            // Update timestamp
            const tempDate = new Date();
            tempDate.setSeconds(new Date().getSeconds() + polling.seconds);
            polling.nextScheduledUpdateTime = tempDate;

            if (
              item._tableStructure.hasLatitudeAndLongitude !==
                newTable.hasLatitudeAndLongitude ||
              item._tableStructure.columns.length !== newTable.columns.length
            ) {
              console.log(
                "The newly polled data is incompatible with the old data."
              );
              throw new DeveloperError(
                "The newly polled data is incompatible with the old data."
              );
            }
            // Maintain active item and colors.  Assume same column ordering for now.
            item._tableStructure.columns.forEach(function(column, i) {
              newTable.columns[i].isActive = column.isActive;
              newTable.columns[i].color = column.color;
            });
            if (polling.replace) {
              item._tableStructure.columns = newTable.columns;
            } else {
              if (defined(item.idColumns) && item.idColumns.length > 0) {
                item._tableStructure.merge(newTable);
              } else {
                item._tableStructure.append(newTable);
              }
            }
          });
      }
      // update isPolling - if the item is disabled then we are not polling
      polling.isPolling = false;

      // Note this means the timer keeps going even when you remove (disable) the item,
      // but it doesn't actually request new data any more.
      // If the item is re-enabled, the same timer just starts picking it up again.
      item.startPolling();
    }, polling.seconds * 1000);
  }
};

/**
 * @returns {Promise} A promise that resolves when the load is complete, or undefined if the function is already loaded.
 */
CsvCatalogItem.prototype._load = function() {
  var that = this;
  const sourceCatalogItem = this.terria.catalog.shareKeyIndex[
    this.sourceCatalogItemId
  ];

  const sourceIsSos = sourceCatalogItem && sourceCatalogItem.type === "sos";
  const urlToUse = this.url || this.dataUrl;
  // For sos sourced charts, we need it to be ready first so we can assign the promise from
  // SensorObservationServiceCatalogItem's `loadIntoTableStructure` to data and load it that way
  // Otherwise we don't know how to parse the result via loadTableFromCsv
  if (!defined(this.data) && sourceIsSos) {
    return;
  }
  if (defined(this.data)) {
    return when(that.data, function(data) {
      if (typeof Blob !== "undefined" && data instanceof Blob) {
        return readText(data).then(function(text) {
          return loadTableFromCsv(that, text);
        });
      } else if (typeof data === "string") {
        return loadTableFromCsv(that, data);
      } else if (data instanceof TableStructure) {
        that.applyTableStyleColumnsToStructure(that._tableStyle, data);
        return that.initializeFromTableStructure(data);
      } else {
        throw new TerriaError({
          sender: that,
          title: i18next.t("models.csv.unexpectedTypeTitle"),
          message:
            i18next.t("models.csv.unexpectedTypeMessage", {
              appName: that.terria.appName
            }) +
            '<a href="mailto:' +
            that.terria.supportEmail +
            '">' +
            that.terria.supportEmail +
            "</a>."
        });
      }
    });
  } else if (defined(urlToUse)) {
    var overrideMimeType;
    if (defined(that.charSet)) {
      overrideMimeType = "text/csv; charset=" + that.charSet;
    }
    return loadTextWithMime(
      proxyCatalogItemUrl(that, urlToUse, "1d"),
      undefined,
      overrideMimeType
    )
      .then(function(text) {
        return loadTableFromCsv(that, text);
      })
      .otherwise(function(e) {
        throw new TerriaError({
          sender: that,
          title: i18next.t("models.csv.unableToLoadTitle"),
          message: i18next.t("models.csv.unableToLoadMessage", {
            message: e.message || e.response
          })
        });
      });
  } else {
    throw new TerriaError({
      sender: that,
      title: i18next.t("models.csv.unableToLoadItemTitle"),
      message: i18next.t("models.csv.unableToLoadItemMessage")
    });
  }
};

/**
 * The same as terriajs-cesium/Source/Core/loadText, but with the ability to pass overrideMimeType through to loadWithXhr.
 * @private
 */
function loadTextWithMime(url, headers, overrideMimeType) {
  return Resource.fetch({
    url: url,
    headers: headers,
    overrideMimeType: overrideMimeType
  });
}

module.exports = CsvCatalogItem;

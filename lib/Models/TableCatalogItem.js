"use strict";

/*global require*/
var clone = require("terriajs-cesium/Source/Core/clone").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var ImagerySplitDirection = require("terriajs-cesium/Source/Scene/ImagerySplitDirection")
  .default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var TimeIntervalCollection = require("terriajs-cesium/Source/Core/TimeIntervalCollection")
  .default;

var CatalogItem = require("./CatalogItem");
var ChartData = require("../Charts/ChartData");
var inherit = require("../Core/inherit");
var overrideProperty = require("../Core/overrideProperty");
var Polling = require("./Polling");
var RegionMapping = require("./RegionMapping");
var standardCssColors = require("../Core/standardCssColors");
var TableDataSource = require("../Models/TableDataSource");
var TableStyle = require("../Models/TableStyle");
var TerriaError = require("../Core/TerriaError");
var TableStructure = require("../Map/TableStructure");
var VarType = require("../Map/VarType");
var i18next = require("i18next").default;

var DEFAULT_ID_COLUMN = "id";

/**
 * An abstract {@link CatalogItem} representing tabular data.
 * Extend this class for csv or other data by providing two critical functions:
 * _load and (optionally) startPolling.
 * You can also override concepts for greater control over the display.
 *
 * @alias TableCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the data.
 * @param {Object} [options] Initial values.
 * @param {TableStyle} [options.tableStyle] An initial table style can be supplied if desired.
 */
var TableCatalogItem = function(terria, url, options) {
  CatalogItem.call(this, terria);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._tableStructure = undefined;
  // Handle tableStyle as any of: undefined, a regular object, or a TableStyle object. Convert all to TableStyle objects.
  if (defined(options.tableStyle)) {
    if (options.tableStyle instanceof TableStyle) {
      this._tableStyle = options.tableStyle;
    } else {
      this._tableStyle = new TableStyle(options.tableStyle);
    }
  } else {
    this._tableStyle = new TableStyle(); // Start with one so defaultSerializers.tableStyle will work.
  }
  this._dataSource = undefined;
  this._regionMapping = undefined;
  this._rectangle = undefined;
  this._pollTimeout = undefined; // Used internally to store the polling timeout id.

  this.url = url;

  /**
   * Gets or sets the data, represented as a binary Blob, a string, or a Promise for one of those things.
   * If this property is set, {@link CatalogItem#url} is ignored.
   * This property is observable.
   * @type {Blob|String|Promise}
   */
  this.data = undefined;

  /**
   * Gets or sets the URL from which the {@link TableCatalogItem#data} was obtained.  This is informational; it is not
   * used.  This propery is observable.
   * @type {String}
   */
  this.dataSourceUrl = undefined;

  /**
   * Gets or sets the opacity (alpha) of the data item, where 0.0 is fully transparent and 1.0 is
   * fully opaque.  This property is observable.
   * @type {Number}
   * @default 0.8
   */
  this.opacity = 0.8;

  /**
   * Keeps the layer on top of all other imagery layers.  This property is observable.
   * @type {Boolean}
   * @default false
   */
  this.keepOnTop = false;

  /**
   * Gets or sets polling information, such as the number of seconds between polls, and what url to poll.
   * @type {Polling}
   * @default undefined
   */
  this.polling = new Polling();

  /**
   * Should any warnings like failures in region mapping be displayed to the user?
   * @type {Boolean}
   * @default true
   */
  this.showWarnings = true;

  /**
   * Gets or sets the array of color strings used for chart lines.
   * TODO: make this customizable, eg. use colormap / colorPalette.
   * @type {String[]}
   */
  this.colors = standardCssColors.modifiedBrewer8ClassSet2;

  /**
   * Gets or sets the column identifiers (names or indices), so we can identify individual features
   * within a table with a time column, or across multiple polled lat/lon files.
   * Eg. ['lat', 'lon'] for immobile features, or ['identifier'] if a unique identifier is provided
   * (where these are column names in the table; column numbers work as well).
   * For region-mapped files, the region identifier is used instead.
   * For non-spatial files, the x-column is used instead.
   * @type {String[]}
   * @default undefined
   */
  this.idColumns = options.idColumns;

  /**
   * Gets or sets a value indicating whether the rows correspond to "sampled" data.
   * This only makes a difference if there is a time column and idColumns.
   * In this case, if isSampled is true, then feature position, color and size are interpolated
   * to produce smooth animation of the features over time.
   * If isSampled is false, then times are treated as the start of periods, so that
   * feature positions, color and size are kept constant from one time until the next,
   * then change suddenly.
   * Color and size are never interpolated when they are drawn from a text column.
   * @type {Boolean}
   * @default true
   */
  this.isSampled = defaultValue(options.isSampled, true);

  /**
   * Gets or sets which side of the splitter (if present) to display this imagery layer on.  Defaults to both sides.
   * Note that this only applies to region-mapped tables. This property is observable.
   * @type {ImagerySplitDirection}
   */
  this.splitDirection = ImagerySplitDirection.NONE; // NONE means show on both sides of the splitter, if there is one.

  knockout.track(this, [
    "data",
    "dataSourceUrl",
    "opacity",
    "keepOnTop",
    "showWarnings",
    "_tableStructure",
    "_dataSource",
    "_regionMapping",
    "splitDirection"
  ]);

  knockout.getObservable(this, "opacity").subscribe(function(newValue) {
    if (
      defined(this._regionMapping) &&
      defined(this._regionMapping.updateOpacity)
    ) {
      this._regionMapping.updateOpacity(newValue);
      this.terria.currentViewer.notifyRepaintRequired();
    }
  }, this);

  knockout.defineProperty(this, "concepts", {
    get: function() {
      if (defined(this._tableStructure)) {
        return [this._tableStructure];
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
  knockout.defineProperty(this, "tableStyle", {
    get: function() {
      return this._tableStyle;
    }
  });

  /**
   * Whether the tableStructure has any active items
   * @type {Boolean}
   */
  knockout.defineProperty(this, "allVariablesUnactiveFromTableStructure", {
    get: function() {
      return (
        defined(this._tableStructure) &&
        this._tableStructure.activeItems &&
        this._tableStructure.activeItems.length === 0
      );
    }
  });

  /**
   * Gets an id which is different if the view of the data is different. Defaults to undefined.
   * For a csv file with a fixed TableStructure, undefined is fine.
   * However, if the underlying table changes depending on user selection (eg. for SDMX-JSON or SOS),
   * then the same feature may show different information.
   * If it is time-varying, the feature info panel will show a preview chart of the values over time.
   * This id is used when that chart is expanded, so that it can be opened into a different item, and
   * not override an earlier expanded chart of the same feature (but different data).
   * @type {Object}
   */
  knockout.defineProperty(this, "dataViewId", {
    get: function() {
      return undefined;
    }
  });

  /**
   * Gets javascript dates describing the discrete datetimes (or intervals) available for this item.
   * By declaring this as a knockout defined property, it is cached.
   * @member {Date[]} An array of discrete dates or intervals available for this item, or [] if none.
   * @memberOf TableCatalogItem.prototype
   */
  knockout.defineProperty(
    this,
    "availableDates",
    {
      get: function() {
        if (defined(this.intervals)) {
          const datetimes = [];
          // Only show the start of each interval. If only time instants were given, this is the instant.
          for (let i = 0; i < this.intervals.length; i++) {
            datetimes.push(JulianDate.toDate(this.intervals.get(i).start, 3));
          }
          return datetimes;
        }
        return [];
      }
    },
    this
  );

  /**
   * Gets the TimeIntervalCollection containing all the table's intervals.
   * @type {TimeIntervalCollection}
   */
  knockout.defineProperty(this, "intervals", {
    get: function() {
      if (
        defined(this.tableStructure) &&
        defined(this.tableStructure.activeTimeColumn) &&
        defined(this.tableStructure.activeTimeColumn.timeIntervals)
      ) {
        return this.tableStructure.activeTimeColumn.timeIntervals.reduce(
          function(intervals, interval) {
            if (defined(interval)) {
              intervals.addInterval(interval);
            }
            return intervals;
          },
          new TimeIntervalCollection()
        );
      }
      return undefined;
    }
  });

  overrideProperty(this, "clock", {
    get: function() {
      var timeColumn = this.timeColumn;
      if (this.isMappable && defined(timeColumn)) {
        return timeColumn.clock;
      }
    }
  });

  overrideProperty(this, "legendUrl", {
    get: function() {
      if (defined(this._dataSource)) {
        return this._dataSource.legendUrl;
      } else if (defined(this._regionMapping)) {
        return this._regionMapping.legendUrl;
      }
    }
  });

  overrideProperty(this, "rectangle", {
    get: function() {
      // Override the extent using this.rectangle, otherwise falls back the datasource's extent (with a small margin).
      if (defined(this._rectangle)) {
        return this._rectangle;
      }
      var rect;
      if (defined(this._dataSource)) {
        rect = this._dataSource.extent;
      } else if (defined(this._regionMapping)) {
        rect = this._regionMapping.extent;
      }
      return addMarginToRectangle(rect, 0.08);
    },
    set: function(rect) {
      this._rectangle = rect;
    }
  });

  overrideProperty(this, "dataUrl", {
    // item.dataUrl returns a URI which downloads the table as a csv.
    get: function() {
      if (defined(this._dataUrl)) {
        return this._dataUrl;
      }
      // Even if the file only exists locally, we recreate it as a data URI, since there may have been geocoding or other processing.
      if (defined(this._tableStructure)) {
        return this._tableStructure.toDataUri();
      }
    },
    set: function(value) {
      this._dataUrl = value;
    }
  });

  overrideProperty(this, "dataUrlType", {
    get: function() {
      if (defined(this._dataUrlType)) {
        return this._dataUrlType;
      }
      if (defined(this._tableStructure)) {
        return "data-uri";
      }
    },
    set: function(value) {
      this._dataUrlType = value;
    }
  });

  knockout.getObservable(this, "splitDirection").subscribe(function() {
    this.terria.currentViewer.updateItemForSplitter(this);
  }, this);
};

inherit(CatalogItem, TableCatalogItem);

function addMarginToRectangle(rect, marginFraction) {
  if (defined(rect)) {
    var heightMargin = rect.height * marginFraction;
    var widthMargin = rect.width * marginFraction;
    rect.north = Math.min(Math.PI / 2, rect.north + heightMargin);
    rect.south = Math.max(-Math.PI / 2, rect.south - heightMargin);
    rect.east = Math.min(Math.PI, rect.east + widthMargin);
    rect.west = Math.max(-Math.PI, rect.west - widthMargin);
  }
  return rect;
}

Object.defineProperties(TableCatalogItem.prototype, {
  /**
   * Gets the active time column, if it exists.
   * @memberOf TableCatalogItem.prototype
   * @type {TableColumn}
   */
  timeColumn: {
    get: function() {
      return this._tableStructure && this._tableStructure.activeTimeColumn;
    }
  },

  /**
   * Gets the x-axis column, if it exists (ie. if this is a chart).
   * @memberOf TableCatalogItem.prototype
   * @type {TableColumn}
   */
  xAxis: {
    get: function() {
      if (!this.isMappable && this._tableStructure) {
        if (defined(this._tableStyle.xAxis)) {
          return this._tableStructure.getColumnWithNameOrId(
            this._tableStyle.xAxis
          );
        }
        return (
          this.timeColumn ||
          this._tableStructure.columnsByType[VarType.SCALAR][0]
        );
      }
      return undefined;
    }
  },

  /**
   * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
   * Data sources that cannot be reordered are typically displayed above reorderable data sources.
   * @memberOf TableCatalogItem.prototype
   * @type {Boolean}
   */
  supportsReordering: {
    get: function() {
      return (
        defined(this._regionMapping) &&
        defined(this._regionMapping.regionDetails) &&
        !this.keepOnTop
      );
    }
  },

  /**
   * Gets a value indicating whether the opacity of this data source can be changed.
   * @memberOf ImageryLayerCatalogItem.prototype
   * @type {Boolean}
   */
  supportsOpacity: {
    get: function() {
      return (
        defined(this._regionMapping) &&
        defined(this._regionMapping.regionDetails)
      );
    }
  },

  /**
   * Gets a value indicating whether this layer can be split so that it is
   * only shown on the left or right side of the screen.
   * @memberOf TableCatalogItem.prototype
   */
  supportsSplitting: {
    get: function() {
      return (
        defined(this._regionMapping) &&
        defined(this._regionMapping.regionDetails)
      );
    }
  },

  /**
   * Gets the table structure associated with this catalog item.
   * @memberOf TableCatalogItem.prototype
   * @type {TableStructure}
   */
  tableStructure: {
    get: function() {
      return this._tableStructure;
    }
  },

  /**
   * Gets the data source associated with this catalog item.
   * @memberOf TableCatalogItem.prototype
   * @type {DataSource}
   */
  dataSource: {
    get: function() {
      return this._dataSource;
    }
  },

  /**
   * Gets the region mapping associated with this catalog item.
   * @memberOf TableCatalogItem.prototype
   * @type {RegionMapping}
   */
  regionMapping: {
    get: function() {
      return this._regionMapping;
    }
  },

  /**
   * Gets the Cesium or Leaflet imagery layer object associated with this data source.
   * Used in region mapping only.
   * This property is undefined if the data source is not enabled.
   * @memberOf TableCatalogItem.prototype
   * @type {Object}
   */
  imageryLayer: {
    get: function() {
      return this._regionMapping && this._regionMapping.imageryLayer;
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
      return TableCatalogItem.defaultPropertiesForSharing;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf TableCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return TableCatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf TableCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return TableCatalogItem.defaultSerializers;
    }
  }
});

TableCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

TableCatalogItem.defaultUpdaters.tableStyle = function(
  item,
  json,
  propertyName,
  options
) {
  item._tableStyle.updateFromJson(json[propertyName], options);

  // sync up columns
  if (
    defined(item._tableStyle) &&
    defined(item.tableStructure) &&
    defined(item._tableStyle.columns) &&
    Object.keys(item._tableStyle.columns).length !== 0
  ) {
    item.applyTableStyleColumnsToStructure(
      item._tableStyle,
      item.tableStructure
    );
  }
  // if there are active variables, activate them
  if (
    defined(item.tableStructure) &&
    (!defined(json[propertyName].allVariablesUnactive) ||
      !json[propertyName].allVariablesUnactive)
  ) {
    item.activateColumnFromTableStyle();

    // If tableStructure has been generated & allVariablesUnactive is true, make sure all items are disabled
  } else if (
    defined(item.tableStructure) &&
    defined(json[propertyName].allVariablesUnactive) &&
    json[propertyName].allVariablesUnactive
  ) {
    item.syncAllVariablesUnactiveOnUpdate();
  }
};

TableCatalogItem.defaultUpdaters.polling = function(
  item,
  json,
  propertyName,
  options
) {
  return item[propertyName].updateFromJson(json[propertyName], options);
};

TableCatalogItem.defaultUpdaters.concepts = function() {
  // Don't update from JSON.
};

TableCatalogItem.defaultUpdaters.dataViewId = function() {
  // Don't update from JSON.
};

TableCatalogItem.defaultUpdaters.availableDates = function() {
  // Do not update/serialize availableDates.
};

TableCatalogItem.defaultUpdaters.intervals = function() {
  // Don't update from JSON.
};

Object.freeze(TableCatalogItem.defaultUpdaters);

TableCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

TableCatalogItem.defaultSerializers.tableStyle = function(
  item,
  json,
  propertyName,
  options
) {
  if (
    item.type === "csv" &&
    (defined(item.url) || defined(item.dataUrl)) &&
    defined(item.tableStyle) &&
    defined(item._tableStructure)
  ) {
    // Sync up table style from current table structure state
    json.tableStyle = item.syncActiveColumns(
      item.tableStyle,
      item.tableStructure
    );
  }
  json[propertyName] = item[propertyName].serializeToJson(options);
  // Add the currently active variable to the tableStyle (if any) so it starts with the right one.
  if (item.allVariablesUnactiveFromTableStructure) {
    // Make sure we unset this for subsequent serialisation from stories or otherwise
    json[propertyName].dataVariable = undefined;
    json[propertyName].allVariablesUnactive = true;
  } else if (
    defined(item._tableStructure) &&
    item._tableStructure.activeItems[0]
  ) {
    json[propertyName].dataVariable = item._tableStructure.activeItems[0].name;
    json[propertyName].allVariablesUnactive = undefined;
  }
};

TableCatalogItem.defaultSerializers.polling = function(
  item,
  json,
  propertyName,
  options
) {
  json[propertyName] = item[propertyName].serializeToJson(options);
};

TableCatalogItem.defaultSerializers.legendUrl = function() {
  // Don't serialize, because legends are generated, and sticking an image embedded in a URL is a terrible idea.
};

TableCatalogItem.defaultSerializers.concepts = function() {
  // Don't serialize.
};

TableCatalogItem.defaultSerializers.dataViewId = function() {
  // Don't serialize.
};

TableCatalogItem.defaultSerializers.allVariablesUnactiveFromTableStructure = function() {
  // Don't serialize.
};

TableCatalogItem.defaultSerializers.dataUrl = function(item, json) {
  // Only serialize this if it was set directly; if it is a data URI containing a representation of the whole table, ignore it.
  // ie. set it to item._dataUrl, not item.dataUrl.
  json.dataUrl = item._dataUrl;
  if (item.isCsvForCharting && !defined(item.url)) {
    json.dataUrl = item.dataUrl;
  }
};

TableCatalogItem.defaultSerializers.clock = function() {
  // Don't serialize. Clock is not part of propertiesForSharing, but it would be shared if this is My Data.
  // See SharePopupViewModel.prototype._addUserAddedCatalog.
};

TableCatalogItem.defaultSerializers.availableDates = function() {
  // Do not update/serialize availableDates.
};

TableCatalogItem.defaultSerializers.intervals = function() {
  // Don't serialize.
};

Object.freeze(TableCatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object
 * for a share link.
 * @type {String[]}
 */
TableCatalogItem.defaultPropertiesForSharing = clone(
  CatalogItem.defaultPropertiesForSharing
);
TableCatalogItem.defaultPropertiesForSharing.push("keepOnTop");
TableCatalogItem.defaultPropertiesForSharing.push("opacity");
TableCatalogItem.defaultPropertiesForSharing.push("tableStyle");
TableCatalogItem.defaultPropertiesForSharing.push("splitDirection");
TableCatalogItem.defaultPropertiesForSharing.push("url");
Object.freeze(TableCatalogItem.defaultPropertiesForSharing);

TableCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.data];
};

/**
 * Updates tableStructure for the tableStyle, by looking at tableStyle.columns
 * and applying units, type, active and name.
 * If the data was loaded from a csv file, CsvCatalogItem's loadTableFromCsv
 * will already have taken care of this.
 * This function is needed if the data came directly from a TableStructure.
 *
 * @param  {TableStyle} tableStyle The table style.
 * @param  {TableStructure} tableStructure The table structure to update.
 */
TableCatalogItem.prototype.applyTableStyleColumnsToStructure = function(
  tableStyle,
  tableStructure,
  options = {
    onlyActiveColumns: false
  }
) {
  if (!defined(tableStructure)) {
    console.warn("table structure does not exist");
    return;
  }
  if (defined(tableStyle.columns)) {
    for (const nameOrIndex in tableStyle.columns) {
      if (tableStyle.columns.hasOwnProperty(nameOrIndex)) {
        const columnStyle = tableStyle.columns[nameOrIndex];
        const column = tableStructure.getColumnWithNameIdOrIndex(nameOrIndex);
        if (defined(column)) {
          if (options.onlyActiveColumns) {
            if (defined(columnStyle.active)) {
              column.isActive = columnStyle.active;
            }
          } else {
            if (defined(columnStyle.units)) {
              column.units = columnStyle.units;
            }
            if (defined(columnStyle.type)) {
              column.type = columnStyle.type;
            }
            if (defined(columnStyle.name)) {
              column.name = columnStyle.name;
            }
            if (defined(columnStyle.active)) {
              column.isActive = columnStyle.active;
            }
          }
        }
      }
    }
  }
  return this;
};

/**
 * Ensures tableStructure active state reflects updateFromJson updates
 *
 */
TableCatalogItem.prototype.syncAllVariablesUnactiveOnUpdate = function() {
  const tableStyle = this._tableStyle;
  const tableStructure = this._tableStructure;
  if (!defined(tableStyle)) {
    throw new DeveloperError(
      "syncAllVariablesUnactiveOnUpdate was called without a tableStyle?"
    );
  } else if (!defined(tableStructure)) {
    throw new DeveloperError(
      "syncAllVariablesUnactiveOnUpdate was called without a tableStructure?"
    );
  }
  if (!(tableStructure instanceof TableStructure)) {
    throw new DeveloperError(
      "table structure passed in to syncAllVariablesUnactiveOnUpdate isn't a TableStructure"
    );
  }
  if (tableStyle.allVariablesUnactive) {
    tableStructure.items.map(tableStructureItem => {
      if (tableStructureItem.isActive) {
        tableStructureItem.toggleActive();
      }
    });
  }
};

/**
 * Updates tableStyle with a given tableStructure
 * This is needed if the UI toggles concepts via Concept.jsx
 *
 * @param  {TableStyle} tableStyle The table style.
 * @param  {TableStructure} tableStructure The table structure to update.
 */
TableCatalogItem.prototype.syncActiveColumns = function(
  tableStyle,
  tableStructure
) {
  if (!defined(tableStyle)) {
    throw new DeveloperError(
      "syncActiveColumns was called without a tableStyle?"
    );
  } else if (!defined(tableStructure)) {
    throw new DeveloperError(
      "syncActiveColumns was called without a tableStructure?"
    );
  }
  if (!(tableStructure instanceof TableStructure)) {
    throw new DeveloperError(
      "table structure passed in to syncActiveColumns isn't a TableStructure"
    );
  }
  if (
    defined(tableStyle.columns) &&
    defined(tableStructure.getColumnWithNameIdOrIndex)
  ) {
    for (const nameOrIndex in tableStyle.columns) {
      if (tableStyle.columns.hasOwnProperty(nameOrIndex)) {
        const columnStyle = tableStyle.columns[nameOrIndex];
        const columnFromStructure = tableStructure.getColumnWithNameIdOrIndex(
          nameOrIndex
        );
        if (defined(columnFromStructure)) {
          columnStyle.active = columnFromStructure.isActive;
        }
      }
    }
    // }
  } else if (
    tableStructure.allowMultiple &&
    !defined(tableStyle.columns) &&
    defined(tableStructure.getColumnWithNameIdOrIndex)
  ) {
    const newColumnsForTableStyle = tableStructure.items.reduce(
      (acc, item, index) => {
        acc[index] = {
          name: item.name,
          units: item.units,
          format: item.format,
          active: item.isActive,
          chartLineColor: item.color,
          yAxisMin: item.yAxisMin,
          yAxisMax: item.yAxisMax
        };
        return acc;
      },
      {}
    );
    tableStyle.columns = newColumnsForTableStyle;
  }
};

/**
 * Given a TableStructure, determine what sort of table it is. Prepare:
 *  - TableDataSource if it has latitude and longitude
 *  - RegionMapping if it has a region column
 *  - nothing for non-geospatial data (just use the TableStructure directly).
 * @param  {TableStructure} tableStructure
 * @return {Promise} Returns a promise that resolves to true if it is a recognised format.
 */
TableCatalogItem.prototype.initializeFromTableStructure = function(
  tableStructure
) {
  var item = this;
  var tableStyle = item._tableStyle;

  setDefaultIdColumns(item, tableStructure);
  tableStructure.setActiveTimeColumn(tableStyle.timeColumn);
  item._tableStructure = tableStructure;

  function makeChartable() {
    tableStructure.name = ""; // No need to show the section title 'Display Variables' in Now Viewing.
    tableStructure.allowMultiple = true;
    item.activateColumnFromTableStyle();
    item.setChartable();
    item.startPolling();
  }
  if (!item.isMappable) {
    makeChartable();
    return;
  }

  // Does the csv have addresses we can translate to long and lat?
  if (
    !tableStructure.hasLatitudeAndLongitude &&
    tableStructure.hasAddress &&
    defined(item.terria.batchGeocoder)
  ) {
    var addressGeocoder = item.terria.batchGeocoder;
    return addressGeocoder
      .bulkConvertAddresses(tableStructure, item.terria.corsProxy)
      .then(function(addressGeocoderData) {
        var timeTaken = JulianDate.secondsDifference(
          JulianDate.now(),
          addressGeocoderData.startTime
        );
        var developerMessage =
          "Bulk geocode of " +
          addressGeocoderData.numberOfAddressesConverted +
          " addresses took " +
          timeTaken.toFixed(2) +
          " seconds, which is " +
          (addressGeocoderData.numberOfAddressesConverted / timeTaken).toFixed(
            2
          ) +
          " addresses/s, or " +
          (timeTaken / addressGeocoderData.numberOfAddressesConverted).toFixed(
            2
          ) +
          " s/address.\n";
        console.log(developerMessage);
        var missingAddressesMessage = "";
        if (
          addressGeocoderData.missingAddresses.length > 0 ||
          addressGeocoderData.nullAddresses > 0
        ) {
          if (addressGeocoderData.missingAddresses.length > 0) {
            missingAddressesMessage =
              "\n" +
              i18next.t("models.tableData.bulkGeocoderInfoMessage", {
                number: addressGeocoderData.missingAddresses.length
              }) +
              "\n" +
              addressGeocoderData.missingAddresses.join(", ") +
              ".<br/><br/>";
          }
          if (addressGeocoderData.nullAddresses > 0) {
            missingAddressesMessage += i18next.t(
              "models.tableData.bulkGeocoderInfo2Message",
              { nullAddresses: addressGeocoderData.nullAddresses }
            );
          }
          item.terria.error.raiseEvent(
            new TerriaError({
              sender: this,
              title: i18next.t("models.tableData.bulkGeocoderInfoTitle"),
              message: missingAddressesMessage
            })
          );
        }
        return createDataSourceForLatLong(item, tableStructure);
      })
      .otherwise(function(e) {
        item.terria.error.raiseEvent(
          new TerriaError({
            sender: this,
            title: i18next.t("models.tableData.bulkGeocoderErrorTitle"),
            message: i18next.t("models.tableData.bulkGeocoderErrorMessage")
          })
        );
        console.log("Unable to map addresses to lat-long coordinates.", e);
      });
  }
  if (tableStructure.hasLatitudeAndLongitude) {
    return createDataSourceForLatLong(item, tableStructure);
  }
  var regionMapping = new RegionMapping(item, tableStructure, item._tableStyle);
  // Return a promise which resolves once we've set up region mapping, if any.
  return regionMapping.loadRegionDetails().then(function(regionDetails) {
    if (regionDetails) {
      // Save the region mapping to item._regionMapping.
      item._regionMapping = regionMapping;
      item._regionMapping.changedEvent.addEventListener(
        dataChanged.bind(null, item),
        item
      );
      // Set the first region column to have type VarType.REGION.
      item._regionMapping.setRegionColumnType();
      // Activate a column. This needed to wait until we had a regionMapping, so it can trigger the legendHelper build.
      item.activateColumnFromTableStyle();
      // This needed to wait until we know which column is the region.
      ensureActiveColumn(tableStructure, tableStyle);
      item.startPolling();
      return when(true);
    } else {
      // Non-geospatial data.
      makeChartable();
      return when(true);
    }
  });
};

function setDefaultIdColumns(item, tableStructure) {
  // This just checks there is a time column - not that it's one we would actually activate.
  // Would be better to do the full check.
  // Note we check if === undefined explicitly so the user can set to null to prevent this default.
  if (
    item.idColumns === undefined &&
    !defined(tableStructure.idColumnNames) &&
    defined(tableStructure.columnsByType[VarType.TIME].length > 0) &&
    tableStructure.getColumnNames().indexOf(DEFAULT_ID_COLUMN) >= 0
  ) {
    item.idColumns = [DEFAULT_ID_COLUMN];
    tableStructure.idColumnNames = item.idColumns;
  }
}

/**
 * Creates a datasource based on tableStructure provided and adds it to item. Suitable for TableStructures that contain
 * lat-lon columns.
 *
 * @param {TableCatalogItem} item Item that tableDataSource is created for.
 * @param {TableStructure} tableStructure TableStructure to use in creating datasource.
 * @return {Promise}
 * @private
 */
function createDataSourceForLatLong(item, tableStructure) {
  // Create the TableDataSource and save it to item._dataSource.
  item._dataSource = new TableDataSource(
    item.terria,
    tableStructure,
    item._tableStyle,
    item.name,
    item.polling.seconds > 0
  );
  item._dataSource.changedEvent.addEventListener(
    dataChanged.bind(null, item),
    item
  );
  // Activate a column. This needed to wait until we had a dataSource, so it can trigger the legendHelper build.
  item.activateColumnFromTableStyle();
  ensureActiveColumn(tableStructure, item._tableStyle);
  item.startPolling();
  return when(true); // We're done - nothing to wait for.
}

TableCatalogItem.prototype.setChartable = function() {
  var tableStructure = this._tableStructure;
  tableStructure.allowMultiple = true;
  tableStructure.requireSomeActive = false;
  this.isMappable = false;
  if (!defined(tableStructure.getColorCallback)) {
    tableStructure.getColorCallback = this.getNextColor.bind(this);
  }
  tableStructure.toggleActiveCallback = this.disableIncompatibleTableColumns.bind(
    this
  );
  // Only let the user choose for the y-axis from the scalar, alt, lon and lat columns. Also hide the x-axis.
  var xAxis = this.xAxis;
  tableStructure.columns.forEach(function(column) {
    if ([VarType.ALT, VarType.LON, VarType.LAT].indexOf(column.type) >= 0) {
      // Revert these column types back to scalars for charts, so eg. a column named "height" can be charted.
      column.type = VarType.SCALAR;
    }
    column.isVisible = column !== xAxis && column.type === VarType.SCALAR;
  });
  if (
    !defined(this.tableStyle.allVariablesUnactive) ||
    !this.tableStyle.allVariablesUnactive
  ) {
    ensureActiveColumnForNonSpatial(this);
  }
  // If this item is shown and enabled, ensure it is in the catalog's chartable items, so the ChartPanel can pick it up.
  addToChartableItemsIfNotMappable(this);
};

// An event listened triggered whenever the dataSource or regionMapping changes.
// Used to know when to redraw the display.
function dataChanged(item) {
  item.terria.currentViewer.notifyRepaintRequired();
}

function ensureActiveColumn(tableStructure, tableStyle) {
  // Find and activate the first SCALAR or ENUM column, if no columns are active, unless the tableStyle sets dataVariable to null.
  if (tableStyle.dataVariable === null) {
    // We still need to trigger an active column change to update TableDataSource and RegionMapping, so toggle one twice.
    tableStructure.columns[0].toggleActive();
    tableStructure.columns[0].toggleActive();
    return;
  }
  if (tableStructure.activeItems.length === 0) {
    var suitableColumns = tableStructure.columns
      .filter(col => col.type === VarType.SCALAR)
      .concat(tableStructure.columns.filter(col => col.type === VarType.ENUM));
    if (suitableColumns.length > 0) {
      // Look for the first non-trivial column
      // (where a trivial ENUM column has too few or too many unique values,
      // and a trivial SCALAR column has min === max.)
      for (var i = 0; i < suitableColumns.length; i++) {
        var column = suitableColumns[i];
        if (column.isEnum) {
          var numberOfUniqueValues = column.uniqueValues.length;
          if (
            numberOfUniqueValues > 2 &&
            numberOfUniqueValues < 20 &&
            numberOfUniqueValues < column.values.length * 0.8
          ) {
            column.toggleActive();
            return;
          }
        } else {
          if (column.minimumValue < column.maximumValue) {
            column.toggleActive();
            return;
          }
        }
      }
      // If it can't find any non-trivial columns, just use the first enum or scalar.
      suitableColumns[0].toggleActive();
    } else {
      // There are no suitable columns.
      // We need to trigger an active column change to update TableDataSource and RegionMapping, so toggle one twice.
      tableStructure.columns[0].toggleActive();
      tableStructure.columns[0].toggleActive();
    }
  } else if (tableStructure.activeItems.length === 1) {
    // Otherwise we have a single active item but it needs to be toggled so it can trigger an.. update?paint(?)
    const column = tableStructure.getColumnWithNameIdOrIndex(
      tableStructure.activeItems[0].name
    );
    if (defined(column)) {
      column.toggleActive();
      column.toggleActive();
    }
  }
}

/**
 * Set the color (for charts) on the active columns. Assumes the table's getColorCallback has been set.
 */
TableCatalogItem.prototype.setColorOnActiveColumns = function() {
  var tableStructure = this._tableStructure;
  tableStructure.columns
    .filter(column => column.isActive && !defined(column.color))
    .forEach(column => {
      column.color = tableStructure.getColorCallback(
        tableStructure.getColumnIndex(column.id)
      );
    });
};

function ensureActiveColumnForNonSpatial(item) {
  // If it is not mappable, and has no time column, then the first scalar column will be treated as the x-variable, so choose the second one.
  var tableStructure = item._tableStructure;
  if (tableStructure.activeItems.length === 0) {
    var suitableColumns = tableStructure.columnsByType[VarType.SCALAR];
    if (
      suitableColumns.length > 1 &&
      tableStructure.columnsByType[VarType.TIME].length === 0
    ) {
      suitableColumns[1].toggleActive();
    } else if (suitableColumns.length > 0) {
      suitableColumns[0].toggleActive();
    }
  } else {
    // There's already an active column, but it may not have a color set yet.
    item.setColorOnActiveColumns();
  }
}

/**
 * Activates the column specified in the table style's "dataVariable" parameter, if any.
 * If columns are specified, those active statuses will take precedence
 */
TableCatalogItem.prototype.activateColumnFromTableStyle = function() {
  var tableStyle = this._tableStyle;
  if (defined(tableStyle) && defined(tableStyle.dataVariable)) {
    var columnToActivate = this._tableStructure.getColumnWithNameOrId(
      tableStyle.dataVariable
    );
    if (columnToActivate && !columnToActivate.isActive) {
      columnToActivate.toggleActive();
    }
  }
  if (defined(tableStyle) && defined(tableStyle.columns)) {
    this.applyTableStyleColumnsToStructure(tableStyle, this.tableStructure, {
      onlyActiveColumns: true
    });
  }
};

/**
 * Your derived class should implement its own version of startPolling, if it is allowed.
 * No return value.
 */
TableCatalogItem.prototype.startPolling = function() {
  const polling = this.polling;
  if (defined(polling.seconds) && polling.seconds > 0) {
    throw new DeveloperError("Polling is not available on this dataset.");
  }
};

/**
 * Your derived class must implement _load.
 * @returns {Promise} A promise that resolves when the load is complete, or undefined if the function is already loaded.
 */
TableCatalogItem.prototype._load = function() {
  throw new DeveloperError("_load must be implemented in the derived class.");
};

function addToChartableItemsIfNotMappable(item) {
  // If this is not mappable, assume it is chartable - add it to the chartable items array,
  // And then handle incompatible x-axes on existing chartable items.
  if (
    item.isEnabled &&
    item.isShown &&
    !item.isMappable &&
    item.terria.catalog.chartableItems.indexOf(item) < 0
  ) {
    item.terria.catalog.addChartableItem(item);
    item.disableIncompatibleTableColumns();
    item.setColorOnActiveColumns();
  }
}

function removeFromChartableItems(item) {
  item.terria.catalog.removeChartableItem(item);
}

TableCatalogItem.prototype._enable = function(layerIndex) {
  if (defined(this._regionMapping)) {
    this._regionMapping.enable(layerIndex);
  }
  addToChartableItemsIfNotMappable(this);
  this.terria.currentViewer.updateItemForSplitter(this);
};

TableCatalogItem.prototype._disable = function() {
  if (defined(this._regionMapping)) {
    this._regionMapping.disable();
  }
  removeFromChartableItems(this);
};

TableCatalogItem.prototype._show = function() {
  if (defined(this._dataSource)) {
    var dataSources = this.terria.dataSources;
    if (dataSources.contains(this._dataSource)) {
      if (console && console.log) {
        console.log(new Error("This data source is already shown."));
      }
      return;
    }
    dataSources.add(this._dataSource);
  }
  if (defined(this._regionMapping)) {
    this._regionMapping.show();
  }

  if (
    defined(this._tableStyle) &&
    defined(this.tableStructure) &&
    defined(this._tableStyle.allVariablesUnactive)
  ) {
    this.syncAllVariablesUnactiveOnUpdate();
  }
  addToChartableItemsIfNotMappable(this);
};

TableCatalogItem.prototype._hide = function() {
  if (defined(this._dataSource)) {
    var dataSources = this.terria.dataSources;
    if (!dataSources.contains(this._dataSource)) {
      throw new DeveloperError("This data source is not shown.");
    }
    dataSources.remove(this._dataSource, false);
  }
  if (defined(this._regionMapping)) {
    this._regionMapping.hide();
  }
  removeFromChartableItems(this);
};

/**
 * Finds the next unused color for a chart line.
 * @return {String} A string description of the color.
 */
TableCatalogItem.prototype.getNextColor = function() {
  var catalog = this._terria.catalog;
  if (!defined(catalog)) {
    return;
  }
  if (!defined(this.colors) || this.colors.length === 0) {
    return;
  }
  if (!this.isEnabled) {
    // So that previewed charts don't get assigned the next color (which could clash, since it won't be in the list yet).
    return;
  }

  var colors = this.colors.slice();
  // Get all the colors in use (as nested array).
  // TODO move this functionality somewhere like ChartPanel.
  var colorsUsed = catalog.chartableItems.map(function(item) {
    if (!item.tableStructure) {
      return [];
    }
    return item.tableStructure.columns
      .map(function(column) {
        return column.color;
      })
      .filter(function(color) {
        return defined(color);
      });
  });
  // Flatten it.
  colorsUsed = colorsUsed.reduce(function(a, b) {
    return a.concat(b);
  }, []);
  // Remove the colors in use from the full list.
  for (var index = 0; index < colorsUsed.length; index++) {
    var fullColorsIndex = colors.indexOf(colorsUsed[index]);
    if (fullColorsIndex > -1) {
      colors.splice(fullColorsIndex, 1);
    }
    if (colors.length === 0) {
      colors = this.colors.slice(); // Keep cycling through the colors when they're all used.
    }
  }
  return colors[0];
};

/**
 * Returns a {@link ChartData} object for the TableCatalogItem.  See ChartPanel.jsx for an example.
 * Maps each scalar Y column onto a separate ChartData data series.
 * @returns {ChartData}
 */
TableCatalogItem.prototype.chartData = function() {
  const item = this;
  if (!defined(item.tableStructure)) {
    return undefined;
  }
  const xColumn = item.xAxis;
  const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(
    column => column.isActive
  );
  if (yColumns.length > 0) {
    const yColumnNumbers = yColumns.map(yColumn =>
      item.tableStructure.columns.indexOf(yColumn)
    );
    const pointArrays = item.tableStructure.toPointArrays(xColumn, yColumns);
    return pointArrays.map(
      (points, index) =>
        new ChartData(points, {
          id: item.uniqueId + "-" + yColumnNumbers[index],
          name: yColumns[index].name,
          categoryName: item.name,
          units: yColumns[index].units,
          color: yColumns[index].color || this.colors[0],
          yAxisMin: yColumns[index].yAxisMin,
          yAxisMax: yColumns[index].yAxisMax
        })
    );
  }
};

/**
 * Finds any other table structures that do not have the same xColumn type, and disable their columns.
 * @private
 */
TableCatalogItem.prototype.disableIncompatibleTableColumns = function() {
  if (this.isEnabled && this.isShown) {
    var tableStructure = this._tableStructure;
    var xColumn = this.xAxis;

    // Only disable other columns if this table has existing active items
    if (tableStructure.activeItems.length === 0) {
      return;
    }

    this._terria.catalog.chartableItems.forEach(otherItem => {
      if (
        defined(otherItem.tableStructure) &&
        otherItem.tableStructure !== tableStructure
      ) {
        if (otherItem.xAxis.type !== xColumn.type) {
          // Deactivate the other table's columns, which will remove its chart.
          otherItem.tableStructure.columns.forEach(column => {
            column.isActive = false;
          });
        }
      }
    });
  }
};

TableCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
  var dataSource = this._dataSource;
  var removeRegionMapping;

  if (defined(this._regionMapping)) {
    removeRegionMapping = this._regionMapping.showOnSeparateMap(globeOrMap);
  }

  if (defined(dataSource)) {
    globeOrMap.addDataSource({
      dataSource: dataSource
    });
  }

  return function() {
    if (defined(removeRegionMapping)) {
      removeRegionMapping();
    }
    if (defined(dataSource)) {
      globeOrMap.removeDataSource({
        dataSource: dataSource
      });
    }
  };
};

module.exports = TableCatalogItem;

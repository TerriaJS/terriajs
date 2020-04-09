/*global require*/
"use strict";

var dateFormat = require("dateformat");

var ClockRange = require("terriajs-cesium/Source/Core/ClockRange").default;
var ClockStep = require("terriajs-cesium/Source/Core/ClockStep").default;
var DataSourceClock = require("terriajs-cesium/Source/DataSources/DataSourceClock")
  .default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var destroyObject = require("terriajs-cesium/Source/Core/destroyObject")
  .default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var Iso8601 = require("terriajs-cesium/Source/Core/Iso8601").default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var TimeIntervalCollection = require("terriajs-cesium/Source/Core/TimeIntervalCollection")
  .default;

var csv = require("../ThirdParty/csv");
var DataUri = require("../Core/DataUri");
var DisplayVariablesConcept = require("../Map/DisplayVariablesConcept");
var inherit = require("../Core/inherit");
var TableColumn = require("./TableColumn");
var VarType = require("../Map/VarType");
var setClockCurrentTime = require("../Models/setClockCurrentTime");

var defaultDisplayVariableTypes = [VarType.ENUM, VarType.SCALAR, VarType.ALT];
var defaultFinalDurationSeconds = 3600 * 24 - 1; // one day less a second, if there is only one date.
var defaultShaveSeconds = 0;

/**
 * TableStructure provides an abstraction of a data table, ie. a structure with rows and columns.
 * Its primary responsibility is to load and parse the data, from csvs or other.
 * It stores each column as a TableColumn, and saves the rows too if conversion to rows is requested.
 * Columns are also sorted by type for easier access.
 *
 * @alias TableStructure
 * @constructor
 * @extends {DisplayVariablesConcept}
 * @param {String} [name] Name to use in the NowViewing tab, defaults to 'Display Variable'.
 * @param {Object} [options] Options:
 * @param {Array} [options.displayVariableTypes] Which variable types to show in the NowViewing tab. Defaults to ENUM, SCALAR, and ALT (not LAT, LON or TIME).
 * @param {VarType[]} [options.unallowedTypes] An array of types which should not be guessed. If not present, all types are allowed. Cannot include VarType.SCALAR.
 * @param {String} [options.initialTimeSource]  A string specifiying the value of the animation timeline at start. Valid options are:
 *                 ("present": closest to today's date,
 *                  "start": start of time range of animation,
 *                  "end": end of time range of animation,
 *                  An ISO8601 date e.g. "2015-08-08": specified date or nearest if date is outside range).
 * @param {Number} [options.displayDuration] Passed on to TableColumn, unless overridden by options.columnOptions.
 * @param {String[]} [options.replaceWithNullValues] Passed on to TableColumn, unless overridden by options.columnOptions.
 * @param {String[]} [options.replaceWithZeroValues] Passed on to TableColumn, unless overridden by options.columnOptions.
 * @param {Object} [options.columnOptions] An object with keys identifying columns (column names or indices),
 *                 and per-column properties displayDuration, replaceWithNullValues, replaceWithZeroValues, name, active, units and/or type.
 *                 For type, converts strings, which are case-insensitive keys of VarType, to their VarType integer.
 * @param {Function} [options.getColorCallback] Passed to DisplayVariableConcept.
 * @param {Entity} [options.sourceFeature] The feature to which this table applies, if any; not used internally by TableStructure or TableColumn.
 * @param {Array} [options.idColumnNames] An array of column names/indexes/ids which identify unique features across rows
 *                (see CsvCatalogItem.idColumns).
 * @param {Boolean} [options.isSampled] Does this data correspond to "sampled" data?
 *                See CsvCatalogItem.isSampled for an explanation.
 * @param {Number} [options.shaveSeconds] How many seconds to shave off each time period so periods do not overlap. Defaults to 1 second.
 * @param {JulianDate} [options.finalEndJulianDate] If present, use this as the final end date for all points.
 * @param {Boolean} [options.requireSomeActive=false] Set to true if at least one column must be selected at all times.
 */
var TableStructure = function(name, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  DisplayVariablesConcept.call(this, name, {
    getColorCallback: options.getColorCallback,
    requireSomeActive: defaultValue(options.requireSomeActive, false)
  });

  this.displayVariableTypes = defaultValue(
    options.displayVariableTypes,
    defaultDisplayVariableTypes
  );
  this.shaveSeconds = defaultValue(options.shaveSeconds, defaultShaveSeconds);
  this.finalEndJulianDate = options.finalEndJulianDate;
  this.unallowedTypes = options.unallowedTypes;
  this.initialTimeSource = options.initialTimeSource;
  this.displayDuration = options.displayDuration;
  this.replaceWithNullValues = options.replaceWithNullValues;
  this.replaceWithZeroValues = options.replaceWithZeroValues;
  this.columnOptions = options.columnOptions;
  this.sourceFeature = options.sourceFeature;
  this.idColumnNames = options.idColumnNames; // Actually names, ids or indexes.
  this.isSampled = options.isSampled;

  /**
   * Gets or sets the active time column name, id or index.
   * If you pass an array of two such, eg. [0, 1], treats these as the start and end date column identifiers.
   * @type {String|Number|String[]|Number[]|undefined}
   */
  this._activeTimeColumnNameIdOrIndex = undefined;

  // Track sourceFeature as it is shown on the NowViewing panel.
  // Track items so that charts can update live. (Already done by DisplayVariableConcept.)
  knockout.track(this, ["sourceFeature", "_activeTimeColumnNameIdOrIndex"]);

  /**
   * Gets the columnsByType for this structure,
   * an object whose keys are VarTypes, and whose values are arrays of TableColumn with matching type.
   * Only existing types are present (eg. columnsByType[VarType.ALT] may be undefined).
   * @memberOf TableStructure.prototype
   * @type {Object}
   */
  knockout.defineProperty(this, "columnsByType", {
    get: function() {
      return getColumnsByType(this.items);
    }
  });
};
inherit(DisplayVariablesConcept, TableStructure);

Object.defineProperties(TableStructure.prototype, {
  /**
   * Gets or sets the columns for this structure.
   * @memberOf TableStructure.prototype
   * @type {TableColumn[]}
   */
  columns: {
    get: function() {
      return this.items;
    },
    set: function(value) {
      if (areColumnsEqualLength(value)) {
        this.items = value;
      } else {
        var msg = "Badly formed data table - columns have different lengths.";
        throw new DeveloperError(msg);
      }
    }
  },

  /**
   * Gets a flag which states whether this data has latitude and longitude data.
   * @type {Boolean}
   */
  hasLatitudeAndLongitude: {
    get: function() {
      var longitudeColumn = this.columnsByType[VarType.LON][0];
      var latitudeColumn = this.columnsByType[VarType.LAT][0];
      return defined(longitudeColumn) && defined(latitudeColumn);
    }
  },

  /**
   * Gets a flag which states whether this data has address data.
   * @type {Boolean}
   */
  hasAddress: {
    get: function() {
      var address = this.columnsByType[VarType.ADDR][0];
      return defined(address);
    }
  },

  /**
   * Gets or sets the active time column name, id or index.
   * If you pass an array of two such, eg. [0, 1], treats these as the start and end date column identifiers.
   * @type {String|Integer|String[]|Integer[]|undefined}
   */
  activeTimeColumnNameIdOrIndex: {
    get: function() {
      return this._activeTimeColumnNameIdOrIndex;
    },
    set: function(nameIdOrIndex) {
      this._activeTimeColumnNameIdOrIndex = nameIdOrIndex;
      if (defined(nameIdOrIndex)) {
        // Sort by the newly active time column, if available (so charts and derived charts don't double-back on themselves).
        // Don't replace the table structure's columns until we have finished all our finish date calculations.
        var sortedColumns = getSortedColumns(
          this,
          this.getColumnWithNameIdOrIndex(valueOrFirstValue(nameIdOrIndex))
        );
        // sortBy changes all the columns, so get the new time column.
        var timeColumnToActivate = getColumnWithNameIdOrIndex(
          valueOrFirstValue(nameIdOrIndex),
          sortedColumns
        );
        if (
          defined(timeColumnToActivate) &&
          !defined(timeColumnToActivate.finishJulianDates)
        ) {
          // Calculate default end dates and timeIntervals, and define a clock on the active time column.
          timeColumnToActivate.finishJulianDates = calculateFinishDates(
            sortedColumns,
            nameIdOrIndex,
            this
          );
          timeColumnToActivate._timeIntervals = calculateTimeIntervals(
            timeColumnToActivate
          );
          timeColumnToActivate._clock = createClock(timeColumnToActivate, this);

          var intervals = timeColumnToActivate._timeIntervals;
          var stopTime;
          if (intervals.length > 0) {
            var lastInterval;
            for (
              var i = intervals.length - 1;
              !defined(lastInterval) && i >= 0;
              --i
            ) {
              lastInterval = intervals[i];
            }

            if (defined(lastInterval)) {
              stopTime = lastInterval.start;
            }
          }

          setClockCurrentTime(
            timeColumnToActivate._clock,
            this.initialTimeSource,
            stopTime
          );
          this.columns = sortedColumns;
        } else {
          this._activeTimeColumnNameIdOrIndex = undefined;
        }
      }
    }
  },

  /**
   * Gets the active time column for this structure. If two were provided (for the start and end times), return only the start date column.
   * @memberOf TableStructure.prototype
   * @type {TableColumn}
   */
  activeTimeColumn: {
    get: function() {
      var nameIdOrIndex = this._activeTimeColumnNameIdOrIndex;
      if (defined(nameIdOrIndex)) {
        return this.getColumnWithNameIdOrIndex(
          valueOrFirstValue(nameIdOrIndex)
        );
      }
      return undefined;
    }
  },

  /**
   * Returns an array describing when each row is visible. Only defined if there is an active time column.
   * @memberOf TableStructure.prototype
   * @type {TimeIntervalCollection[]}
   */
  timeIntervals: {
    get: function() {
      var activeTimeColumn = this.activeTimeColumn;
      if (!defined(this.activeTimeColumn)) {
        return undefined;
      }
      return activeTimeColumn._timeIntervals;
    }
  },

  /**
   * Returns an array of the finish Julian dates for each row. Only defined if there is an active time column.
   * @memberOf TableStructure.prototype
   * @type {JulianDate[]}
   */
  finishJulianDates: {
    get: function() {
      var activeTimeColumn = this.activeTimeColumn;
      if (!defined(this.activeTimeColumn)) {
        return undefined;
      }
      return activeTimeColumn.finishJulianDates;
    }
  },

  /**
   * Returns a clock whose start and stop times correspond to the first and last visible row.
   * Only defined if type == VarType.TIME.
   * @memberOf TableColumn.prototype
   * @type {DataSourceClock}
   */
  clock: {
    get: function() {
      var activeTimeColumn = this.activeTimeColumn;
      if (!defined(this.activeTimeColumn)) {
        return undefined;
      }
      return activeTimeColumn._clock;
    }
  }
});

function getVarTypeFromString(typeString) {
  if (!defined(typeString)) {
    return;
  }
  var typeNumber = parseInt(typeString, 10);
  if (typeNumber === typeNumber) {
    // parseInt returns NaN for non-numeric strings, and NaN !== NaN.
    return typeNumber;
  }
  for (var varTypeName in VarType) {
    if (typeString.toLowerCase() === varTypeName.toLowerCase()) {
      return VarType[varTypeName];
    }
  }
}

/**
 * Expose the default display variable types.
 * @type {Array}
 */
TableStructure.defaultDisplayVariableTypes = defaultDisplayVariableTypes;

/**
 * Create a TableStructure from a JSON object, eg. [['x', 'y'], [1, 5], [3, 8], [4, -3]].
 *
 * @param {Object} json Table data as an object (in json format).
 * @param {TableStructure} [result] A pre-existing TableStructure object; if not present, creates a new one.
 */
TableStructure.fromJson = function(json, result) {
  if (!defined(json) || json.length === 0 || json[0].length === 0) {
    return;
  }
  if (!defined(result)) {
    result = new TableStructure();
  }
  // Build up the columns (=== items) and then replace them all in one go, so that knockout's tracking doesn't see every change.
  var columns = [];
  var columnNames = json[0];
  var rowNumber, name, values;
  for (
    var columnNumber = 0;
    columnNumber < columnNames.length;
    columnNumber++
  ) {
    name = isString(columnNames[columnNumber])
      ? columnNames[columnNumber].trim()
      : "_Column" + String(columnNumber);
    values = [];
    for (rowNumber = 1; rowNumber < json.length; rowNumber++) {
      values.push(json[rowNumber][columnNumber]);
    }
    var nameAndcolumnOptions = getColumnOptions(name, result, columnNumber);
    columns.push(
      new TableColumn(nameAndcolumnOptions[0], values, nameAndcolumnOptions[1])
    );
  }
  result.items = columns;
  return result;
};

/**
 * Create a TableStructure from a string in csv format.
 * Understands \r\n, \r and \n as newlines.
 *
 * @param {String} csvString String in csv format.
 * @param {TableStructure} [result] A pre-existing TableStructure object; if not present, creates a new one.
 */
TableStructure.fromCsv = function(csvString, result) {
  // Originally from jquery-csv plugin. Modified to avoid stripping leading zeros.
  function castToScalar(value, state) {
    if (state.rowNum === 1) {
      // Don't cast column names
      return value;
    } else {
      var hasDot = /\./;
      var leadingZero = /^0[0-9]/;
      var numberWithThousands = /^[1-9]\d?\d?(,\d\d\d)+(\.\d+)?$/;
      if (numberWithThousands.test(value)) {
        value = value.replace(/,/g, "");
      }
      if (isNaN(value)) {
        return value;
      }
      if (leadingZero.test(value)) {
        return value;
      }
      if (hasDot.test(value)) {
        return parseFloat(value);
      }
      var integer = parseInt(value, 10);
      if (isNaN(integer)) {
        return null;
      }
      return integer;
    }
  }

  //normalize line breaks
  csvString = csvString.replace(/\r\n|\r|\n/g, "\r\n");
  // Handle CSVs missing a final linefeed
  if (csvString[csvString.length - 1] !== "\n") {
    csvString += "\r\n";
  }
  var json = csv.toArrays(csvString, {
    onParseValue: castToScalar
  });
  // Remove any blank lines. Completely blank lines come back as [null]; lines with no entries as [null, null, ..., null].
  // So remove all lines that consist only of nulls.
  json = json.filter(function(jsonLine) {
    return !jsonLine.every(function(c) {
      return c === null;
    });
  });
  return TableStructure.fromJson(json, result);
};

/**
 * Load a JSON object into an existing TableStructure.
 *
 * @param {Object} json Table data as an object (in json format).
 */
TableStructure.prototype.loadFromJson = function(json) {
  return TableStructure.fromJson(json, this);
};

/**
 * Load a string in csv format into an existing TableStructure.
 *
 * @param {String} csvString String in csv format.
 */
TableStructure.prototype.loadFromCsv = function(csvString) {
  return TableStructure.fromCsv(csvString, this);
};

/**
 * Returns an array of active columns.
 * @returns {TableColumn[]} An array of active columns.
 */
TableStructure.prototype.getActiveColumns = function() {
  return this.columns.filter(function(column) {
    return column.isActive;
  });
};

// Returns indices such that sortedUniqueDates[inverseIndices[k]] = originalDates[k].
// Eg. var data = ['c', 'a', 'b', 'd'];
//     var sortedData = data.slice().sort();
//     var inverseIndices = data.map(function(datum) { return sortedData.indexOf(datum); });
//     expect(inverseIndices).toEqual([2, 0, 1, 3]);
// However this works by converting the dates to strings first.
function calculateInverseIndicies(originalDates, sortedUniqueDates) {
  var originalDateStrings = originalDates.map(function(date) {
    return date && JulianDate.toIso8601(date);
  });
  var sortedUniqueDateStrings = sortedUniqueDates.map(function(date) {
    return date && JulianDate.toIso8601(date);
  });
  return originalDateStrings.map(function(s) {
    return sortedUniqueDateStrings.indexOf(s);
  });
}

function calculateUniqueJulianDates(originalDates) {
  var uniqueJulianDates = originalDates.filter(function(d) {
    return defined(d);
  });
  // uniqueJulianDates.sort(JulianDate.compare); // We now assume they are sorted.
  uniqueJulianDates = uniqueJulianDates.filter(function(element, index, array) {
    return index === 0 || !JulianDate.equals(array[index - 1], element);
  });
  return uniqueJulianDates;
}

/**
 * @param  {JulianDate[]} startJulianDates An array of start dates.
 * @param  {Number} [localDefaultFinalDurationSeconds] The duration to use if there is only one date in the list. Defaults to defaultFinalDurationSeconds.
 * @param  {Number} [shaveSeconds] Subtract this many seconds from the end dates so they don't overlap (defaults to zero). If duration < 20 * shaveSeconds, use 5% of duration.
 * @param {JulianDate} [finalEndJulianDate] If present, use this for the final end date.
 * @return {JulianDate[]} An array of end dates which correspond to the array of start dates.
 */
function calculateFinishDatesFromStartDates(
  startJulianDates,
  localDefaultFinalDurationSeconds,
  shaveSeconds,
  finalEndJulianDate
) {
  // First calculate a set of unique dates. Assume they are pre-sorted.
  var sortedUniqueJulianDates = calculateUniqueJulianDates(startJulianDates);
  // indices[k] has the property that startJulianDates[indices[k]] = sortedUniqueJulianDates[k].
  var indices = calculateInverseIndicies(
    startJulianDates,
    sortedUniqueJulianDates
  );
  // Calculate end dates corresponding to each revised date (which are start dates).
  // Typically just shave a second off the next start date, unless the difference is < 20 seconds,
  // in which case shave off 5% of the difference.
  var endDates;
  if (shaveSeconds > 0) {
    endDates = sortedUniqueJulianDates
      .slice(1)
      .map(function(rawEndDate, index) {
        var secondsDifference = JulianDate.secondsDifference(
          rawEndDate,
          sortedUniqueJulianDates[index]
        );
        if (secondsDifference < 20) {
          return JulianDate.addSeconds(
            rawEndDate,
            -secondsDifference / 20,
            new JulianDate()
          );
        } else {
          return JulianDate.addSeconds(rawEndDate, -1, new JulianDate());
        }
      });
  } else {
    endDates = sortedUniqueJulianDates.slice(1);
  }
  // For the final end date, if there is a finalEndJulianDate, use it.
  // Otherwise, use the average spacing of the unique dates.
  // If there is only one date, use defaultFinalDurationSeconds.
  if (defined(finalEndJulianDate)) {
    endDates.push(finalEndJulianDate);
  } else {
    var finalDurationSeconds = defined(localDefaultFinalDurationSeconds)
      ? localDefaultFinalDurationSeconds
      : defaultFinalDurationSeconds;
    var n = sortedUniqueJulianDates.length;
    if (n > 1) {
      finalDurationSeconds =
        JulianDate.secondsDifference(
          sortedUniqueJulianDates[n - 1],
          sortedUniqueJulianDates[0]
        ) /
        (n - 1);
      endDates.push(
        JulianDate.addSeconds(
          sortedUniqueJulianDates[n - 1],
          finalDurationSeconds,
          new JulianDate()
        )
      );
    } else {
      endDates.push(undefined);
    }
  }

  var result = indices.map(function(sortedIndex) {
    return endDates[sortedIndex];
  });
  return result;
}

// For each row, find the next different date (minus 1 second).
// Restrict to only those rows with this value of the idColumnNames, if present.
// Return an array of these finish dates, one per row.
// Assume the rows are already sorted by date.
// For the final date, use the average spacing of the unique dates as the final duration.
// (If there is only one date, use a default value.)
function calculateFinishDates(columns, nameIdOrIndex, tableStructure) {
  // This is the start column.
  var timeColumn = getColumnWithNameIdOrIndex(
    valueOrFirstValue(nameIdOrIndex),
    columns
  );
  // If there is an end column as well, just use it.
  if (Array.isArray(nameIdOrIndex) && nameIdOrIndex.length > 1) {
    var endColumn = getColumnWithNameIdOrIndex(nameIdOrIndex[1], columns);
    if (defined(endColumn) && defined(endColumn.julianDates)) {
      return endColumn.julianDates;
    }
  }
  var startJulianDates = timeColumn.julianDates;
  if (
    !defined(tableStructure.idColumnNames) ||
    tableStructure.idColumnNames.length === 0
  ) {
    return calculateFinishDatesFromStartDates(
      startJulianDates,
      defaultFinalDurationSeconds,
      tableStructure.shaveSeconds,
      tableStructure.finalEndJulianDate
    );
  }
  // If the table has valid id columns, then take account of these by calculating feature-specific end dates.
  // First calculate the default duration for any rows with only one observation; this should match the average
  var finalDurationSeconds;
  var idMapping = getIdMapping(tableStructure.idColumnNames, columns);
  // Find a mapping with more than one row to estimate an average duration. We'll need this for any ids with only one row.
  for (var featureIdString in idMapping) {
    if (idMapping.hasOwnProperty(featureIdString)) {
      var rowNumbersWithThisId = idMapping[featureIdString];
      if (rowNumbersWithThisId.length > 1) {
        var theseStartDates = rowNumbersWithThisId.map(
          rowNumber => timeColumn.julianDates[rowNumber]
        );
        var sortedUniqueJulianDates = calculateUniqueJulianDates(
          theseStartDates
        );
        var n = sortedUniqueJulianDates.length;
        if (n > 1) {
          finalDurationSeconds =
            JulianDate.secondsDifference(
              sortedUniqueJulianDates[n - 1],
              sortedUniqueJulianDates[0]
            ) /
            (n - 1);
          break;
        }
      }
    }
  }
  // Build the end dates, one id at a time.
  var endDates = [];
  for (featureIdString in idMapping) {
    if (idMapping.hasOwnProperty(featureIdString)) {
      rowNumbersWithThisId = idMapping[featureIdString];
      theseStartDates = rowNumbersWithThisId.map(
        rowNumber => timeColumn.julianDates[rowNumber]
      );
      var theseEndDates = calculateFinishDatesFromStartDates(
        theseStartDates,
        finalDurationSeconds,
        tableStructure.shaveSeconds,
        tableStructure.finalEndJulianDate
      );
      for (var i = 0; i < theseEndDates.length; i++) {
        endDates[rowNumbersWithThisId[i]] = theseEndDates[i];
      }
    }
  }
  return endDates;
}

var endScratch = new JulianDate();
/**
 * Gets the finish time for the specified index.
 * @private
 * @param  {TableColumn} timeColumn The time column that applies to this data.
 * @param  {Integer} index The index into the time column.
 * @return {JulianDate} The finnish time that corresponds to the index.
 */
function finishFromIndex(timeColumn, index) {
  if (!defined(timeColumn.displayDuration)) {
    return timeColumn.finishJulianDates[index];
  } else {
    return JulianDate.addMinutes(
      timeColumn.julianDates[index],
      timeColumn.displayDuration,
      endScratch
    );
  }
}

/**
 * Calculate and return the availability interval for the index'th entry in timeColumn.
 * If the entry has no valid time, returns undefined.
 * @private
 * @param  {TableColumn} timeColumn The time column that applies to this data.
 * @param  {Integer} index The index into the time column.
 * @param  {JulianDate} endTime The last time for all intervals.
 * @return {TimeInterval} The time interval over which this entry is visible.
 */
function calculateAvailability(timeColumn, index, endTime) {
  var startJulianDate = timeColumn.julianDates[index];
  if (defined(startJulianDate)) {
    var finishJulianDate = finishFromIndex(timeColumn, index);
    return new TimeInterval({
      start: timeColumn.julianDates[index],
      stop: finishJulianDate,
      isStopIncluded: JulianDate.equals(finishJulianDate, endTime),
      data: timeColumn.julianDates[index] // Stop overlapping intervals being collapsed into one interval unless they start at the same time
    });
  }
}

/**
 * Calculates and returns TimeInterval array, whose elements say when to display each row.
 * @private
 */
function calculateTimeIntervals(timeColumn) {
  // First we find the last time for all of the data (this is an optomisation for the calculateAvailability operation.
  const endTime = timeColumn.values.reduce(function(latest, value, index) {
    const current = finishFromIndex(timeColumn, index);
    if (
      !defined(latest) ||
      (defined(current) && JulianDate.greaterThan(current, latest))
    ) {
      return current;
    }
    return latest;
  }, finishFromIndex(timeColumn, 0));

  return timeColumn.values.map(function(value, index) {
    return calculateAvailability(timeColumn, index, endTime);
  });
}

/**
 * Returns a DataSourceClock out of this column. Only call if this is a time column.
 * @private
 */
function createClock(timeColumn, tableStructure) {
  var availabilityCollection = new TimeIntervalCollection();
  timeColumn._timeIntervals
    .filter(function(availability) {
      return defined(availability && availability.start);
    })
    .forEach(function(availability) {
      availabilityCollection.addInterval(availability);
    });
  if (!defined(timeColumn._clock)) {
    if (
      availabilityCollection.length > 0 &&
      !availabilityCollection.start.equals(Iso8601.MINIMUM_VALUE)
    ) {
      var startTime = availabilityCollection.start;
      var stopTime = availabilityCollection.stop;
      var totalSeconds = JulianDate.secondsDifference(stopTime, startTime);
      var multiplier = Math.round(totalSeconds / 120.0);

      if (
        defined(tableStructure.idColumnNames) &&
        tableStructure.idColumnNames.length > 0
      ) {
        stopTime = timeColumn.julianDates.reduce((d1, d2) =>
          JulianDate.greaterThan(d1, d2) ? d1 : d2
        );
      }

      var clock = new DataSourceClock();
      clock.startTime = JulianDate.clone(startTime);
      clock.stopTime = JulianDate.clone(stopTime);
      clock.clockRange = ClockRange.LOOP_STOP;
      clock.multiplier = multiplier;
      clock.currentTime = JulianDate.clone(startTime);
      clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      return clock;
    }
  }
  return timeColumn._clock;
}

/**
 * Return data as an array of columns, eg. [ ['x', 1, 2, 3], ['y', 10, 20, 5] ].
 * @returns {Object} An array of column arrays, each beginning with the column name.
 */
TableStructure.prototype.toArrayOfColumns = function() {
  var result = [];
  var column;
  for (var i = 0; i < this.columns.length; i++) {
    column = this.columns[i];
    result.push(column.toArrayWithName());
  }
  return result;
};

/**
 * Return data as an array of rows of formatted data, eg. [ ['x', 'y'], ['1', '12,345'], ['2.1', '20'] ].
 * @param {String} [dateFormatString] If present, override the standard date format with a string (see https://www.npmjs.com/package/dateformat)
 *                 Eg. "isoDateTime" or "dd mmm yyyy HH:MM:ss".
 *                 "source" is a special override which uses the original source date format.
 * @param {Integer[]} [rowNumbers] An array of row numbers to return. Defaults to all rows.
 * @param {Boolean} [formatScalars] True by default; if false, leave numbers as they are.
 * @param {Boolean} [quoteStringsIfNeeded] False by default; if true, any strings which contain commas will be quoted (including column names).
 * @returns {Object} An array of rows of formatted data, the first of which is the column names. If they contain commas, they are quoted.
 */
TableStructure.prototype.toArrayOfRows = function(
  dateFormatString,
  rowNumbers,
  formatScalars,
  quoteStringsIfNeeded
) {
  if (this.columns.length < 1) {
    return [];
  }
  if (!defined(formatScalars)) {
    formatScalars = true;
  }
  var that = this;
  function updatedForQuotes(s) {
    // Following https://tools.ietf.org/html/rfc4180 .
    var hasQuotes = s.indexOf('"') >= 0;
    if (hasQuotes) {
      s = s.replace(/"/g, '""');
    }
    if (hasQuotes || s.indexOf(",") >= 0) {
      s = '"' + s + '"';
    }
    return s;
  }
  function getRow(rowNumber) {
    return that.columns.map(column => {
      if (dateFormatString && column.type === VarType.TIME) {
        if (dateFormatString === "source") {
          return column.values[rowNumber];
        }
        return dateFormat(column.dates[rowNumber], dateFormatString);
      }
      if (!formatScalars && column.type === VarType.SCALAR) {
        return column.values[rowNumber];
      }
      var formattedValue = column._formattedValues[rowNumber];
      if (quoteStringsIfNeeded) {
        // Put quotes around any value that contains commas or quotes, so csv format doesn't go nuts.
        return formattedValue && updatedForQuotes(formattedValue.toString());
      } else {
        return formattedValue;
      }
    });
  }
  var rows;
  if (defined(rowNumbers)) {
    rows = rowNumbers.map(getRow);
  } else {
    rows = that.columns[0].values.map((_, rowNumber) => getRow(rowNumber));
  }
  var columnNames = that.getColumnNames();
  if (quoteStringsIfNeeded) {
    columnNames = columnNames.map(s => updatedForQuotes(s));
  }
  rows.unshift(columnNames);
  return rows;
};

/**
 * Return data as a csv string with formatted values, eg. 'x,y\n1,"12,345"\n2.1,20'.
 * @param {String} [dateFormatString] If present, override the standard date format with a string (see https://www.npmjs.com/package/dateformat)
 *                 Eg. "isoDateTime" or "dd mmm yyyy HH:MM:ss".
 *                 "source" is a special override which uses the original source date format.
 * @param {Integer[]} [rowNumbers] An array of row numbers to return. Defaults to all rows.
 * @param {Boolean} [formatScalars] True by default; if false, leave numbers as they are.
 * @returns {String} Returns the data as a csv string, including the header row.
 */
TableStructure.prototype.toCsvString = function(
  dateFormatString,
  rowNumbers,
  formatScalars
) {
  var arraysOfRows = this.toArrayOfRows(
    dateFormatString,
    rowNumbers,
    formatScalars,
    true
  ); // true => quote strings with commas.
  var joinedRows = arraysOfRows.map(row => row.join(","));
  return joinedRows.join("\n");
};

/**
 * Return data as an array of rows of objects, eg. [{'x': 1, 'y': 10}, {'x': 2, 'y': 20}, ...].
 * Note this won't work if a column name is a javascript reserved word.
 * Has the same arguments as TableStructure.prototype.toArrayOfRows.
 * @returns {Object[]} Array of objects containing a property for each column of the row. If the table has no data, returns [].
 */
TableStructure.prototype.toRowObjects = function(
  dateFormatString,
  rowNumbers,
  formatScalars,
  quoteStringsWithCommas
) {
  var asRows = this.toArrayOfRows(
    dateFormatString,
    rowNumbers,
    formatScalars,
    quoteStringsWithCommas
  );
  if (!defined(asRows) || asRows.length < 1) {
    return [];
  }
  var columnNames = asRows[0];
  var result = [];
  for (var i = 1; i < asRows.length; i++) {
    var rowObject = {};
    for (var j = 0; j < columnNames.length; j++) {
      rowObject[columnNames[j]] = asRows[i][j];
    }
    result.push(rowObject);
  }
  return result;
};

/**
 * Return data as an array of rows of objects with string and number values, eg.
 *     [{'string': {'x': '12,345', 'y': '10'}, 'number': {'x': 12345, 'y': 10}}, {'string': {'x':...}, ...}].
 * @param {String} [dateFormatString] If present, override the standard date format with a string (see https://www.npmjs.com/package/dateformat)
 *                 Eg. "isoDateTime" or "dd mmm yyyy HH:MM:ss".
 *                 "source" is a special override which uses the original source date format.
 * @return {Object[]} Array of objects with "string" and "number" properties, whose properties are the column names.
 */
TableStructure.prototype.toStringAndNumberRowObjects = function(
  dateFormatString
) {
  var stringRows = this.toArrayOfRows(dateFormatString, undefined, true);
  if (!defined(stringRows) || stringRows.length < 1) {
    return [];
  }
  var numberRows = this.toArrayOfRows(dateFormatString, undefined, false);
  var columnNames = stringRows[0];
  var result = [];
  for (var i = 1; i < stringRows.length; i++) {
    var rowObject = { string: {}, number: {} };
    for (var j = 0; j < columnNames.length; j++) {
      rowObject.string[columnNames[j]] = stringRows[i][j];
      rowObject.number[columnNames[j]] = numberRows[i][j];
    }
    result.push(rowObject);
  }
  return result;
};

TableStructure.prototype.toDataUri = function() {
  return DataUri.make("csv", this.toCsvString("source"));
};

/**
 * Provide an array which maps ids to names, if they differ.
 * @return {Object[]} An array of objects with 'id' and 'name' properties; only where the id and name differ.
 */
TableStructure.prototype.getColumnAliases = function() {
  return this.columns
    .filter(function(column) {
      return column.id !== column.name;
    })
    .map(function(column) {
      return { id: column.id, name: column.name };
    });
};

function describeRow(tableStructure, rowObject, index, infoFields) {
  // Note this passes any html straight through, including tags.
  // We do not escape the keys or values because they could contain custom tags, eg. <chart>.
  var html = '<table class="cesium-infoBox-defaultTable">';
  for (var key in infoFields) {
    if (infoFields.hasOwnProperty(key)) {
      var value = rowObject[key];
      if (defined(value)) {
        // Skip keys starting with double underscore
        if (key.substring(0, 2) === "__") {
          continue;
        }
        html +=
          "<tr><td>" + infoFields[key] + "</td><td>" + value + "</td></tr>";
      }
    }
  }
  html += "</table>";
  return html;
}

/**
 * Returns data as an array of html for each row.
 * @param  {Array|Object} [featureInfoFields] Either an array of keys from the row objects, or an object that maps keys to names of keys.
 *         If not provided, defaults to using all keys unaltered.
 * @return {String[]} Array of html for each row.
 */
TableStructure.prototype.toRowDescriptions = function(featureInfoFields) {
  var infoFields = defined(featureInfoFields)
    ? featureInfoFields
    : this.getColumnNames();
  if (infoFields instanceof Array) {
    // Allow [ "FIELD1", "FIELD2" ] as a shorthand for { "FIELD1": "FIELD1", "FIELD2": "FIELD2" }
    var o = {};
    infoFields.forEach(function(key) {
      o[key] = key;
    });
    infoFields = o;
  }
  var that = this;
  return this.toRowObjects().map(function(rowObject, index) {
    return describeRow(that, rowObject, index, infoFields);
  });
};

/**
 * Returns the active columns as an array of arrays of objects with x and y properties, using js dates for x values if available.
 * Useful for plotting the data.
 * Eg. "a,b,c\n1,2,3\n4,5,6" => [[{x: 1, y: 2}, {x: 4, y: 5}], [{x: 1, y: 3}, {x: 4, y: 6}]].
 * @param  {TableColumn} [xColumn] Which column to use for the x values. Defaults to the first column.
 * @param  {TableColumn[]} [yColumns] Which columns to use for the y values. Defaults to all columns excluding xColumn.
 * @return {Array[]} The data as arrays of objects.
 */
TableStructure.prototype.toPointArrays = function(xColumn, yColumns) {
  var result = [];
  if (!defined(xColumn)) {
    xColumn = this.columns[0];
  }
  var xColumnValues =
    xColumn.type === VarType.TIME ? xColumn.dates : xColumn.values;
  if (!defined(yColumns)) {
    yColumns = this.columns.filter(column => column !== xColumn);
  }
  var getXYFunction = function(j) {
    return (x, index) => {
      return { x: x, y: yColumns[j].values[index] };
    };
  };
  for (var j = 0; j < yColumns.length; j++) {
    result.push(xColumnValues.map(getXYFunction(j)));
  }
  return result;
};

/**
 * Get the column names.
 *
 * @returns {String[]} Array of column names.
 */
TableStructure.prototype.getColumnNames = function() {
  var result = [];
  for (var i = 0; i < this.columns.length; i++) {
    result.push(this.columns[i].name);
  }
  return result;
};

/**
 * Returns the first column with the given name, or undefined if none match.
 *
 * @param {String} name The column name.
 * @param {TableColumn[]} [columns] If provided, test on these columns instead of this.columns.
 * @returns {TableColumn} The matching column.
 */
TableStructure.prototype.getColumnWithName = function(name, columns) {
  if (!defined(columns)) {
    columns = this.columns;
  }
  for (var i = 0; i < columns.length; i++) {
    if (columns[i].name === name) {
      return columns[i];
    }
  }
};

/**
 * Returns the index of the given column, or undefined if none match.
 * @param {TableStructure} tableStructure the table structure.
 * @param {TableColumn} column The column.
 * @returns {integer} The index of the column.
 * @private
 */
function getIndexOfColumn(tableStructure, column) {
  for (var i = 0; i < tableStructure.columns.length; i++) {
    if (tableStructure.columns[i] === column) {
      return i;
    }
  }
}

/**
 * Returns the first column with the given name or id, or undefined if none match.
 * @param {String} nameOrId The column name or id.
 * @param {TableColumn[]} columns Test on these columns.
 * @returns {TableColumn} The matching column.
 * @private
 */
function getColumnWithNameOrId(nameOrId, columns) {
  for (var i = 0; i < columns.length; i++) {
    if (columns[i].name === nameOrId || columns[i].id === nameOrId) {
      return columns[i];
    }
  }
}

/**
 * Returns the first column with the given name, id or index, or undefined if none match (or null is passed in).
 * @param {String|Integer|null} nameIdOrIndex The column name, id or index.
 * @param {TableColumn[]} columns Test on these columns.
 * @returns {TableColumn} The matching column.
 */
function getColumnWithNameIdOrIndex(nameIdOrIndex, columns) {
  if (nameIdOrIndex === null) {
    return undefined;
  }
  if (isInteger(nameIdOrIndex)) {
    return columns[nameIdOrIndex];
  }
  return getColumnWithNameOrId(nameIdOrIndex, columns);
}

/**
 * Returns the first column with the given name or id, or undefined if none match.
 * @param {String} nameOrId The column name or id.
 * @returns {TableColumn} The matching column.
 */
TableStructure.prototype.getColumnWithNameOrId = function(nameOrId) {
  return getColumnWithNameOrId(nameOrId, this.columns);
};

/**
 * Returns the first column with the given name, id or index, or undefined if none match (or null is passed in).
 * @param {String|Integer|null} nameIdOrIndex The column name, id or index.
 * @returns {TableColumn} The matching column.
 */
TableStructure.prototype.getColumnWithNameIdOrIndex = function(nameIdOrIndex) {
  return getColumnWithNameIdOrIndex(nameIdOrIndex, this.columns);
};

/**
 * Add column to tableStructure.
 *
 * @param {String} name Name of column (column header).
 * @param {Number[]} values Values of column to add to table.
 */
TableStructure.prototype.addColumn = function(name, values) {
  var nameAndColumnOptions = getColumnOptions(name, this, 0);
  var newCol = [new TableColumn(name, values, nameAndColumnOptions[1])];
  var newCols = newCol.concat(this.columns);
  this.columns = newCols;
};

// columns is a required parameter.
function getIdColumns(idColumnNames, columns) {
  if (!defined(idColumnNames)) {
    return [];
  }
  return idColumnNames.map(name => getColumnWithNameIdOrIndex(name, columns));
}

function getIdStringForRowNumber(idColumns, rowNumber) {
  return idColumns
    .map(function(column) {
      return column.values[rowNumber];
    })
    .join("^^");
}

/**
 * Returns an id string for the given row, based on idColumns (defaulting to idColumnNames).
 * Use this to index into the result of this.getIdMapping().
 * @param {Integer} rowNumber The row number.
 * @param {Array} [idColumnNames] An array of id column names (or indexes or ids).
 * @return {Object} An id string for that row based on joining the id column values for that row such as "Newtown^^NSW".
 */
TableStructure.prototype.getIdStringForRowNumber = function(
  rowNumber,
  idColumnNames
) {
  if (!defined(idColumnNames)) {
    idColumnNames = this.idColumnNames;
  }
  return getIdStringForRowNumber(
    getIdColumns(idColumnNames, this.columns),
    rowNumber
  );
};

// Both arguments are required.
function getIdMapping(idColumnNames, columns) {
  var idColumns = getIdColumns(idColumnNames, columns);
  if (idColumns.length === 0) {
    return {};
  }
  return idColumns[0].values.reduce(function(result, value, rowNumber) {
    var idString = getIdStringForRowNumber(idColumns, rowNumber);
    if (!defined(result[idString])) {
      result[idString] = [];
    }
    result[idString].push(rowNumber);
    return result;
  }, {});
}

/**
 * Returns a mapping from the idColumnNames to all the rows in the table with that id.
 * If no columnIdNames are defined, returns undefined.
 * @param {Array} [idColumnNames] Provide if you wish to override this table's own idColumnNames.
 *                This is supplied to getColumnWithNameIdOrIndex, so the "names" could be ids or indexes too.
 * @return {Object} An object with keys equal to idStrings (use tableStructure.getIdStringForRowNumber(i) to get this)
 *         and values equal to an array of rowNumbers.
 */
TableStructure.prototype.getIdMapping = function(idColumnNames) {
  if (!defined(idColumnNames)) {
    idColumnNames = this.idColumnNames;
  }
  return getIdMapping(idColumnNames, this.columns);
};

/**
 * Updates this table's columns with new ones, using the existing columns' metadata, and replacing the column values.
 * If a time column is present, reset it, which can involve sorting the columns.
 * @param  {Array[]} updatedColumnValuesArrays Array of values arrays.
 */
TableStructure.prototype.getUpdatedColumns = function(
  updatedColumnValuesArrays
) {
  return this.columns.reduce((updatedColumns, column, columnNumber) => {
    updatedColumns.push(
      new TableColumn(
        column.name,
        updatedColumnValuesArrays[columnNumber],
        column.getFullOptions()
      )
    );
    return updatedColumns;
  }, []);
};

/**
 * Appends table2 to this table. If rowNumbers are provided, only takes those
 * row numbers from table2.
 * Changes all the columns in one go, to avoid partial updates from tracked values.
 * @param {TableStructure} table2 The table to add to this one.
 * @param {Integer[]} [rowNumbers] The row numbers from table2 to add (defaults to all).
 */
TableStructure.prototype.append = function(table2, rowNumbers) {
  if (this.columns.length !== table2.columns.length) {
    throw new DeveloperError(
      "Cannot add tables with different numbers of columns."
    );
  }
  var updatedColumnValuesArrays = [];
  function mapRowNumberToValue(valuesToAdd) {
    return rowNumber => valuesToAdd[rowNumber];
  }
  for (
    var columnNumber = 0;
    columnNumber < table2.columns.length;
    columnNumber++
  ) {
    var valuesToAdd;
    if (defined(rowNumbers)) {
      valuesToAdd = rowNumbers.map(
        mapRowNumberToValue(table2.columns[columnNumber].values)
      );
      // Could also do: valuesToAdd = valuesToAdd.filter((_, rowNumber) => rowNumbers.indexOf(rowNumber) >= 0);
    } else {
      valuesToAdd = table2.columns[columnNumber].values;
    }
    updatedColumnValuesArrays.push(
      this.columns[columnNumber].values.concat(valuesToAdd)
    );
  }
  this.columns = this.getUpdatedColumns(updatedColumnValuesArrays);
};

/**
 * Replace specific rows in this table with rows in table2.
 * Changes all the columns in one go, to avoid partial updates from tracked values.
 * @param {TableStructure} table2 The table whose rows should replace this table's rows.
 * @param {Object} replacementMap An object whose properties are {table 1 row number: table 2 row number}.
 */
TableStructure.prototype.replaceRows = function(table2, replacementMap) {
  var updatedColumnValuesArrays = [];
  for (
    var columnNumber = 0;
    columnNumber < table2.columns.length;
    columnNumber++
  ) {
    updatedColumnValuesArrays.push(this.columns[columnNumber].values);
    for (var table1RowNumber in replacementMap) {
      if (replacementMap.hasOwnProperty(table1RowNumber)) {
        var table2RowNumber = replacementMap[table1RowNumber];
        updatedColumnValuesArrays[columnNumber][table1RowNumber] =
          table2.columns[columnNumber].values[table2RowNumber];
      }
    }
  }
  var updatedColumns = this.columns.map(
    (column, columnNumber) =>
      new TableColumn(
        column.name,
        updatedColumnValuesArrays[columnNumber],
        column.getFullOptions()
      )
  );
  this.columns = updatedColumns;
};

function getColumnWithSameId(column1, columns) {
  if (defined(column1)) {
    var matchingColumns = columns.filter(column => column.id === column1.id);
    if (matchingColumns.length !== 1) {
      throw new DeveloperError("Ambiguous column: " + column1.name);
    }
    return matchingColumns[0];
  }
}

/**
 * Merges the rows of table2 into the rows of this table.
 * Uses this.idColumnNames (and this.activeTimeColumn, if present) to identify matching rows.
 * The columns must be in the same order in the two tables.
 * Changes all the columns in one go, to avoid partial updates from tracked values.
 * @param  {TableStructure} table2 The table to merge into this one.
 */
TableStructure.prototype.merge = function(table2) {
  if (!defined(this.idColumnNames) || this.idColumnNames.length === 0) {
    throw new DeveloperError("Cannot merge tables without id columns.");
  }
  if (this.columns.length !== table2.columns.length) {
    throw new DeveloperError(
      "Cannot merge tables with different numbers of columns."
    );
  }
  var table1RowNumbersMap = this.getIdMapping();
  var table2RowNumbersMap = table2.getIdMapping(this.idColumnNames);
  var rowsFromTable2ToAppend = []; // An array of row numbers.
  var rowsToReplace = {}; // Properties are {table 1 row number: table 2 row number}.
  var table2ActiveTimeColumn = getColumnWithSameId(
    this.activeTimeColumn,
    table2.columns
  );
  for (var featureIdString in table2RowNumbersMap) {
    if (table2RowNumbersMap.hasOwnProperty(featureIdString)) {
      var table2RowNumbersForThisFeature = table2RowNumbersMap[featureIdString];
      var table1RowNumbersForThisFeature = table1RowNumbersMap[featureIdString];
      if (!defined(table1RowNumbersForThisFeature)) {
        // This feature appears in table 2, but not in table 1.
        // Add all these rows to table 1.
        rowsFromTable2ToAppend = rowsFromTable2ToAppend.concat(
          table2RowNumbersForThisFeature
        );
      } else if (!this.activeTimeColumn) {
        // The feature is in both tables, and there is no time column, so just replace table 1's.
        rowsToReplace[table1RowNumbersForThisFeature[0]] =
          table2RowNumbersForThisFeature[0];
      } else {
        for (var i = 0; i < table2RowNumbersForThisFeature.length; i++) {
          var table2RowNumber = table2RowNumbersForThisFeature[i];
          // Is there a row with this feature and this datetime already?
          var table1Dates = table1RowNumbersForThisFeature.map(rowNumber =>
            this.activeTimeColumn.dates[rowNumber].toString()
          );
          var table1DatesIndex = table1Dates.indexOf(
            table2ActiveTimeColumn.dates[table2RowNumber].toString()
          );
          if (table1DatesIndex >= 0) {
            // Yes, so replace it. (Noting table1DatesIndex is an index into table1RowNumbersForThisFeature.)
            rowsToReplace[
              table1RowNumbersForThisFeature[table1DatesIndex]
            ] = table2RowNumber;
          } else {
            // This is a new datetime, so append the row.
            rowsFromTable2ToAppend.push(table2RowNumber);
          }
        }
      }
    }
  }
  // Replace existing rows from Table 2.
  this.replaceRows(table2, rowsToReplace);
  // Append new rows from Table 2.
  this.append(table2, rowsFromTable2ToAppend);
};

/**
 * Sets the relevant active time column on the table structure, defaulting to the first time column present
 * unless the tableStyle has a 'timeColumn' property. A null timeColumn should explicitly not have a time column, even if one is present.
 * @param {String|Number|undefined} nameIdOrIndex A way to identify the column, eg. from tableStyle.timeColumn.
 */
TableStructure.prototype.setActiveTimeColumn = function(nameIdOrIndex) {
  function getIndexOfFirstTimeColumnOrStartAndEnd(columns) {
    var startIndex, endIndex;
    for (var i = columns.length - 1; i >= 0; i--) {
      if (columns[i].type === VarType.TIME) {
        if (columns[i]._isEndDate) {
          endIndex = i;
        } else {
          startIndex = i;
        }
      }
    }
    if (defined(endIndex)) {
      return [startIndex, endIndex];
    } else {
      return startIndex;
    }
  }
  // undefined should default to the first time column, null should explicitly have no time column.
  if (typeof nameIdOrIndex !== "undefined") {
    this.activeTimeColumnNameIdOrIndex = nameIdOrIndex;
    if (
      defined(this.activeTimeColumn) &&
      this.activeTimeColumn.type !== VarType.TIME
    ) {
      this.activeTimeColumnNameIdOrIndex = getIndexOfFirstTimeColumnOrStartAndEnd(
        this.columns
      );
      throw new DeveloperError(
        '"' + nameIdOrIndex + '" is not a valid time column.'
      );
    }
  } else {
    this.activeTimeColumnNameIdOrIndex = getIndexOfFirstTimeColumnOrStartAndEnd(
      this.columns
    );
  }
};

// Returns new columns sorted in sortColumn order.
function getSortedColumns(tableStructure, sortColumn, compareFunction) {
  // With help from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  var mappedArray = sortColumn.julianDatesOrValues.map(function(value, i) {
    return { index: i, value: value };
  });
  if (!defined(compareFunction)) {
    if (sortColumn.type === VarType.TIME) {
      compareFunction = function(a, b) {
        if (defined(a) && defined(b)) {
          return JulianDate.compare(a, b);
        }
        return defined(a) ? -1 : defined(b) ? 1 : 0; // so that undefined > defined, ie. all undefined dates go to the end.
      };
    } else {
      compareFunction = function(a, b) {
        return +(a > b) || +(a === b) - 1;
      };
    }
  }
  mappedArray.sort(function(a, b) {
    return compareFunction(a.value, b.value);
  });
  return tableStructure.columns.map(column => {
    var sortedValues = mappedArray.map(element => column.values[element.index]);
    return new TableColumn(column.name, sortedValues, column.getFullOptions());
  });
}

/**
 * Sorts the rows of the TableStructure by the provided column's values.
 * If the sortColumn is a date/time column, uses its julianDates to sort; otherwise, the values.
 * The tableStructure is given new TableColumns.
 * @param {TableColumn} sortColumn Column whose values should be sorted.
 * @param {Function} [compareFunction] The compare function passed to Array.prototype.sort().
 */
TableStructure.prototype.sortBy = function(sortColumn, compareFunction) {
  this.columns = getSortedColumns(this, sortColumn, compareFunction);
};

/**
 * Given an id, find the index of the column and return that.
 * Will return undefined if column with matching id cannot be found in tableStructure.
 * @param {Number} id Id of column to find index of.
 * @return {Number} index of column.
 */
TableStructure.prototype.getColumnIndex = function(id) {
  var index;
  for (var i = 0; i < this.columns.length; i++) {
    if (id === this.columns[i].id) {
      index = i;
    }
  }
  return index;
};

/**
 * Given an optional array of row numbers of the table which you would like to make into a chart,
 * returns the key information for that chart, ie. the data (in csv string format), units, and x and y labels.
 * @param  {Number[]} [rowNumbers] The row numbers.
 * @return {Object} An object with xName, yName, csvData (Strings) and units (String[]) properties.
 */
TableStructure.prototype.getChartDetailsForRowNumbers = function(rowNumbers) {
  var csvData = this.toCsvString("source", rowNumbers, false);
  const yColumn = this.getActiveColumns()[0];
  if (defined(yColumn) && yColumn.type === VarType.SCALAR) {
    return {
      xName: this.activeTimeColumn.name,
      yName: yColumn.name,
      csvData: csvData,
      units: this.columns.map(column => column.units || "")
    };
  }
};

/**
 * Returns new columns for this table structure that include rows for all features at the full table's start and end dates,
 * if they do not already exist.  The data for all columns is copied from the feature's start and end date row,
 * except for the provided valueColumn, which is set to null.
 * Pass the time column explicitly if desired, to override this.activeTimeColumn. (Useful if you want to call this before setting it.)
 * It is recommended if you use this, to also set the table's finalEndJulianDate beforehand, so the new feature rows don't blow out the end dates.
 * @param {String|Integer} timeColumnNameIdOrIndex  Name, id or index of the time column.
 * @param {String|Integer} valueColumnNameIdOrIndex Name, id or index of the column which should be set to null at the table's start and end dates.
 */
TableStructure.prototype.getColumnsWithFeatureRowsAtStartAndEndDates = function(
  timeColumnNameIdOrIndex,
  valueColumnNameIdOrIndex
) {
  // Get the min and max dates, both as a Number (which can be turned into a js date with new Date(number)),
  // and in the same format as the original.
  var tableStructure = this;
  var valueColumnIndex = getIndexOfColumn(
    tableStructure,
    tableStructure.getColumnWithNameIdOrIndex(valueColumnNameIdOrIndex)
  );
  if (!defined(timeColumnNameIdOrIndex)) {
    timeColumnNameIdOrIndex = tableStructure.activeTimeColumnNameIdOrIndex;
  }
  var timeColumn = tableStructure.getColumnWithNameIdOrIndex(
    timeColumnNameIdOrIndex
  );
  var timeColumnIndex = getIndexOfColumn(tableStructure, timeColumn);

  var dates = timeColumn.dates;
  var minDateAsNumber = Math.min.apply(null, dates);
  var maxDateAsNumber = Math.max.apply(null, dates);
  var minDateString =
    timeColumn.values[dates.map(d => Number(d)).indexOf(minDateAsNumber)];
  var maxDateString =
    timeColumn.values[dates.map(d => Number(d)).indexOf(maxDateAsNumber)];
  // For each separate feature, as defined by this.idColumnNames, decide if we need to add missing-valued entry
  // for the min and max dates.
  var idMapping = tableStructure.getIdMapping();
  var copiedColumnValues = tableStructure.columns.map(c => c.values.slice());
  function addRowToCopiedColumnValues(newDateValue, rowNumberToCopy) {
    // Appends a row to all the values from rowNumberToCopy, updates the date to newDateValue, and sets valueColumn to null.
    var newRowNumber = copiedColumnValues[0].length;
    for (var i = 0; i < copiedColumnValues.length; i++) {
      copiedColumnValues[i].push(
        tableStructure.columns[i].values[rowNumberToCopy]
      );
    }
    copiedColumnValues[timeColumnIndex][newRowNumber] = newDateValue;
    copiedColumnValues[valueColumnIndex][newRowNumber] = null;
  }
  Object.keys(idMapping).forEach(idString => {
    var rowNumbers = idMapping[idString];
    if (rowNumbers.length > 0) {
      if (Number(timeColumn.dates[rowNumbers[0]]) > minDateAsNumber) {
        addRowToCopiedColumnValues(minDateString, rowNumbers[0]);
      }
      var lastRowNumber = rowNumbers[rowNumbers.length - 1];
      if (Number(timeColumn.dates[lastRowNumber]) < maxDateAsNumber) {
        addRowToCopiedColumnValues(maxDateString, lastRowNumber);
      }
    }
  });
  return this.getUpdatedColumns(copiedColumnValues);
};

/**
 * Destroy the object and release resources. Is this necessary?
 */
TableStructure.prototype.destroy = function() {
  return destroyObject(this);
};

/**
 * Return column options object, using defaults where appropriate.
 *
 * @param  {String} name Name of column
 * @param  {TableStructure} tableStructure TableStructure to use to calculate values.
 * @param  {Int} columnNumber Which column should be used as template for default column options
 * @return {Object} Column options that TableColumn's constructor understands
 */
function getColumnOptions(name, tableStructure, columnNumber) {
  var columnOptions = defaultValue.EMPTY_OBJECT;
  if (defined(tableStructure.columnOptions)) {
    columnOptions = defaultValue(
      tableStructure.columnOptions[name],
      defaultValue(
        tableStructure.columnOptions[columnNumber],
        defaultValue.EMPTY_OBJECT
      )
    );
  }
  var niceName = defaultValue(columnOptions.name, name);
  var type = getVarTypeFromString(columnOptions.type);
  var format = defaultValue(columnOptions.format, format);
  var displayDuration = defaultValue(
    columnOptions.displayDuration,
    tableStructure.displayDuration
  );
  var replaceWithNullValues = defaultValue(
    columnOptions.replaceWithNullValues,
    tableStructure.replaceWithNullValues
  );
  var replaceWithZeroValues = defaultValue(
    columnOptions.replaceWithZeroValues,
    tableStructure.replaceWithZeroValues
  );
  var colOptions = {
    tableStructure: tableStructure,
    displayVariableTypes: tableStructure.displayVariableTypes,
    unallowedTypes: tableStructure.unallowedTypes,
    displayDuration: displayDuration,
    replaceWithNullValues: replaceWithNullValues,
    replaceWithZeroValues: replaceWithZeroValues,
    id: name,
    type: type,
    units: columnOptions.units,
    format: columnOptions.format,
    active: columnOptions.active,
    chartLineColor: columnOptions.chartLineColor,
    yAxisMin: columnOptions.yAxisMin,
    yAxisMax: columnOptions.yAxisMax
  };
  return [niceName, colOptions];
}

/**
 * Normally a TableStructure is generated from a csvString, using loadFromCsv, or via loadFromJson.
 * However, if its columns are set directly, we should check the columns are all the same length.
 * @private
 * @param  {Concept[]} columns Array of columns to check.
 * @return {Boolean} True if the columns are all the same length, false otherwise.
 */
function areColumnsEqualLength(columns) {
  if (columns.length <= 1) {
    return true;
  }
  var firstLength = columns[0].values.length;
  var columnsWithTheSameLength = columns.slice(1).filter(function(column) {
    return column.values.length === firstLength;
  });
  return columnsWithTheSameLength.length === columns.length - 1;
}

/**
 * Given columns, returns columnsByType, which is an object whose keys are elements of VarType,
 * and whose values are arrays of TableColumn objects of that type.
 * All types are present (eg. structure.columnsByType[VarType.ALT] always exists), possibly [].
 * @private
 */
function getColumnsByType(columns) {
  var columnsByType = {};
  for (var varType in VarType) {
    if (VarType.hasOwnProperty(varType)) {
      var v = VarType[varType]; // we don't want the keys to be LAT, LON, ..., but 0, 1, ...
      columnsByType[v] = [];
    }
  }
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    if (defined(columnsByType[column.type])) {
      columnsByType[column.type].push(column);
    }
  }
  return columnsByType;
}

function isInteger(value) {
  return (
    !isNaN(value) &&
    parseInt(Number(value), 10) === +value &&
    !isNaN(parseInt(value, 10))
  );
}

function isString(param) {
  return typeof param === "string" || param instanceof String;
}

// Return the value, or value[0] if it is an array.
function valueOrFirstValue(valueOrArray) {
  if (Array.isArray(valueOrArray)) {
    return valueOrArray[0];
  }
  return valueOrArray;
}

module.exports = TableStructure;

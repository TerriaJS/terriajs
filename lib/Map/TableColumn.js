/*global require*/
"use strict";

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var destroyObject = require("terriajs-cesium/Source/Core/destroyObject")
  .default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var uniq = require("lodash.uniq");

var formatNumberForLocale = require("../Core/formatNumberForLocale");
var inherit = require("../Core/inherit");
var VarType = require("../Map/VarType");
var VarSubType = require("../Map/VarSubType");
var VariableConcept = require("../Map/VariableConcept");

var typeHintSet = [
  { hint: /^(lon|long|longitude|lng)$/i, type: VarType.LON },
  { hint: /^(lat|latitude)$/i, type: VarType.LAT },
  { hint: /^(address|addr)$/i, type: VarType.ADDR },
  { hint: /^(.*[_ ])?(depth|height|elevation)$/i, type: VarType.ALT },
  { hint: /^(.*[_ ])?(time|date)/i, type: VarType.TIME }, // Quite general, eg. matches "Start date (AEST)".
  { hint: /^(year)$/i, type: VarType.TIME }, // Match "year" only, not "Final year" or "0-4 years".
  { hint: /^postcode|poa|(.*_code)$/i, type: VarType.ENUM }
];

var endDateHintSet = [
  { hint: /^(.*[_ ])?end[\s_]?(time|date)/i, type: true } // Matches "end_date" or "My end time (AEST)".
];

var subtypeHintSet = [{ hint: /^(.*[_ ])?(year)/i, type: VarSubType.YEAR }];

var defaultReplaceWithNullValues = ["na", "NA", "-"];
var defaultReplaceWithZeroValues = [];

/**
 * TableColumn is a light class containing a single variable (or column) from a TableStructure.
 * It guesses the variable type (time, enum etc) from the variable name.
 * It extends VariableConcept, which is used to represent the variable in the NowViewing tab.
 * This gives it isActive, isSelected and color fields.
 * In future it may perform additional processing.
 *
 * @alias TableColumn
 * @constructor
 * @extends {VariableConcept}
 * @param {String} [name] The name of the variable.
 * @param {Number[]} [values] An array of values for the variable.
 * @param {Object} [options] Options:
 * @param {Boolean} [options.active] Whether the variable should start active.
 * @param {TableStructure} [options.tableStructure] The table structure this column belongs to. Required so that only one column is selected at a time.
 * @param {VarType} [options.type] The variable type (eg. VarType.TIME). If not present, an educated guess is made based on the name and values.
 * @param {VarSubType} [options.subtype] The variable subtype (eg. VarSubType.YEAR). If not present, an educated guess is made based on the name and values.
 * @param {Boolean} [options.isEndDate] True if this is has type time and is an end_date. If not present, an educated guess is made based on the name and values.
 * @param {VarType[]} [options.unallowedTypes] An array of types which should not be guessed. If not present, all types are allowed. Cannot include VarType.SCALAR.
 * @param {VarType[]} [options.displayVariableTypes] If present, only make this variable visible if its type is in this list.
 * @param {String[]} [options.replaceWithNullValues] If present, and this is a SCALAR type with at least one numerical value, then replace these values with null.
 *        Defaults to ['na', 'NA'].
 * @param {String[]} [options.replaceWithZeroValues] If present, and this is a SCALAR type with at least one numerical value, then replace these values with 0.
 *        Defaults to [null, '-']. (Blank values like '' are converted to null before they reach here, so use null instead of '' to catch missing values.)
 * @param {Number} [options.displayDuration]
 * @param {String} [options.id] Provided so that columns can be renamed; their original name is stored as the id.
 * @param {String} [options.format] A format string for this column. For numbers, this is passed as options to toLocaleString.
 * @param {String} [options.units] The units of this column, if known. Not currently used internally by TableStructure or TableColumn.
 * @param {String} [options.chartLineColor] The string description of the chart line color of this variable, if any.
 * @param {Number} [options.yAxisMin] Override for the minimum display value of the y axis in charts.
 * @param {Number} [options.yAxisMax] Override for the maximum display value of the y axis in charts.
 */
var TableColumn = function(name, values, options) {
  this.options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  // Note - if you add more options, be sure to include them in getFullOptions() too.
  VariableConcept.call(this, name, {
    parent: this.options.tableStructure,
    active: this.options.active,
    color: this.options.chartLineColor
  });
  this.id = defaultValue(this.options.id, this.id); // if options.id is provided, use it to override the default (this.id = this.name).
  this.format = this.options.format;
  this.units = this.options.units;

  this._rawValues = values;
  this._unallowedTypes = defaultValue(this.options.unallowedTypes, []);
  this._replaceWithZeroValues = defaultValue(
    this.options.replaceWithZeroValues,
    defaultReplaceWithZeroValues
  );
  this._replaceWithNullValues = defaultValue(
    this.options.replaceWithNullValues,
    defaultReplaceWithNullValues
  );
  this._type = this.options.type;
  this._subtype = this.options.subtype;
  this._isEndDate = this.options.isEndDate;
  if (!defined(this._type)) {
    this.setTypeAndSubTypeFromName();
  }

  var isNumerical = function(value) {
    return typeof value === "number";
  };

  if (this._type === VarType.SCALAR && values.some(isNumerical)) {
    // Before setting this._values, replace '-' and 'NA' etc with zero/null. Min/max values ignore nulls.
    this._values = replaceValues(
      values,
      this._replaceWithZeroValues,
      this._replaceWithNullValues
    );
  } else {
    this._values = values;
  }
  this._numericalValues = this._values && this._values.filter(isNumerical);

  var nonNullValues = this._values.filter(function(value) {
    return value !== null;
  });
  this._minimumValue = Math.min.apply(null, nonNullValues); // Note: a single NaN value makes this NaN (hence replaceValues above).
  this._maximumValue = Math.max.apply(null, nonNullValues);

  this.yAxisMin = this.options.yAxisMin;
  this.yAxisMax = this.options.yAxisMax;

  this._uniqueValues = undefined;
  this._indicesIntoUniqueValues = undefined;

  this.displayDuration = this.options.displayDuration; // undefined is fine.

  /**
   * this.dates is a version of values that has been converted to javascript Dates.
   * Only if type === VarType.TIME.
   */
  this.dates = undefined;
  /**
   * this.julianDates is a version of values that has been converted to JulianDates.
   * Only if type === VarType.TIME.
   */
  this.julianDates = undefined;
  /**
   * this.finishJulianDates is an Array of JulianDates listing the next different date in the values array, less 1 second.
   * This is populated by TableStructure, since it may depend on other columns.
   * Only if type === VarType.TIME.
   */
  this.finishJulianDates = undefined;
  /**
   * A TimeInterval Array giving when each row applies.
   * This is populated by TableStructure, since it may depend on other columns.
   * Only if type === VarType.TIME.
   */
  this._timeIntervals = undefined;
  /**
   * A DataSourceClock whose start and stop times correspond to the first and last visible row.
   * This is populated by TableStructure, since it may depend on other columns.
   * Only if type === VarType.TIME.
   */
  this._clock = undefined;

  if (defined(values) && this._type === VarType.TIME) {
    var jsDatesAndJulianDates = convertToDates(this);
    this.dates = jsDatesAndJulianDates.jsDates;
    this.julianDates = jsDatesAndJulianDates.julianDates;
    if (this.dates.length === 0) {
      // We couldn't interpret this as dates after all. Change type to scalar.
      this._type = VarType.SCALAR;
    } else {
      this._subtype = jsDatesAndJulianDates.subtype;
    }
  }

  // If it looked like a SCALAR but there are no numerical values, change type to ENUM.
  if (isNaN(this._minimumValue) && this._type === VarType.SCALAR) {
    this._type = VarType.ENUM;
  }

  // Finally, distinguish between ENUM and html tags.
  if (this._type === VarType.ENUM && looksLikeHtmlTags(this.values)) {
    this._type = VarType.TAG;
  }

  updateForType(this);

  this._formattedValues = getFormattedValues(this);

  // Track _type so that TableStructure can change columnsByType if type changes.
  // Track _values so that charts can update live with new data.
  // Track units so that we can set the units after data has loaded, and the chart panel updates.
  knockout.track(this, ["_type", "_values", "units", "_timeIntervals"]);
};

inherit(VariableConcept, TableColumn);

function replaceValues(values, replaceWithZeroValues, replaceWithNullValues) {
  // Replace "bad" values like "-" with zero, and "na" with null.
  // Note this does not go back and update TableStructure._rows, so the row descriptions will still show the original values.
  return values.map(function(value) {
    if (replaceWithZeroValues.indexOf(value) >= 0) {
      return 0;
    }
    if (replaceWithNullValues.indexOf(value) >= 0) {
      return null;
    }
    return value;
  });
}

function updateForType(tableColumn) {
  // Currently cannot change type to TIME and expect it to work.
  // But could update this.dates etc when set to VarType.TIME (if needed).
  tableColumn._uniqueValues = undefined;
  tableColumn._indicesIntoUniqueValues = undefined;

  tableColumn._displayVariableTypes = tableColumn.options.displayVariableTypes;
  if (defined(tableColumn._displayVariableTypes)) {
    tableColumn.isVisible =
      tableColumn._displayVariableTypes.indexOf(tableColumn._type) >= 0;
  }
}

Object.defineProperties(TableColumn.prototype, {
  /**
   * Gets or sets the type of this column.
   * @memberOf TableColumn.prototype
   * @type {VarType}
   */
  type: {
    get: function() {
      return this._type;
    },
    set: function(type) {
      this._type = type;
      updateForType(this);
    }
  },

  /**
   * Gets or sets the subtype of this column.
   * @memberOf TableColumn.prototype
   * @type {VarSubType}
   */
  subtype: {
    get: function() {
      return this._subtype;
    },
    set: function(subtype) {
      this._subtype = subtype;
      // updateForType(this);
    }
  },

  /**
   * Gets the values of this column.
   * @memberOf TableColumn.prototype
   * @type {Array}
   */
  values: {
    get: function() {
      return this._values;
    }
  },

  /**
   * Gets the column's numerical values only.
   * This is the quantity used for the legend.
   * @memberOf TableColumn.prototype
   * @type {Array}
   */
  numericalValues: {
    get: function() {
      return this._numericalValues;
    }
  },

  /**
   * Returns whether this column is an ENUM type.
   * @memberOf TableColumn.prototype
   * @type {Boolean}
   */
  isEnum: {
    get: function() {
      return this._type === VarType.ENUM;
    }
  },

  /**
   * Gets formatted values of this column.
   * @memberOf TableColumn.prototype
   * @type {Array}
   */
  formattedValues: {
    get: function() {
      return this._formattedValues;
    }
  },

  /**
   * Gets the minimum value of this column.
   * @memberOf TableColumn.prototype
   * @type {Number}
   */
  minimumValue: {
    get: function() {
      return this._minimumValue;
    }
  },

  /**
   * Gets the maximum value of this column.
   * @memberOf TableColumn.prototype
   * @type {Number}
   */
  maximumValue: {
    get: function() {
      return this._maximumValue;
    }
  },

  /**
   * Returns this column's unique values only. Only defined if non-numeric.
   * @memberOf TableColumn.prototype
   * @type {Array}
   */
  uniqueValues: {
    get: function() {
      if (this.isEnum && !defined(this._uniqueValues)) {
        this._uniqueValues = uniq(this._values).filter(function(value) {
          return value !== null;
        });
        sortMostCommonFirst(this._values, this._uniqueValues);
      }
      return this._uniqueValues;
    }
  },

  /**
   * Returns this column's values, except for TIME-type columns, in which case the julian dates are returned.
   * @memberOf TableColumn.prototype
   * @type {Array}
   */
  julianDatesOrValues: {
    get: function() {
      return this.type === VarType.TIME ? this.julianDates : this._values;
    }
  },

  /**
   * Returns an array describing when each row is visible. Only defined if type == VarType.TIME.
   * @memberOf TableColumn.prototype
   * @type {TimeIntervalCollection[]}
   */
  timeIntervals: {
    get: function() {
      return this._timeIntervals;
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
      return this._clock;
    }
  }
});

// If -'s or /'s are used to separate the fields, replace them with /'s, and
// swap the first and second fields.
// Eg. '30-12-2015' => '12/30/2015', the US format, because that is what javascript's Date expects.
function swapDateFormat(v) {
  var part = v.split(/[/-]/);
  if (part.length === 3) {
    v = part[1] + "/" + part[0] + "/" + part[2];
  }
  return v;
}

// Replace hypens with slashes in a three-part date, eg. '4-6-2015' => '4/6/2015' or '2015-12-5' => '2015/12/5'.
// This helps because '2015-12-5' will display differently in different browsers, whereas '2015/12/5' will not.
// Also, convert timestamp info, dropping milliseconds, timezone and replacing 'T' with a space.
// Eg.: 'yyyy-mm-ddThh:mm:ss.qqqqZ' => 'yyyy/mm/dd hh:mm:ss'.
function replaceHyphensAndConvertTime(v) {
  var time = "";
  if (!defined(v.indexOf)) {
    // could be a number, eg. times may be simple numbers like 730.
    return v;
  }
  var tIndex = v.indexOf("T");
  if (tIndex >= 0) {
    var times = v.substr(tIndex + 1).split(":");
    if (times && times.length > 1) {
      time = " " + times[0] + ":" + times[1];
    }
    if (times.length > 2) {
      time = time + ":" + parseInt(times[2], 10);
    }
    v = v.substr(0, tIndex);
  }
  var part = v.split(/-/);
  if (part.length === 3) {
    v = part[0] + "/" + part[1] + "/" + part[2];
  }
  return v + time;
}

function isInteger(value) {
  // Eg. Returns false for '99a', undefined and null, true for '99' and 99.
  return (
    !isNaN(value) &&
    parseInt(Number(value), 10) === +value &&
    !isNaN(parseInt(value, 10))
  );
}

/**
 * Returns the options you would pass to recreate this column.
 * @return {Object} An options parameter suitable for passing to new TableColumn().
 */
TableColumn.prototype.getFullOptions = function() {
  return {
    tableStructure: this.parent,
    active: this.isActive,
    id: this.id,
    format: this.format,
    units: this.units,
    unallowedTypes: this._unallowedTypes,
    replaceWithZeroValues: this._replaceWithZeroValues,
    replaceWithNullValues: this._replaceWithNullValues,
    type: this._type,
    subtype: this._subtype,
    isEndDate: this._isEndDate,
    displayDuration: this.displayDuration,
    displayVariableTypes: this._displayVariableTypes,
    chartLineColor: this.color,
    yAxisMin: this.yAxisMin,
    yAxisMax: this.yAxisMax
  };
};

/**
 * Simple check to try to guess date format, based on max value of first position.
 * If dates are consistent with US format, it will use US format (mm-dd-yyyy).
 *
 * @param {Array} goodValues An array of the column values, with any bad (eg. null) values removed.
 * @param {Integer} [subtype] If known, eg. VarSubType.YEAR.
 * @private
 * @return {Object} Object with keys:
 *         subtype: The identified subtype, or undefined.
 *         jsDates: The values as javascript dates.
 *         julianDates: The values as JulianDates.
 */
TableColumn.convertToDates = function(goodValues, subtype) {
  // All browsers appear to understand both yyyy/m/d and m/d/yyyy as arguments to Date (but not with hyphens).
  // See http://dygraphs.com/date-formats.html
  var firstPositionMaximum = 0; // call this firstPositionMaximum because parseInt('12-10') = 12.
  goodValues.forEach(function(value) {
    var firstPosition = parseInt(value, 10);
    if (firstPosition > firstPositionMaximum) {
      firstPositionMaximum = firstPosition;
    }
  });

  var dateParsers; // returns [jsDate, julianDate].
  // First, could it be a simple integer year format? Assume if all integers less than 9999, then years.
  if (
    subtype === VarSubType.YEAR ||
    (firstPositionMaximum < 9999 &&
      goodValues.every(value => isInteger(value) || !defined(value)))
  ) {
    // It's ok to have some missing (null or undefined) values.
    subtype = VarSubType.YEAR;
    dateParsers = function(v) {
      var jsDate = new Date(v + "/01/01");
      return [jsDate, JulianDate.fromDate(jsDate)];
    };
  } else if (
    firstPositionMaximum < 9999 &&
    goodValues.every(
      value =>
        !defined(value) || (defined(value.indexOf) && value.indexOf("-Q")) === 4
    )
  ) {
    // Is it quarterly data in the format yyyy-Qx ? (Ignoring null values, and failing on any purely numeric values)
    dateParsers = function(v) {
      var year = v.slice(0, 4);
      var quarter = v.slice(6);
      var monthString;
      if (quarter === "1") {
        monthString = "01/01";
      } else if (quarter === "2") {
        monthString = "04/01";
      } else if (quarter === "3") {
        monthString = "07/01";
      } else if (quarter === "4") {
        monthString = "10/01";
      } else {
        return [undefined, undefined];
      }
      var jsDate = new Date(year + "/" + monthString);
      return [jsDate, JulianDate.fromDate(jsDate)];
    };
  } else if (firstPositionMaximum > 31) {
    dateParsers = function(v) {
      // If it contains a space, it may be either yyyy-mm-dd hh:mm:ss, or yyyy/mm/dd hh:mm:ss.
      if (v.indexOf(" ") > 0 && v.indexOf(":") > 0) {
        var jsDate = new Date(replaceHyphensAndConvertTime(v));
        return [jsDate, JulianDate.fromDate(jsDate)];
      } else {
        // Assume it is a properly defined ISO format  yyyy-mm-dd or yyyy-mm-ddThh:mm:ss
        // Note that Safari and some older browsers cannot handle ISO format, hence the need to go via JulianDate.
        var julianDate = JulianDate.fromIso8601(v);
        return [JulianDate.toDate(julianDate), julianDate]; // It may be better to use jsDate = new Date(replaceHyphensAndConvertTime(v));
      }
    };
  } else if (firstPositionMaximum > 12) {
    //Int'l javascript format dd-mm-yyyy
    dateParsers = function(v) {
      var jsDate = new Date(swapDateFormat(v));
      return [jsDate, JulianDate.fromDate(jsDate)];
    };
  } else {
    //USA javascript date format mm-dd-yyyy
    dateParsers = function(v) {
      var jsDate = new Date(replaceHyphensAndConvertTime(v)); // The T check is overkill for this.
      return [jsDate, JulianDate.fromDate(jsDate)];
    };
  }

  var results = [];
  try {
    results = goodValues.map(function(v) {
      if (defined(v)) {
        const parsed = dateParsers(v);
        if (
          !isFinite(parsed[0]) ||
          !defined(parsed[1]) ||
          !isFinite(parsed[1].dayNumber) ||
          !isFinite(parsed[1].secondsOfDay)
        ) {
          return [undefined, undefined];
        } else {
          return parsed;
        }
      } else {
        return [undefined, undefined];
      }
    });
  } catch (err) {
    // Repeat one by one so we can display the bad date.
    try {
      for (var i = 0; i < goodValues.length; i++) {
        dateParsers(goodValues[i]);
      }
    } catch (err) {
      console.log("Unable to parse date:", goodValues[i], err);
    }
  }
  // We now have results = [ [jsDate1, julianDate1], [jsDate2, julianDate2], ...] - unzip them and return them.
  return {
    subtype: subtype,
    jsDates: results.map(function(twoDates) {
      return twoDates[0];
    }),
    julianDates: results.map(function(twoDates) {
      return twoDates[1];
    })
  };
};

/**
 * Simple check to try to guess date format, based on max value of first position.
 * If dates are consistent with US format, it will use US format (mm-dd-yyyy).
 *
 * @param  {TableColumn} tableColumn The column.
 * @return {Object} Object with keys:
 *         subtype: The identified subtype, or undefined.
 *         jsDates: The values as javascript dates.
 *         julianDates: The values as JulianDates.
 */
function convertToDates(tableColumn) {
  // Before converting to dates, we ignore values which would be replaced with null or zero.
  // Do this by replacing both sorts with null.
  var goodValues = replaceValues(
    tableColumn._values,
    [],
    tableColumn._replaceWithNullValues.concat(
      tableColumn._replaceWithZeroValues
    )
  );
  return TableColumn.convertToDates(goodValues, tableColumn.subtype);
}

// Returns true if all non-blank values could be html tags.
// Test by checking if the first character is <, and it ends with a >, has length at least 5, and it either:
//  finishes "/>" (to catch <br/>),
//  contains "=" (to catch <img src="foo">), or
//  contains another < and >, but not << or >> at the start and end (to catch <div>Foo</div>).
function looksLikeHtmlTags(values) {
  for (var i = values.length - 1; i >= 0; i--) {
    var value = values[i];
    if (value === null) {
      continue;
    }
    if (!defined(value) || !defined(value.indexOf)) {
      return false;
    }
    if (
      value[0] !== "<" ||
      value[value.length - 1] !== ">" ||
      value.length < 5
    ) {
      return false;
    }
    if (value[value.length - 2] === "/") {
      continue;
    }
    if (value.indexOf("=") >= 0) {
      continue;
    }
    var cutValue = value.substr(2, value.length - 4);
    if (cutValue.indexOf("<") > 0 && cutValue.indexOf(">") >= 0) {
      continue;
    }
    return false;
  }
  return true;
}

// zip([[1, 2, 3], [4, 5, 6]]) = [[1, 4], [2, 5], [3, 6]].
function zip(arrayOfArrays) {
  return arrayOfArrays[0].map(function(_, secondIndex) {
    return arrayOfArrays.map(function(_, firstIndex) {
      return arrayOfArrays[firstIndex][secondIndex];
    });
  });
}

/**
 * Sums the values of a number of TableColumns.
 * @param {...TableColumn} The table columns (either a single array or as separate arguments).
 * @return {Number[]} Array of values of the sum.
 */
TableColumn.sumValues = function() {
  var columns;
  if (arguments.length === 1) {
    columns = arguments[0];
  } else {
    columns = Array.prototype.slice.call(arguments); // Gives arguments a map property.
  }
  var allValues = columns.map(function(column) {
    return column.values;
  });
  var transposed = zip(allValues);
  return transposed.map(function(rowValues) {
    return rowValues.reduce(function(x, y) {
      if (x === null && y === null) {
        return null;
      }
      if (x === null) {
        return +y;
      }
      if (y === null) {
        return +x;
      }
      return +x + +y;
    });
  });
};

/**
 * Divides the values of one TableColumns into another, optionally replacing those with denominator zero.
 * @param {TableColumn} numerator The column whose values form the numerator.
 * @param {TableColumn} denominator The column whose values form the denominator.
 * @return {Number[]} Array of values of numerator / denominator.
 */
TableColumn.divideValues = function(numerator, denominator, nanReplace) {
  return denominator.values.map(function(denominatorValue, index) {
    if (denominatorValue === 0 && defined(nanReplace)) {
      return nanReplace;
    }
    return +numerator.values[index] / +denominatorValue;
  });
};

function sortMostCommonFirst(values, uniqueValues) {
  var frequencies = values.reduce(function(frequencies, thisValue) {
    if (!defined(frequencies[thisValue])) {
      frequencies[thisValue] = 1;
    } else {
      frequencies[thisValue] += 1;
    }
    return frequencies;
  }, {});
  uniqueValues.sort(function(a, b) {
    // Sort with most common value first; if two have the same frequency, sort by key order.
    return frequencies[b] - frequencies[a] || (a < b ? -1 : a > b ? 1 : 0);
  });
}

/**
 * Guesses the best variable type based on its name. Returns undefined if no guess.
 * @private
 * @param {Object[]} hintSet The hint set to use, eg. [{ hint: /^(.*[_ ])?(year)/i, type: VarSubType.YEAR }].
 * @param {String} name The variable name, eg. 'Time (AEST)'.
 * @param {VarType[]|VarSubType[]} unallowedTypes Types not to consider. Pass [] to consider all types or subtypes.
 * @return {VarType|VarSubType} The variable type or subtype, eg. VarType.SCALAR.
 */
function applyHintsToName(hintSet, name, unallowedTypes) {
  for (var i in hintSet) {
    if (hintSet[i].hint.test(name)) {
      var guess = hintSet[i].type;
      if (unallowedTypes.indexOf(guess) === -1) {
        return guess;
      }
    }
  }
}

function getFormattedValues(tableColumn) {
  if (tableColumn.type === VarType.SCALAR) {
    // Use raw values so no replacements are made in the displayed value, eg. "-" stays "-".
    return tableColumn._rawValues.map(function(value) {
      if (isNaN(value)) {
        return value;
      }
      return formatNumberForLocale(value, tableColumn.format);
    });
  } else if (tableColumn.type === VarType.TIME) {
    return tableColumn.dates.map(function(date, index) {
      // date is a javascript Date, which will display as eg. Thu Jan 28 2016 15:22:37 GMT+1100 (AEDT).
      // If the original string contains a "T", then it is ISO8601 format, and we can format it more nicely.
      var value = tableColumn._values[index];
      if (
        (typeof value === "string" || value instanceof String) &&
        value.indexOf("T") >= 0
      ) {
        // If there was no timezone info in the original, remove the timezone info from the output string.
        var time = value.split("T")[1];
        if (
          !(
            time.indexOf("+") >= 0 ||
            time.indexOf("-") >= 0 ||
            time.indexOf("Z") >= 0
          )
        ) {
          return date.toDateString() + " " + date.toTimeString().split(" ")[0];
        } else {
          return date.toString();
        }
      }
      // If it wasn't ISO8601 format with a 'T', then leave it in the original format.
      if (defined(value)) {
        return value;
      }
      return "";
    });
  } else {
    // For anything else, just replace nulls with ''
    return tableColumn._values.map(function(value) {
      return value === null ? "" : value;
    });
  }
}

/**
 * Try to determine the best variable type based on the variable name.
 * Sets the _type and _subtype properties.
 */
TableColumn.prototype.setTypeAndSubTypeFromName = function() {
  var type = applyHintsToName(typeHintSet, this.name, this._unallowedTypes);
  if (!defined(type)) {
    type = VarType.SCALAR;
    if (this._unallowedTypes.indexOf(VarType.SCALAR) >= 0) {
      throw new DeveloperError("No suitable variable type found.");
    }
  }
  this._type = type;
  this._subtype = applyHintsToName(subtypeHintSet, this.name, []);
  this._isEndDate = applyHintsToName(endDateHintSet, this.name, []);
};

/**
 * Returns this column as an array, with the name as the first element, eg. ['x', 1, 3, 4].
 * @return {Array} The column as an array.
 */
TableColumn.prototype.toArrayWithName = function() {
  return [this.name].concat(this.values);
};

/**
 * Destroy the object and release resources. Is this necessary?
 */
TableColumn.prototype.destroy = function() {
  return destroyObject(this);
};

module.exports = TableColumn;

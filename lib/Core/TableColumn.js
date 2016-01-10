/*global require*/
"use strict";

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var VarType = require('../Map/VarType');  // Why is VarType in Map directory?
var VariableConcept = require('../Models/VariableConcept');

var hintSet = [
    { hint: /^(lon|longitude|lng)$/i, type: VarType.LON },
    { hint: /^(lat|latitude)$/i, type: VarType.LAT },
    { hint: /^(.*[_ ])?(depth|height|elevation)$/i, type: VarType.ALT },
    { hint: /^(.*[_ ])?(time|date)/i, type: VarType.TIME },
    { hint: /^postcode|poa|(.*_code)$/i, type: VarType.ENUM }
];

var defaultFinalDurationSeconds = 3000;

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
* @param {String} name The name of the variable.
* @param {Number[]} values An array of values for the variable.
* @param {Object} [options] Options:
* @param {TableStructure} [options.tableStructure] The table structure this column belongs to. Required so that only one column is selected at a time.
* @param {VarType} [options.type] The variable type (eg. VarType.SCALAR). If not present, an educated guess is made based on the name.
* @param {Array} [options.displayVariableTypes] If present, only make this variable visible if its type is in this list.
* @param {Number} [finalDurationSeconds] For time variables, how long should the final value persist in the animation? Defaults to defaultFinalDurationSeconds.
*/
var TableColumn = function(name, values, options) {
    this._options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    VariableConcept.call(this, name, {
        parent: this._options.tableStructure
    });

    this._type = defaultValue(this._options.type, TableColumn.guessVariableTypeFromName(name));
    this._values = values;
    this._minimumValue = Math.min.apply(null, values);
    this._maximumValue = Math.max.apply(null, values);
    this._numericalValues = this._values.filter(function(value) { return typeof value === 'number'; });
    this._indicesIntoUniqueValues = undefined;

    // If was a scalar, but min/max failed, then handle as enumerated variable
    if (this._type === VarType.SCALAR && isNaN(this._minimumValue)) {
        this._type = VarType.ENUM;
    }

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
     * Only if type === VarType.TIME.
     */
    this.finishJulianDates = undefined;

    if (this._type === VarType.TIME) {
        var jsDatesAndJulianDates = convertToDates(values);
        this.dates = jsDatesAndJulianDates[0];
        this.julianDates = jsDatesAndJulianDates[1];
        if (!defined(this.dates)) {
            // We couldn't interpret this as dates after all. Change type to scalar.
            this._type = VarType.SCALAR;   
        } else {
            var finalDurationSeconds = defaultValue(this._options.finalDurationSeconds, defaultFinalDurationSeconds);
            this.finishJulianDates = calculateFinishDates(this.julianDates, finalDurationSeconds);
        }
    }

    // If it looked like a SCALAR but there are no numerical values, change type to ENUM.
    if (isNaN(this._minimumValue) && this._type === VarType.SCALAR) {
        this._type = VarType.ENUM;
    }

    updateForType(this);

    knockout.track(this, ['_type']);  // so that TableStructure can change columnsByType if type changes.
};

inherit(VariableConcept, TableColumn);


function updateForType(tableColumn) {
    // Current cannot change type to TIME and expect it to work.
    // But could update this.dates etc when set to VarType.TIME (if needed).
    tableColumn._uniqueValues = undefined;
    if (tableColumn.usesIndicesIntoUniqueValues) {
        // If it is a non-numeric ENUM type, then calculate numerical indices into the uniqueValues,
        // for easier legend and color handling.
        tableColumn._uniqueValues = getUniqueValues(tableColumn._values);
        tableColumn._indicesIntoUniqueValues = tableColumn._values.map(function(value) {
            return tableColumn._uniqueValues.indexOf(value);
        });
    }

    tableColumn._displayVariableTypes = tableColumn._options.displayVariableTypes;
    if (defined(tableColumn._displayVariableTypes)) {
        tableColumn.isVisible = (tableColumn._displayVariableTypes.indexOf(tableColumn._type) >= 0);
    }
}

defineProperties(TableColumn.prototype, {
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
     * If this column is a non-numeric ENUM type, then gets this column's indices into uniqueValues.
     * Otherwise, gets the column's numerical values only.
     * This is the quantity used for coloring and for the legend.
     * @memberOf TableColumn.prototype
     * @type {Array}
     */
    indicesOrNumericalValues: {
        get: function() {
            if (this.usesIndicesIntoUniqueValues) {
                return this._indicesIntoUniqueValues;
            } else {
                return this._numericalValues;
            }
        }
    },

    /**
     * Returns whether this column's indicesOrValues is indices,
     * ie. whether this column is a non-numeric ENUM type.
     * @memberOf TableColumn.prototype
     * @type {Boolean}
     */
    usesIndicesIntoUniqueValues: {
        get: function() {
            return (isNaN(this._minimumValue) && this._type === VarType.ENUM);
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
     * @type {Boolean}
     */
    uniqueValues: {
        get: function() {
            return this._uniqueValues;
        }
    }
});


// If -'s or /'s are used to separate the fields, replace them with /'s, and
// swap the first and second fields.
// Eg. '30-12-2015' => '12/30/2015', the US format, because that is what javascript's Date expects.
function swapDateFormat(v) {
    var part = v.split(/[/-]/);
    if (part.length === 3) {
        v = part[1] + '/' + part[0] + '/' + part[2];
    }
    return v;
}

// Replace hypens with slashes in a three-part date, eg. '4-6-2015' => '4/6/2015' or '2015-12-5' => '2015/12/5'.
// This helps because '2015-12-5' will display differently in different browsers, whereas '2015/12/5' will not.
// Also, convert timestamp info, dropping milliseconds, timezone and replacing 'T' with a space.
// Eg.: 'yyyy-mm-ddThh:mm:ss.qqqqZ' => 'yyyy/mm/dd hh:mm:ss'.
function replaceHyphensAndConvertTime(v) {
    var time = '';
    if (!defined(v.indexOf)) {
        // could be a number, eg. times may be simple numbers like 730.
        return v;
    }
    var tIndex = v.indexOf('T');
    if (tIndex >= 0) {
        var times = v.substr(tIndex + 1).split(':');
        if (times && times.length > 1) {
            time = ' ' + times[0] + ':' + times[1];
        }
        if (times.length > 2) {
            time = time + ':' + parseInt(times[2]);
        }
        v = v.substr(0, tIndex);
    }
    var part = v.split(/-/);
    if (part.length === 3) {
        v = part[0] + '/' + part[1] + '/' + part[2];
    }
    return v + time;
}

function convertToDates(values) {
    // Simple check to try to guess date format, based on max value of first position.
    // If dates are consistent with US format, it will use US format (mm-dd-yyyy).
    var firstPositionMaximum = 0;
    values.map(function(value) {
        var firstPosition = parseInt(value);
        if (firstPosition > firstPositionMaximum) {
            firstPositionMaximum = firstPosition;
        }
    });

    var dateParsers;  // returns [jsDate, julianDate].
    // All browsers appear to understand both yyyy/m/d and m/d/yyyy as arguments to Date (but not with hyphens).
    // See http://dygraphs.com/date-formats.html
    if (firstPositionMaximum > 31) {  
        // assume it is a properly defined ISO format  yyyy-mm-dd or yyyy-mm-ddThh:mm:ss
        // note that Safari and some older browsers cannot handle ISO format, hence the need to go via
        dateParsers = function(v) {
            var julianDate = JulianDate.fromIso8601(v);
            return [JulianDate.toDate(julianDate), julianDate];  // it may be better to use jsDate = new Date(replaceHyphensAndConvertTime(v));
        };
    }
    else if (firstPositionMaximum > 12) { //Int'l javascript format dd-mm-yyyy
        dateParsers = function(v) {
            var jsDate = new Date(swapDateFormat(v));
            return [jsDate, JulianDate.fromDate(jsDate)];
        };
    }
    else {  //USA javascript date format mm-dd-yyyy
        dateParsers = function(v) {
            var jsDate = new Date(replaceHyphensAndConvertTime(v)); // the T check is overkill for this
            return [jsDate, JulianDate.fromDate(jsDate)];
        };
    }

    var results = [];
    try {
        results = values.map(dateParsers);
    }
    catch (err) {
        // repeat one by one so we can display the bad date
        try {
            for (var i = 0; i < values.length; i++) {
                dateParsers(values[i]);
            }
        } catch (err) {
            console.log('Unable to parse date:', values[i], err);
        }
    }
    // we now have results = [ [jsDate1, julianDate1], [jsDate2, julianDate2], ...] - unzip them and return them
    return [
        results.map(function(twoDates) { return twoDates[0]; }),
        results.map(function(twoDates) { return twoDates[1]; })
    ];
}

// For each date, find the next different date (minus 1 second). Return an array of these finish dates.
// Since the last date won't have a value, add finalDurationSeconds to it.
function calculateFinishDates(julianDates, finalDurationSeconds) {
    // first calculate a set of unique, sorted dates
    var revisedDates = julianDates.slice();
    revisedDates.sort(JulianDate.compare);
    revisedDates = revisedDates.filter(function(element, index, array) {
        return index === 0 || !JulianDate.equals(array[index - 1], element);
    });

    function shave(t) {
        // subtract a second from end values to avoid having slices actually overlap.
        return JulianDate.addSeconds(t, -1, new JulianDate());
    }

    return julianDates.map(function(startDate, index) {
        for (var i = 0; i < revisedDates.length - 1; i++) {
            if (JulianDate.greaterThan(revisedDates[i + 1], startDate)) {
                return shave(revisedDates[i + 1]);
            }
        }
        return JulianDate.addSeconds(startDate, finalDurationSeconds, new JulianDate());
    });
}

function getUniqueValues(values) {
    var uniqueValues = [];
    for (var i = 0; i < values.length; i++) {
        if (uniqueValues.indexOf(values[i]) === -1) {
            uniqueValues.push(values[i]);
        }
    }
    return uniqueValues;
}

/**
 * Try to determine the best variable type based on the variable name.
 * @param  {String} name The variable name, eg. 'Time (AEST)'.
 * @return {VarType} The variable type, eg. VarType.SCALAR.
 */
TableColumn.guessVariableTypeFromName = function(name) {
    for (var i in hintSet) {
        if (hintSet[i].hint.test(name)) {
            return hintSet[i].type;
        }
    }
    return VarType.SCALAR;
};

/**
 * Returns this column as an array, with the name as the first element, eg. ['x', 1, 3, 4].
 * @return {Array} The column as an array.
 */
TableColumn.prototype.toArrayWithName = function() {
    return [this.name].concat(this.values);
};


/**
* Destroy the object and release resources
*
*/
TableColumn.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = TableColumn;




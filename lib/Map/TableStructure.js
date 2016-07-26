/*global require*/
'use strict';

var dateFormat = require('dateformat');

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var csv = require('../ThirdParty/csv');
var DisplayVariablesConcept = require('../Map/DisplayVariablesConcept');
var inherit = require('../Core/inherit');
var TableColumn = require('./TableColumn');
var VarType = require('../Map/VarType');

var defaultDisplayVariableTypes = [VarType.ENUM, VarType.SCALAR, VarType.ALT];

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
 * @param {Number} [options.displayDuration] Passed on to TableColumn, unless overridden by options.columnOptions.
 * @param {String[]} [options.replaceWithNullValues] Passed on to TableColumn, unless overridden by options.columnOptions.
 * @param {String[]} [options.replaceWithZeroValues] Passed on to TableColumn, unless overridden by options.columnOptions.
 * @param {Object} [options.columnOptions] An object with keys identifying columns (column names or indices),
 *                 and per-column properties displayDuration, replaceWithNullValues, replaceWithZeroValues, name, units and/or type.
 *                 For type, converts strings, which are case-insensitive keys of VarType, to their VarType integer.
 * @param {Function} [options.getColorCallback] Passed to DisplayVariableConcept.
 * @param {Entity} [options.sourceFeature] The feature to which this table applies, if any; not used internally by TableStructure or TableColumn.
 */
var TableStructure = function(name, options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    DisplayVariablesConcept.call(this, name, options.getColorCallback);

    this.displayVariableTypes = defaultValue(options.displayVariableTypes, defaultDisplayVariableTypes);
    this.unallowedTypes = options.unallowedTypes;
    this.displayDuration = options.displayDuration;
    this.replaceWithNullValues = options.replaceWithNullValues;
    this.replaceWithZeroValues = options.replaceWithZeroValues;
    this.columnOptions = options.columnOptions;
    this.sourceFeature = options.sourceFeature;

    /**
     * Gets or sets the active time column for this structure,
     * @memberOf TableStructure.prototype
     * @type {TableColumn}
     */
    this.activeTimeColumn = undefined;

    // Track sourceFeature as it is shown on the NowViewing panel.
    // Track items so that charts can update live. (Already done by DisplayVariableConcept.)
    knockout.track(this, ['sourceFeature']);

    /**
     * Gets the columnsByType for this structure,
     * an object whose keys are VarTypes, and whose values are arrays of TableColumn with matching type.
     * Only existing types are present (eg. columnsByType[VarType.ALT] may be undefined).
     * @memberOf TableStructure.prototype
     * @type {Object}
     */
    knockout.defineProperty(this, 'columnsByType', {
        get: function() {
            return getColumnsByType(this.items);
        }
    });
};
inherit(DisplayVariablesConcept, TableStructure);

defineProperties(TableStructure.prototype, {
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
                var msg = 'Badly formed data table - columns have different lengths.';
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
            return (defined(longitudeColumn) && defined(latitudeColumn));
        }
    }
});

function getVarTypeFromString(typeString) {
    if (!defined(typeString)) {
        return;
    }
    var typeNumber = parseInt(typeString, 10);
    if (typeNumber === typeNumber) {  // parseInt returns NaN for non-numeric strings, and NaN !== NaN.
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
    for (var columnNumber = 0; columnNumber < columnNames.length; columnNumber++) {
        name = isString(columnNames[columnNumber]) ? columnNames[columnNumber].trim() : '_Column' + String(columnNumber);
        values = [];
        for (rowNumber = 1; rowNumber < json.length; rowNumber++) {
            values.push(json[rowNumber][columnNumber]);
        }
        var columnOptions = defaultValue.EMPTY_OBJECT;  // This will be set to the options relevant to this column.
        if (defined(result.columnOptions)) {
            columnOptions = defaultValue(result.columnOptions[name], defaultValue(result.columnOptions[columnNumber], defaultValue.EMPTY_OBJECT));
        }
        var niceName = defaultValue(columnOptions.name, name);
        var type = getVarTypeFromString(columnOptions.type);
        var displayDuration = defaultValue(columnOptions.displayDuration, result.displayDuration);
        var replaceWithNullValues = defaultValue(columnOptions.replaceWithNullValues, result.replaceWithNullValues);
        var replaceWithZeroValues = defaultValue(columnOptions.replaceWithZeroValues, result.replaceWithZeroValues);
        columns.push(new TableColumn(niceName, values, {
            tableStructure: result,
            displayVariableTypes: result.displayVariableTypes,
            unallowedTypes: result.unallowedTypes,
            displayDuration: displayDuration,
            replaceWithNullValues: replaceWithNullValues,
            replaceWithZeroValues: replaceWithZeroValues,
            id: name,
            type: type,
            units: columnOptions.units,
            format: columnOptions.format
        }));
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
        }
        else {
            var hasDot = /\./;
            var leadingZero = /^0[0-9]/;
            var numberWithThousands = /^[1-9]\d?\d?(,\d\d\d)+(\.\d+)?$/;
            if (numberWithThousands.test(value)) {
                value = value.replace(/,/g, '');
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
    csvString = csvString.replace(/\r\n|\r|\n/g, '\r\n');
    // Handle CSVs missing a final linefeed
    if (csvString[csvString.length - 1] !== '\n') {
        csvString += '\r\n';
    }
    var json = csv.toArrays(csvString, {
        onParseValue: castToScalar
    });
    // Remove any blank lines. Completely blank lines come back as [null]; lines with no entries as [null, null, ..., null].
    // So remove all lines that consist only of nulls.
    json = json.filter(function(jsonLine) { return !jsonLine.every(function(c) { return (c === null); }); });
    return TableStructure.fromJson(json, result);
};

// /**
//  * Create a new TableStructure from arrays of columns, eg. [[col1, col2, col3], [col4, col5]].
//  * The first columns of each array must be of the same type (in the above example, col1 and col4).
//  * These are combined and sorted into a single column.
//  * Then the subsequent columns are added, filling with null where missing. (This could be an option in future.)
//  * Eg. if the values of each col are: col1.values=[1,3]; col2.values=[10,30]; col3.values=[100,300]; col4.values=[1,2]; col5.values=[-1,-2];
//  * then the resulting TableStructure's columns' values are, in order, [1,2,3]; [10,null,30]; [100,null,300]; [-1,-2,null].
//  * @param {Array[]} columnArrays See description above.
//  * @param {TableStructure} [result] A pre-existing TableStructure object; if not present, creates a new one.
//  * @return {TableStructure} The synthesized table structure.
//  */
// TableStructure.fromColumnArrays = function(columnArrays, result) {
//     if (!defined(columnArrays) || columnArrays.length < 1) {
//         return;
//     }
//     var combinedValueArrays = [];
//     // Start by copying the first set of columns into the result.
//     var firstArray = columnArrays[0];
//     var columnSource = []; // The n-th column of the result comes from columnArrays[columnSource[n].i][columnSource[n].j].
//     var finalColumnIndex = 0;
//     for (var j = 0; j < firstArray.length; j++) {
//         var thisColumn = firstArray[j];
//         combinedValueArrays.push(thisColumn.julianDatesOrValues.slice());
//         columnSource[finalColumnIndex++] = {i: 0, j: j};
//     }
//     // Then add the subsequent sets of x-columns to the end of the first result column,
//     // add nulls to the end of the other existing columns,
//     // add nulls to the start of the new columns,
//     // and add them to the end of the result.
//     for (var i = 1; i < columnArrays.length; i++) {
//         var currentColumns = columnArrays[i];
//         if (currentColumns[0].type !== firstArray[0].type) {
//             throw new DeveloperError('Cannot combine tables with x-columns of different types.');
//         }
//         var currentFirstColumn = currentColumns[0];
//         var preExistingValuesLength = combinedValueArrays[0].length;
//         combinedValueArrays[0] = combinedValueArrays[0].concat(currentFirstColumn.julianDatesOrValues);
//         var empty1 = new Array(currentFirstColumn.values.length); // elements are undefined.
//         for (var k = 1; k < combinedValueArrays.length; k++) {
//             combinedValueArrays[k] = combinedValueArrays[k].concat(empty1);
//         }
//         var empty2 = new Array(preExistingValuesLength); // elements are undefined.
//         for (j = 1; j < currentColumns.length; j++) {
//             var currentColumn = currentColumns[j];
//             combinedValueArrays.push(empty2.concat(currentColumn.julianDatesOrValues));
//             columnSource[finalColumnIndex++] = {i: i, j: j};
//         }
//     }

//     // Sort by the first column.
//     combinedValueArrays = sortByFirst(combinedValueArrays, firstArray[0].type);
//     combinedValueArrays = combineRepeated(combinedValueArrays, firstArray[0].type);

//     if (!defined(result)) {
//         result = new TableStructure();
//     }
//     result.columns = combinedValueArrays.map(function(values, n) {
//         var sourceColumn = columnArrays[columnSource[n].i][columnSource[n].j];
//         return new TableColumn(sourceColumn.name, values, sourceColumn.options);
//     });

//     return result;
// };

// /**
//  * Create combined arrays from arrays of column values, eg. [[values1, values2, values3], [values4, values5]].
//  * The first columns of each array must be of the same type (in the above example, values1 and values4).
//  * These are combined and sorted into a single column.
//  * Then the subsequent columns are added, filling with null where missing. (This could be an option in future.)
//  * Eg. if the values of each col are: values1=[1,3]; values2=[10,30]; values3=[100,300]; values4=[1,2]; values5=[-1,-2];
//  * then the resulting array of column values are, in order, [1,2,3]; [10,null,30]; [100,null,300]; [-1,-2,null].
//  * @param {Array[]} valueArrays See description above.
//  * @return {Array[]} The synthesized values which could be passed to a table structure.
//  */
// TableStructure.combineValueArrays = function(valueArrays) {
//     if (!defined(valueArrays) || valueArrays.length < 1) {
//         return;
//     }
//     var combinedValueArrays = [];
//     // Start by copying the first set of columns into the result.
//     var firstArray = valueArrays[0];
//     var columnSource = []; // The n-th column of the result comes from columnArrays[columnSource[n].i][columnSource[n].j].
//     var finalColumnIndex = 0;
//     for (var j = 0; j < firstArray.length; j++) {
//         var values = firstArray[j];
//         combinedValueArrays.push(values.slice());
//         columnSource[finalColumnIndex++] = {i: 0, j: j};
//     }
//     // Then add the subsequent sets of x-columns to the end of the first result column,
//     // add nulls to the end of the other existing columns,
//     // add nulls to the start of the new columns,
//     // and add them to the end of the result.
//     for (var i = 1; i < valueArrays.length; i++) {
//         var currentValueArray = valueArrays[i];
//         var currentFirstArray = currentValueArray[0];
//         var preExistingValuesLength = combinedValueArrays[0].length;
//         combinedValueArrays[0] = combinedValueArrays[0].concat(currentFirstArray);
//         var empty1 = new Array(currentFirstArray.length); // elements are undefined.
//         for (var k = 1; k < combinedValueArrays.length; k++) {
//             combinedValueArrays[k] = combinedValueArrays[k].concat(empty1);
//         }
//         var empty2 = new Array(preExistingValuesLength); // elements are undefined.
//         for (j = 1; j < currentValueArray.length; j++) {
//             values = currentValueArray[j];
//             combinedValueArrays.push(empty2.concat(values));
//             columnSource[finalColumnIndex++] = {i: i, j: j};
//         }
//     }

//     // Sort by the first column.
//     combinedValueArrays = sortByFirst(combinedValueArrays);
//     combinedValueArrays = combineRepeated(combinedValueArrays);

//     return combinedValueArrays;
// };
// /**
//  * Eg. sortByFirst([['b', 'a', 'c'], [1, 2, 3]]) = [['a', 'b', 'c'], [2, 1, 3]].
//  * @param  {Array[]} valueArrays The array of arrays of values to sort.
//  * @return {Array[]} The values sorted by the first column.
//  */
// function sortByFirst(valueArrays, firstColumnType) {
//     var firstValues = valueArrays[0];
//     var compareFunction;
//     if (firstColumnType === VarType.TIME) {
//         compareFunction = JulianDate.compare;
//     }
//     var indices = sortedIndices(firstValues, compareFunction);
//     // var length = firstValues.length;
//     // var indices = new Array(length);
//     // for (var i = 0; i < length; i++) {
//     //     indices[i] = i;
//     // }
//     // indices.sort(function(a, b) {
//     //     return (firstValues[a] < firstValues[b]) ? -1 : (firstValues[a] > firstValues[b]) ? 1 : 0;
//     // });
//     return valueArrays.map(function(values) {
//         return indices.map(function(sortedIndex) { return values[sortedIndex]; });
//     });
// }

// *
//  * To determine the meaning of repeated, if firstColumnType is VarType.TIME, then TableColumn's julianDates to compare.
//  * @param  {Array[]} sortedJulianDateOrValueArrays The array of arrays of values to combine. These must be sortedByFirst. Dates must be JulianDates.
//  * @param  {Integer} [firstColumnType] Eg. VarType.TIME.
//  * @return {Array[]} The values, with any repeats in the first column combined into one. Dates are converted to ISO8601 string representation.
//  *
//  * Eg.
//  * var x = [['a', 'b', 'b', 'c'], [1, 2, undefined, 3], [4, undefined, 5, undefined]];
//  * combineRepeated(x);
//  * # x is [['a', 'b', 'c'], [1, 2, 3], [4, 5, undefined]].

// function combineRepeated(sortedJulianDateOrValueArrays, firstColumnType) {
//     if (firstColumnType === VarType.TIME) {
//         // Replace this column with the string form of the JulianDates they represent, so different representations match.
//         // Do not pass the subtype, because different time columns may have different subtypes.
//         sortedJulianDateOrValueArrays[0] = sortedJulianDateOrValueArrays[0].map(function(jdate) { return JulianDate.toIso8601(jdate); });
//     }
//     var result = new Array(sortedJulianDateOrValueArrays.length);
//     for (var i = 0; i < result.length; i++) {
//         result[i] = [sortedJulianDateOrValueArrays[i][0]];
//     }
//     for (var j = 1; j < sortedJulianDateOrValueArrays[0].length; j++) {
//         if (sortedJulianDateOrValueArrays[0][j] === sortedJulianDateOrValueArrays[0][j - 1]) {
//             var currentIndex = result[0].length - 1;
//             for (i = 0; i < result.length; i++) {
//                 if (result[i][currentIndex] === undefined) {
//                     result[i][currentIndex] = sortedJulianDateOrValueArrays[i][j];
//                 }
//             }
//         } else {
//             for (i = 0; i < result.length; i++) {
//                 result[i].push(sortedJulianDateOrValueArrays[i][j]);
//             }
//         }
//     }
//     return result;
// }

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
*                 Eg. "isoDateTime" or "dd mmm yyyy HH:MM:ss"
* @returns {Object} An array of rows of formatted data, the first of which is the column names.
*/
TableStructure.prototype.toArrayOfRows = function(dateFormatString) {
    if (this.columns.length < 1) {
        return;
    }
    var that = this;
    var rows = that.columns[0].values.map(function(value0, rowIndex) {
        return that.columns.map(function(column) {
            if (dateFormatString && column.type === VarType.TIME) {
                return dateFormat(column.dates[rowIndex], dateFormatString);
            }
            return column._formattedValues[rowIndex];
        });
    });
    rows.unshift(that.getColumnNames());
    return rows;
};

/**
* Return data as a string in csv format, with newlines represented by \n.
* @param {String} [dateFormatString] If present, override the standard date format with a string (see https://www.npmjs.com/package/dateformat)
*                 Eg. "isoDateTime" or "dd mmm yyyy HH:MM:ss"
* @returns {String} csv formatted version of the data.
*/
TableStructure.prototype.toCsvString = function(dateFormatString) {
    var arraysOfRows = this.toArrayOfRows(dateFormatString);
    var joinedRows = arraysOfRows.map(function(row) { return row.join(','); });
    return joinedRows.join('\n');
};

/**
* Return data as an array of rows of objects, eg. [{'x': 1, 'y': 10}, {'x': 2, 'y': 20}, ...].
* Note this won't work if a column name is a javascript reserved word.
*
* @returns {Object[]} Array of objects containing a property for each column of the row. If the table has no data, returns [].
*/
TableStructure.prototype.toRowObjects = function() {
    var asRows = this.toArrayOfRows();
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
 * Provide an array which maps ids to names, if they differ.
 * @return {Object[]} An array of objects with 'id' and 'name' properties; only where the id and name differ.
 */
TableStructure.prototype.getColumnAliases = function() {
    return this.columns
        .filter(function(column) { return column.id !== column.name; })
        .map(function(column) { return {id: column.id, name: column.name}; });
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
                if (key.substring(0, 2) === '__') {
                    continue;
                }
                html += '<tr><td>' + infoFields[key] + '</td><td>' + value + '</td></tr>';
            }
        }
    }
    html += '</table>';
    return html;
}

/**
 * Returns data as an array of html for each row.
 * @param  {Array|Object} [featureInfoFields] Either an array of keys from the row objects, or an object that maps keys to names of keys.
 *         If not provided, defaults to using all keys unaltered.
 * @return {String[]} Array of html for each row.
 */
TableStructure.prototype.toRowDescriptions = function(featureInfoFields) {
    var infoFields = defined(featureInfoFields) ? featureInfoFields : this.getColumnNames();
    if (infoFields instanceof Array) {
        // Allow [ "FIELD1", "FIELD2" ] as a shorthand for { "FIELD1": "FIELD1", "FIELD2": "FIELD2" }
        var o = {};
        infoFields.forEach(function(key) {
            o[key] = key;
        });
        infoFields = o;
    }
    var that = this;
    return this.toRowObjects().map(function(rowObject, index) { return describeRow(that, rowObject, index, infoFields); });
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
    var xColumnValues = (xColumn.type === VarType.TIME ? xColumn.dates : xColumn.values);
    if (!defined(yColumns)) {
        yColumns = this.columns.filter(column=>(column !== xColumn));
    }
    var getXYFunction = function(j) {
        return (x, index)=>{ return {x: x, y: yColumns[j].values[index]}; };
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
* @returns {TableColumn} The matching column.
*/
TableStructure.prototype.getColumnWithName = function(name) {
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i].name === name) {
            return this.columns[i];
        }
    }
};

/**
* Returns the first column with the given name or id, or undefined if none match.
*
* @param {String} nameOrId The column name or id.
* @returns {TableColumn} The matching column.
*/
TableStructure.prototype.getColumnWithNameOrId = function(nameOrId) {
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i].name === nameOrId || this.columns[i].id === nameOrId) {
            return this.columns[i];
        }
    }
};

/**
* Returns the first column with the given name, id or index, or undefined if none match (or null is passed in).
*
* @param {String|Integer|null} nameIdOrIndex The column name, id or index.
* @returns {TableColumn} The matching column.
*/
TableStructure.prototype.getColumnWithNameIdOrIndex = function(nameIdOrIndex) {
    if (nameIdOrIndex === null) {
        return undefined;
    }
    if (isInteger(nameIdOrIndex)) {
        return this.columns[nameIdOrIndex];
    }
    return this.getColumnWithNameOrId(nameIdOrIndex);
};


/**
 * Destroy the object and release resources. Is this necessary?
 */
TableStructure.prototype.destroy = function() {
    return destroyObject(this);
};

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
    var columnsWithTheSameLength = columns.slice(1).filter(function(column) { return column.values.length === firstLength; });
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
            var v = VarType[varType];  // we don't want the keys to be LAT, LON, ..., but 0, 1, ...
            columnsByType[v] = [];
        }
    }
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        columnsByType[column.type].push(column);
    }
    return columnsByType;
}

function isInteger(value) {
    return (!isNaN(value)) && (parseInt(Number(value), 10) === +value) && (!isNaN(parseInt(value, 10)));
}

function isString(param) {
    return (typeof param === 'string' || param instanceof String);
}

module.exports = TableStructure;

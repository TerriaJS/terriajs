/*global require*/
'use strict';

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var csv = require('../ThirdParty/csv');
var DisplayVariablesConcept = require('../Models/DisplayVariablesConcept');
var formatPropertyValue = require('../Core/formatPropertyValue');
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
 * @param {Number} [options.displayDuration] Passed to TableColumn.
 * @param {String[]} [options.replaceWithNullValues] Passed to TableColumn.
 * @param {String[]} [options.replaceWithZeroValues] Passed to TableColumn.
 * @param {Function} [options.getColorCallback] Passed to DisplayVariableConcept.
 */
var TableStructure = function(name, options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    DisplayVariablesConcept.call(this, name, options.getColorCallback);

    this.displayVariableTypes = defaultValue(options.displayVariableTypes, defaultDisplayVariableTypes);
    this.unallowedTypes = options.unallowedTypes;
    this.displayDuration = options.displayDuration;
    this.replaceWithNullValues = options.replaceWithNullValues;
    this.replaceWithZeroValues = options.replaceWithZeroValues;

    /**
     * Gets or sets the active time column for this structure,
     * @memberOf TableStructure.prototype
     * @type {TableColumn}
     */
    this.activeTimeColumn = undefined;

    this._rows = undefined;  // Store a copy by rows too, to simplify row-based operations.

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
                this._rows = buildRowsFromColumns(this, value);
                this.items = value;
            } else {
                var msg = 'Badly formed data table - columns have different lengths.';
                console.log(msg);
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
    // build up the columns (=== items) and then replace them all in one go, so that knockout's tracking doesn't see every change
    var columns = [];
    result._rows = json;
    var columnNames = json[0];
    var rowNumber, name, values;
    for (var columnNumber = 0; columnNumber < columnNames.length; columnNumber++) {
        name = columnNames[columnNumber] ? columnNames[columnNumber].trim() : "_Column" + String(columnNumber);
        values = [];
        for (rowNumber = 1; rowNumber < json.length; rowNumber++) {
            values.push(json[rowNumber][columnNumber]);
        }
        columns.push(new TableColumn(name, values, {
            tableStructure: result,
            displayVariableTypes: result.displayVariableTypes,
            unallowedTypes: result.unallowedTypes,
            displayDuration: result.displayDuration,
            replaceWithNullValues: result.replaceWithNullValues,
            replaceWithZeroValues: result.replaceWithZeroValues
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
        var integer = parseInt(value);
        if (isNaN(integer)) {
            return null;
        }
        return integer;
    }

    //normalize line breaks
    csvString = csvString.replace(/\r\n|\r|\n/g, "\r\n");
    // Handle CSVs missing a final linefeed
    if (csvString[csvString.length - 1] !== '\n') {
        csvString += '\r\n';
    }
    var json = csv.toArrays(csvString, {
        onParseValue: castToScalar
    });
    // Remove extra blank lines at the end.
    var n = 0;
    for (var i = json.length - 1; i >= 0; i--) {
        if (json[i].length === 1 && json[i][0] === null) {
            n += 1;
        }
    }
    json.splice(json.length - n, n);
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
* Return data as an array of rows, eg. [ ['x', 'y'], [1, 10], [2, 20], [3, 5] ].
* @returns {Object} An array of rows, the first of which is the column names.
*/
TableStructure.prototype.toArrayOfRows = function() {
    return this._rows;
};

/**
* Return data as a string in csv format, with newlines represented by \n.
* @returns {String} csv formatted version of the data.
*/
TableStructure.prototype.toCsvString = function() {
    var table = this.getJsonTable();
    //Serialize the arrays
    var joinedRows = table.map(function(arr) {
        return arr.join(',');
    });
    var tableText = joinedRows.join('\n');
    return tableText;
};

/**
* Return data as an array of rows of objects, eg. [{'x': 1, 'y': 10}, {'x': 2, 'y': 20}, ...].
* Note this won't work if a column name is a javascript reserved word.
*
* @returns {Object[]} Array of objects containing a property for each column of the row.
*/
TableStructure.prototype.toRowObjects = function() {
    var asRows = this.toArrayOfRows();
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


function describeRow(tableStructure, rowObject, index, infoFields) {
    var html = '<table class="cesium-infoBox-defaultTable">';
    var columnNames = tableStructure.getColumnNames();
    for (var key in infoFields) {
        if (infoFields.hasOwnProperty(key)) {
            var value = rowObject[key];
            if (defined(value)) {
                var columnType;
                if (columnNames.indexOf(key) >= 0) {
                    columnType = tableStructure.columns[columnNames.indexOf(key)].type;
                }
                // Skip keys starting with double underscore
                if (key.substring(0, 2) === '__') {
                    continue;
                } else if (columnType === VarType.TIME) {
                    // If the original string contains a "T", then it is ISO8601 format, and we can format it more nicely.
                    if ((typeof value === 'string' || value instanceof String) && value.indexOf('T') >= 0) {
                        var time = value.split('T')[1];
                        value = tableStructure.columns[columnNames.indexOf(key)].dates[index];
                        // value is now a javascript Date, which will display as eg. Thu Jan 28 2016 15:22:37 GMT+1100 (AEDT).
                        // If there was no timezone info in the original, remove the timezone info from the output string.
                        if (!((time.indexOf('+') >= 0) || (time.indexOf('-') >= 0) || (time.indexOf('Z') >= 0))) {
                            value = value.toDateString() + ' ' + value.toTimeString().split(' ')[0];
                        }
                    }
                } else if (value === null) {
                    value = '';
                } else if (typeof value === 'object') {  // Can this happen?
                    value = describeRow(tableStructure, value, index, infoFields);
                } else {
                    value = formatPropertyValue(value);
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
TableStructure.prototype.toXYArrays = function(xColumn, yColumns) {
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
}

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
* Returns the first column with the given name or index, or undefined if none match (or null is passed in).
*
* @param {String|Integer|null} nameOrIndex The column name or index.
* @returns {TableColumn} The matching column.
*/
TableStructure.prototype.getColumnWithNameOrIndex = function(nameOrIndex) {
    if (nameOrIndex === null) {
        return undefined;
    }
    if (isInteger(nameOrIndex)) {
        return this.columns[nameOrIndex];
    }
    return this.getColumnWithName(nameOrIndex);
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
 *
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
 * Normally a TableStructure is generated from a csvString, using loadFromCsv, or via loadFromJson.
 * However, if its columns are set directly, we need to manually build tableStructure._rows,
 * so that several of its methods work correctly.
 *
 * @param  {TableStructure} tableStructure This TableStructure instance.
 * @param  {Concept[]} columns Array of columns.
 * @return {Array[]} Array of rows values, starting with the column names.
 */
function buildRowsFromColumns(tableStructure, columns) {
    if (columns.length === 0) {
        return {};
    }
    var columnNames = columns.map(function(column) { return column.name; });
    var data = columns[0].values.map(function(value, rowIndex) {
        return columns.map(function(column) { return column.values[rowIndex]; });
    });
    data.unshift(columnNames);  // Put column names in the first row.
    return data;
}

/**
 * Given columns, returns columnsByType, which is an object whose keys are elements of VarType,
 * and whose values are arrays of TableColumn objects of that type.
 * All types are present (eg. structure.columnsByType[VarType.ALT] always exists), possibly [].
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
    return (!isNaN(value)) && (parseInt(Number(value)) === +value) && (!isNaN(parseInt(value)));
}

module.exports = TableStructure;


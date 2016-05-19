/*global require*/
"use strict";

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
 *                 and per-column properties displayDuration, replaceWithNullValues, replaceWithZeroValues, name, and type.
 *                 Converts strings, which are case-insensitive keys of VarType, to their VarType integer.
 */
var TableStructure = function(name, options) {
    DisplayVariablesConcept.call(this, name);
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.displayVariableTypes = defaultValue(options.displayVariableTypes, defaultDisplayVariableTypes);
    this.unallowedTypes = options.unallowedTypes;
    this.displayDuration = options.displayDuration;
    this.replaceWithNullValues = options.replaceWithNullValues;
    this.replaceWithZeroValues = options.replaceWithZeroValues;
    this.columnOptions = options.columnOptions;

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
        var columnOptions = defaultValue.EMPTY_OBJECT;
        if (defined(result.columnOptions)) {
            columnOptions = defaultValue(result.columnOptions[name], defaultValue(result.columnOptions[columnNumber], defaultValue.EMPTY_OBJECT));
        }
        var niceName = defaultValue(columnOptions.name, name);
        var type = getVarTypeFromString(columnOptions.type);
        var format = defaultValue(columnOptions.format, format);
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
            format: format
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
    csvString = csvString.replace(/\r\n|\r|\n/g, "\r\n");
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
* @returns {Object} An array of rows of formatted data, the first of which is the column names.
*/
TableStructure.prototype.toArrayOfRows = function() {
    if (this.columns.length < 1) {
        return;
    }
    var that = this;
    var rows = that.columns[0].values.map(function(value0, rowIndex) {
        return that.columns.map(function(column) {
            return column._formattedValues[rowIndex];
        });
    });
    rows.unshift(that.getColumnNames());
    return rows;
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
 * Normally a TableStructure is generated from a csvString, using loadFromCsv, or via loadFromJson.
 * However, if its columns are set directly, we need to manually build tableStructure._rows,
 * so that several of its methods work correctly.
 * @private
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

module.exports = TableStructure;

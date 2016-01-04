/*global require*/
"use strict";

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');

var csv = require('../ThirdParty/csv');
var DisplayVariablesConcept = require('../Models/DisplayVariablesConcept');
var inherit = require('../Core/inherit');
var TableColumn = require('./TableColumn');
var VarType = require('../Map/VarType');

var defaultDisplayVariableTypes = [VarType.ENUM, VarType.SCALAR];

/**
 * TableStructure provides an abstraction of a data table, ie. a structure with rows and columns.
 * Its primary responsibility is to load and parse the data, from csvs or other.
 * It stores each column as a TableColumn.
 * These are also sorted by type for easier access.
 *
 * @alias TableStructure
 * @constructor
 * @extends {DisplayVariablesConcept}
 * @param {String} [name] Name to use in the NowViewing tab, defaults to 'Display Variable'.
 * @param {Array} [displayVariableTypes] Which variable types to show in the NowViewing tab. Defaults to ENUM and SCALAR only.
 */
var TableStructure = function(name, displayVariableTypes) {
    DisplayVariablesConcept.call(this, name);

    this.displayVariableTypes = defaultValue(displayVariableTypes, defaultDisplayVariableTypes);
    this._columnsByType = undefined;
    this._rows = undefined;  // Store a copy by rows too, to simplify row-based operations.
};
inherit(DisplayVariablesConcept, TableStructure);

defineProperties(TableStructure.prototype, {
    /**
     * Gets the columns for this structure.
     * @memberOf TableStructure.prototype
     * @type {TableColumn[]}
     */
    columns : {
        get : function() {
            return this.items;
        }
    },
    /**
     * Gets the columnsByType for this structure,
     * an object whose keys are VarTypes, and whose values are arrays of TableColumn with matching type.
     * Only existing types are present (eg. columnsByType[VarType.ALT] may be undefined).
     * @memberOf TableStructure.prototype
     * @type {Object}
     */
    columnsByType : {
        get : function() {
            return this._columnsByType;
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
            displayVariableTypes: result.displayVariableTypes
        }));
    }
    // set columnsByType first, so that once columns changes (which is tracked by knockout), the whole structure is available.
    result._columnsByType = getColumnsByType(columns);
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
 * Destroy the object and release resources.
 */
TableStructure.prototype.destroy = function() {
    return destroyObject(this);
};

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

module.exports = TableStructure;


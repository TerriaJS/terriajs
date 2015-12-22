/*global require*/
"use strict";

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');

var csv = require('../ThirdParty/csv');
var TableColumn = require('./TableColumn');

/**
 * TableStructure provides an abstraction of a data table, ie. a structure with rows and columns.
 * Its primary responsibility is to load and parse the data, from csvs or other.
 * It stores each column as a TableColumn.
 * These are also sorted by type for easier access.
 *
 * @alias TableStructure
 * @constructor
 */
var TableStructure = function() {
    this.columns = [];
    this._columnsByType = undefined;
};

defineProperties(TableStructure.prototype, {
    /**
     * Gets the columnsByType for this structure,
     * an object whose keys are VarTypes, and whose values are arrays of columns with that type.
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
* @param {Object} json Table data in JSON format
*/
TableStructure.fromJson = function(json, result) {
    if (!defined(json) || json.length === 0 || json[0].length === 0) {
        return;
    }
    if (!defined(result)) {
        result = new TableStructure();
    }
    var columnNames = json[0];
    var rowNumber, name, values;
    for (var columnNumber = 0; columnNumber < columnNames.length; columnNumber++) {
        name = columnNames[columnNumber] ? columnNames[columnNumber].trim() : "_Column" + String(columnNumber);
        values = [];
        for (rowNumber = 1; rowNumber < json.length; rowNumber++) {
            values.push(json[rowNumber][columnNumber]);
        }
        result.columns.push(new TableColumn(name, values));
    }
    setColumnsByType(result);
    return result;
};

/**
* Create a TableStructure from a string in csv format.
* Understands \r\n, \r and \n as newlines.
*
* @param {String} text String in csv format.
*/
TableStructure.fromCsv = function(text, result) {

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
    text = text.replace(/\r\n|\r|\n/g, "\r\n");
    // Handle CSVs missing a final linefeed
    if (text[text.length - 1] !== '\n') {
        text += '\r\n';
    }
    var json = csv.toArrays(text, {
        onParseValue: castToScalar
    });
    return TableStructure.fromJson(json, result);
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

// zip([1, 2, 3], ['a', 'b', 'c']) = [[1, 'a'], [2, 'b'], [3, 'c']], and vice versa.
// This simple implementation assumes the arrays have the same length.
// Actually: silently ignores extra elements in arrays beyond the first, and fails if later arrays are shorter.
function zip() {
    var args = [].slice.call(arguments);
    return args[0].map(function(d, i) {
        return args.map(function(array) {
            return array[i];
        });
    });
}

/**
* Return data as an array of rows, eg. [ ['x', 'y'], [1, 10], [2, 20], [3, 5] ].
* @returns {Object} An array of rows, the first of which is the column names.
*/
TableStructure.prototype.toArrayOfRows = function() {
    var arrayOfColumns = this.toArrayOfColumns();
    return zip(arrayOfColumns);
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
 * Destroy the object and release resources.
 */
TableStructure.prototype.destroy = function () {
    return destroyObject(this);
};

// sets the columnsByType object
function setColumnsByType(structure) {
    structure._columnsByType = {};
    for (var i = 0; i < structure.columns.length; i++) {
        var column = structure.columns[i];
        var columnsOfThisType = structure._columnsByType[column.type];
        if (defined(columnsOfThisType)) {
            columnsOfThisType.push(column);
        } else {
            columnsOfThisType = [column];
        }
    }
}

module.exports = TableStructure;


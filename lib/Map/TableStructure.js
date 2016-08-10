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
 *                 and per-column properties displayDuration, replaceWithNullValues, replaceWithZeroValues, name, active, units and/or type.
 *                 For type, converts strings, which are case-insensitive keys of VarType, to their VarType integer.
 * @param {Function} [options.getColorCallback] Passed to DisplayVariableConcept.
 * @param {Entity} [options.sourceFeature] The feature to which this table applies, if any; not used internally by TableStructure or TableColumn.
 * @param {Array} [options.idColumnNames] An array of column names/indexes/ids which identify unique features across rows
 *                (see CsvCatalogItem.idColumns).
 * @param {Boolean} [options.isSampled] Does this data correspond to "sampled" data?
 *                See CsvCatalogItem.isSampled for an explanation.
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
    this.idColumnNames = options.idColumnNames;  // Actually names, ids or indexes.
    this.isSampled = options.isSampled;

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
            format: columnOptions.format,
            active: columnOptions.active
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
    return this.columns.filter(function(column) { return column.isActive; });
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
* @param {Integer[]} [rowNumbers] An array of row numbers to return. Defaults to all rows.
* @returns {Object} An array of rows of formatted data, the first of which is the column names.
*/
TableStructure.prototype.toArrayOfRows = function(dateFormatString, rowNumbers) {
    if (this.columns.length < 1) {
        return;
    }
    var that = this;
    function getRow(rowNumber) {
        return that.columns.map(column => {
            if (dateFormatString && column.type === VarType.TIME) {
                return dateFormat(column.dates[rowNumber], dateFormatString);
            }
            return column._formattedValues[rowNumber];
        });
    }
    var rows;
    if (defined(rowNumbers)) {
        rows = rowNumbers.map(getRow);
    } else {
        rows = that.columns[0].values.map((_, rowNumber) => getRow(rowNumber));
    }
    rows.unshift(that.getColumnNames());
    return rows;
};

/**
* Return data as a csv string with formatted values, eg. 'x,y\n1,"12,345"\n2.1,20'.
* @param {String} [dateFormatString] If present, override the standard date format with a string (see https://www.npmjs.com/package/dateformat)
*                 Eg. "isoDateTime" or "dd mmm yyyy HH:MM:ss"
* @param {Integer[]} [rowNumbers] An array of row numbers to return. Defaults to all rows.
* @returns {String} Returns the data as a csv string, including the header row.
*/
TableStructure.prototype.toCsvString = function(dateFormatString, rowNumbers) {
    var arraysOfRows = this.toArrayOfRows(dateFormatString, rowNumbers);
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

// idColumnNames are an optional override of tableStructure.idColumnNames.
function getIdColumns(tableStructure, idColumnNames) {
    if (!defined(idColumnNames)) {
        idColumnNames = tableStructure.idColumnNames;
    }
    if (!defined(idColumnNames)) {
        return [];
    }
    return idColumnNames.map(function(name) { return tableStructure.getColumnWithNameIdOrIndex(name); });
}

function getIdStringForRowNumber(idColumns, rowNumber) {
    return idColumns.map(function(column) {
        return column.values[rowNumber];
    }).join('^^');
}

/**
 * Returns an id string for the given row, based on idColumnNames.
 * @return {Object} [description]
 */
TableStructure.prototype.getIdStringForRowNumber = function(rowNumber) {
    return getIdStringForRowNumber(getIdColumns(this), rowNumber);
};


/**
 * Returns a mapping from the idColumnNames to all the rows in the table with that id.
 * If no columnIdNames are defined, returns undefined.
 * @param {Array} [idColumnNames] Provide if you wish to override this table's own idColumnNames.
 * @return {Object} An object with keys equal to idStrings (use tableStructure.getIdStringForRowNumber(i) to get this)
 *         and values equal to an array of rowNumbers.
 */
TableStructure.prototype.getIdMapping = function(idColumnNames) {
    var idColumns = getIdColumns(this, idColumnNames);
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
        throw new DeveloperError('Cannot add tables with different numbers of columns.');
    }
    var updatedColumnValuesArrays = [];
    function mapRowNumberToValue(valuesToAdd) {
        return rowNumber => valuesToAdd[rowNumber];
    }
    for (var columnNumber = 0; columnNumber < table2.columns.length; columnNumber++) {
        var valuesToAdd;
        if (defined(rowNumbers)) {
            valuesToAdd = rowNumbers.map(mapRowNumberToValue(table2.columns[columnNumber].values));
            // Could also do: valuesToAdd = valuesToAdd.filter((_, rowNumber) => rowNumbers.indexOf(rowNumber) >= 0);
        } else {
            valuesToAdd = table2.columns[columnNumber].values;
        }
        updatedColumnValuesArrays.push(this.columns[columnNumber].values.concat(valuesToAdd));
    }
    var updatedColumns = this.columns.reduce((updatedColumns, column, columnNumber) => {
        updatedColumns.push(new TableColumn(column.name, updatedColumnValuesArrays[columnNumber], column.getFullOptions()));
        return updatedColumns;
    }, []);
    // activeTimeColumn is not tracked, but columns are, so change activeTimeColumn first.
    this.activeTimeColumn = getColumnWithSameId(this.activeTimeColumn, updatedColumns);
    this.columns = updatedColumns;
};

/**
 * Replace specific rows in this table with rows in table2.
 * Changes all the columns in one go, to avoid partial updates from tracked values.
 * @param {TableStructure} table2 The table whose rows should replace this table's rows.
 * @param {Object} replacementMap An object whose properties are {table 1 row number: table 2 row number}.
 */
TableStructure.prototype.replaceRows = function(table2, replacementMap) {
    var updatedColumnValuesArrays = [];
    for (var columnNumber = 0; columnNumber < table2.columns.length; columnNumber++) {
        updatedColumnValuesArrays.push(this.columns[columnNumber].values);
        for (var table1RowNumber in replacementMap) {
            if (replacementMap.hasOwnProperty(table1RowNumber)) {
                var table2RowNumber = replacementMap[table1RowNumber];
                updatedColumnValuesArrays[columnNumber][table1RowNumber] = table2.columns[columnNumber].values[table2RowNumber];
            }
        }
    }
    var updatedColumns = this.columns.map((column, columnNumber) =>
        new TableColumn(column.name, updatedColumnValuesArrays[columnNumber], column.getFullOptions())
    );
    this.columns = updatedColumns;
};

function getColumnWithSameId(column1, columns) {
    if (defined(column1)) {
        var matchingColumns = columns.filter(column => column.id === column1.id);
        if (matchingColumns.length !== 1) {
            throw new DeveloperError('Ambiguous column: ' + column1.name);
        }
        return matchingColumns[0];
    }
}

/**
 * Merges table2 into this table.
 * Uses this.idColumnNames (and this.activeTimeColumn, if present) to identify matching rows.
 * Changes all the columns in one go, to avoid partial updates from tracked values.
 * @param  {TableStructure} table2 The table to merge into this one.
 */
TableStructure.prototype.merge = function(table2) {
    if (!defined(this.idColumnNames)) {
        throw new DeveloperError('Cannot merge tables without id columns.');
    }
    if (this.columns.length !== table2.columns.length) {
        throw new DeveloperError('Cannot merge tables with different numbers of columns.');
    }
    var table1RowNumbersMap = this.getIdMapping();
    var table2RowNumbersMap = table2.getIdMapping(this.idColumnNames);
    var rowsFromTable2ToAppend = [];  // An array of row numbers.
    var rowsToReplace = {};  // Properties are {table 1 row number: table 2 row number}.
    var table2ActiveTimeColumn = getColumnWithSameId(this.activeTimeColumn, table2.columns);
    for (var featureIdString in table2RowNumbersMap) {
        if (table2RowNumbersMap.hasOwnProperty(featureIdString)) {
            var table2RowNumbersForThisFeature = table2RowNumbersMap[featureIdString];
            var table1RowNumbersForThisFeature = table1RowNumbersMap[featureIdString];
            if (!defined(table1RowNumbersForThisFeature)) {
                // This feature appears in table 2, but not in table 1.
                // Add all these rows to table 1.
                rowsFromTable2ToAppend = rowsFromTable2ToAppend.concat(table2RowNumbersForThisFeature);
            } else if (!this.activeTimeColumn) {
                // The feature is in both tables, and there is no time column, so just replace table 1's.
                rowsToReplace[table1RowNumbersForThisFeature[0]] = table2RowNumbersForThisFeature[0];
            } else {
                for (var i = 0; i < table2RowNumbersForThisFeature.length; i++) {
                    var table2RowNumber = table2RowNumbersForThisFeature[i];
                    // Is there a row with this feature and this datetime already?
                    var table1Dates = table1RowNumbersForThisFeature.map(rowNumber => this.activeTimeColumn.dates[rowNumber].toString());
                    var table1DatesIndex = table1Dates.indexOf(table2ActiveTimeColumn.dates[table2RowNumber].toString());
                    if (table1DatesIndex >= 0) {
                        // Yes, so replace it. (Noting table1DatesIndex is an index into table1RowNumbersForThisFeature.)
                        rowsToReplace[table1RowNumbersForThisFeature[table1DatesIndex]] = table2RowNumber;
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

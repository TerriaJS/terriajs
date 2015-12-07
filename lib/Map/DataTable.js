/*global require*/
"use strict";

var csv = require('../ThirdParty/csv');
var VarType = require('./VarType');
var DataVariable = require('./DataVariable');

var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

/*!
 * Copyright(c) 2012-2013 National ICT Australia Limited (NICTA).  All rights reserved.
 */

/**
* DataTable is a container for table based datasets
*
* @alias DataTable
* @internalConstructor
* @constructor
*/
var DataTable = function(options) {
    this.variables = {};  // variables[name] is a DataVariable
    this.selected = {};   // selected is an object with lat, lon, alt, time, region and data(=varName) properties
    this.noData = undefined;

    this._disambigVariable = undefined;
};

/**
* Determine if dataset has location data
*
* @returns {Boolean} True if a lat and lon variables are set
*/
DataTable.prototype.hasLocationData = function () {
    return (defined(this.selected.lon) && defined(this.selected.lat));
};

/**
* Determine if dataset has time data
*
* @returns {Boolean} True if a time variable is set
*/
DataTable.prototype.hasTimeData = function () {
    return (defined(this.selected.time));
};

/**
* Return the geographic extent of the dataset
*
* @returns {Object} The extent of the data points
*/
DataTable.prototype.getExtent = function () {
    var lonVar = this.variables[this.selected.lon];
    var latVar = this.variables[this.selected.lat];
    if (defined(lonVar) && defined(latVar)) {
        return Rectangle.fromDegrees(lonVar.minVal, latVar.minVal, lonVar.maxVal, latVar.maxVal);
    }
};

/**
* Return the minimum time
*
* @returns {Object} The minimum time value in Cesium JulianTime
*/
DataTable.prototype.getTimeMinValue = function () {
    if (defined(this.selected.time)) {
        return this.variables[this.selected.time].timeVar.minVal;
    }
};

/**
* Return the maximum time
*
* @returns {Object} The maximum time value in Cesium JulianTime
*/
DataTable.prototype.getTimeMaxValue = function () {
    if (defined(this.selected.time)) {
        return this.variables[this.selected.time].timeVar.maxVal;
    }
};

/**
* Return the minimum value a data variable.  If none is set the current
*   selected data variable minimum value is returned.
*
* @param {String} varName The name of the variable (optional)
*
* @returns {Float} The minimum data value
*/
DataTable.prototype.getDataMinValue = function (varName) {
    var name = varName || this.selected.data;
    if (defined(name)) {
        return this.variables[name].minVal;
    }
};

/**
* Return the maximum value a data variable.  If none is set the current
*   selected data variable maximum value is returned.
*
* @param {String} varName The name of the variable (optional)
*
* @returns {Float} The maximum data value
*/
DataTable.prototype.getDataMaxValue = function (varName) {
    var name = varName || this.selected.data;
    if (defined(name)) {
        return this.variables[name].maxVal;
    }
};

/**
* Return the number of rows in the dataset
*
* @returns {Integer}
*/
DataTable.prototype.getRowCount = function () {
    if (Object.keys(this.variables).length > 0) {
        return this.variables[Object.keys(this.variables)[0]].vals.length;
    }
    return 0;
};

/**
* Get a list of variables
*
* @returns {Array} An array of variables
*/
DataTable.prototype.getVariableNames = function () {
    var ret = [];
    for (var v in this.variables) {
        if (this.variables.hasOwnProperty(v)) {
            ret.push(v);
        }
    }
    return ret;
};

/**
* Get variable list by type
*
* @param {Integer|Array} varType a vartype id or array of vartypes
*
* @returns {Array} An array of variables
*/
DataTable.prototype.getVariableNamesByType = function (varType) {
    var ret = [];
    for (var v in this.variables) {
        if (this.variables.hasOwnProperty(v)) {
            if (varType instanceof Array) {
                if (varType.indexOf(this.variables[v].varType) !== -1) {
                    ret.push(v);
                }
            }
            else if ((this.variables[v].varType === varType)) {
                ret.push(v);
            }
        }
    }
    return ret;
};


/**
* Get a list of options for the data variable
* @param includeEnums{Boolean}: whether to include ENUM types or not.
*
* @returns {Array} a list of scalar variables in the table
*/
DataTable.prototype.getDataVariableList = function (includeEnums) {
    var vts = (includeEnums? [ VarType.SCALAR, VarType.ENUM ] : VarType.SCALAR);
    return this.getVariableNamesByType(vts);
};

/**
* Load a JSON object into a dataset
*
* @param {Object} jsonTable Table data in JSON format.
*/
DataTable.prototype.loadJson = function (jsonTable) {

    if (!defined(jsonTable) || jsonTable.length === 0 || jsonTable[0].length === 0) {
        return;
    }

    //create the variable set
    this.variables = {};
    var columnNames = jsonTable[0];
    for (var c = 0; c < columnNames.length; c++) {
        var name = columnNames[c] ? columnNames[c].trim() : "_Column" + String(c) ;
        var values = [];
        for (var i = 1; i < jsonTable.length; ++i) {
            values.push(jsonTable[i][c]);
        }
        this.variables[name] = new DataVariable(name, values);
    }


    //set default active variables
    this.selected = {};
    this.selected.lat = this.getVariableNamesByType(VarType.LAT)[0];
    this.selected.lon = this.getVariableNamesByType(VarType.LON)[0];
    this.selected.alt = this.getVariableNamesByType(VarType.ALT)[0];
    this.selected.time = this.getVariableNamesByType(VarType.TIME)[0];
    this.selected.region = this.getVariableNamesByType(VarType.REGION)[0];
};

/**
* Load text into a dataset
*
* @param {String} text Text to load as dataset
*
*/
DataTable.prototype.loadText = function (text) {

// originally from jquery-csv plugin. modified to avoid stripping leading zeroes.
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
    if(isNaN(integer)) {
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
    var jsonTable = csv.toArrays(text, {
            onParseValue: castToScalar
        });
    this.loadJson(jsonTable);
};

/**
* Return data as json table
*
* @returns {Object} An array of rows which are each an array of values
*
*/
DataTable.prototype.getJsonTable = function () {
    var table = [];
    table.push(this.getVariableNames());
    for (var i = 0; i < this.getRowCount(); i++) {
        var row = [];
        for (var id in this.variables) {
            if (this.variables.hasOwnProperty(id)) {
                row.push(this.getDataValue(id, i));
            }
        }
        table.push(row);
    }
    return table;
};

/**
* Return data as csv table
*
* @returns {String} csv formatted version of the dataTable
*
*/
DataTable.prototype.getCsvTable = function () {
    var table = this.getJsonTable();
    //Serialize the arrays
    var joinedRows = table.map(function(arr) {
        return arr.join(',');
    });
    var tableText = joinedRows.join('\n');
    return tableText;
};

/**
* Set the current data variable
*
* @param {String} varName The name of the variable
*
*/
DataTable.prototype.setDataVariable = function (varName) {
    if (!defined(this.variables[varName])) {
        varName = undefined;
    }
    this.selected.data = varName;
};

/**
* Get the current variable name.
*
* @returns {String} The current variable name
*
*/
DataTable.prototype.getDataVariable = function () {
    return this.selected.data;
};

/**
* Get the name of the variable used for region mapping, if any.
*
* @returns {String}
*
*/

DataTable.prototype.getRegionVariable = function() {
    return this.selected.region;
};

/**
* Get the name of the variable used for disambiguating region mapping, if any.
*
* @returns {String}
*
*/
DataTable.prototype.getDisambigVariable = function() {
    return this._disambigVariable;
};

/**
* Get the RegionProvider associated with the region-mapping variable, if any.
*
* @returns {RegionProvider} regionProvider
*
*/
DataTable.prototype.getRegionProvider = function() {
    if (defined(this.selected.region)) {
        return this.variables[this.selected.region].getRegionProvider();
    } else {
        return undefined;
    }
};

/**
* Get a data value
*
* @param {String} varName The name of the variable
* @param {Integer} row Index in variable values
*
* @returns {Float} Value for the variable at that index
*/
DataTable.prototype.getDataValue = function (varName, row) {
    var variable = this.variables[varName];
    if (!defined(variable) || !defined(variable.vals)) {
        return undefined;
    }
    if (defined(variable.enumList)) {
        return variable.enumList[variable.vals[row]];
    }
    else if (variable.varType === VarType.TIME) {
        return variable.timeVar.vals[row];
    }
     return variable.vals[row];
};

/**
* Get a data row as object
*
* @param {Integer} row Index of row
* @returns {Object} Object containing all row members
*/
DataTable.prototype.getDataRow = function (row) {
    var rowObj = {};
    if (defined(row)) {
        for (var id in this.variables) {
            if (this.variables.hasOwnProperty(id)) {
                rowObj[id] = this.getDataValue(id, row);
            }
        }
    }
    return rowObj;
};

/**
* Get all of the data values
*
* @param {String} varName The name of the variable
* @returns {Array} Array of values for the variable
*/
DataTable.prototype.getVariableValues = function (varName) {
    if (!defined(this.variables[varName]) || !defined(this.variables[varName].vals)) {
        return undefined;
    }
    return this.variables[varName].vals;
};


/**
* Get all of the enum values
*
* @param {String} varName The name of the variable
* @returns {Array} Array of values for the variable
*/
DataTable.prototype.getVariableEnums = function (varName) {
    if (!defined(this.variables[varName]) || !defined(this.variables[varName].enumList)) {
        return undefined;
    }
    var vals = this.getVariableValues(varName);
    var enumVals = [];
    for (var i = 0; i < vals.length; i++) {
        enumVals.push(this.variables[varName].enumList[vals[i]]);
    }
    return enumVals;
};

/**
* Get all of the enum value codes for the variable
*
* @param {String} varName The name of the variable
* @returns {Array} Array of enum value codes for variable
*/
DataTable.prototype.getVariableEnumList = function (varName) {
    if (!defined(this.variables[varName]) || !defined(this.variables[varName].enumList)) {
        return undefined;
    }
    return this.variables[varName].enumList;
};

/**
* Return a boolean as to whether this is a nodata item
*
* @param {Float} ptVal The value to check
* @returns {Boolean} True if this is NoData
*/
DataTable.prototype.isNoData = function (ptVal) {
    function _float_equals(a, b) { return (Math.abs((a - b) / b) < 0.00001); }
    return ptVal === null || !defined(ptVal) || _float_equals(this.noData, ptVal);
};

/**
* Get a set of values, positions, and times for the current data variable
*
* @param {Integer} [maxPoints] The maximum number of points to return
* @returns {Array} An array of point objects based on the selected variables
*/
DataTable.prototype.getPointList = function (maxPoints) {
    var lon = defined(this.selected.lon) ? this.variables[this.selected.lon].vals : undefined;
    var lat = defined(this.selected.lat) ? this.variables[this.selected.lat].vals : undefined;
    var alt = defined(this.selected.alt) ? this.variables[this.selected.alt].vals : undefined;
    var time = defined(this.selected.time) ? this.variables[this.selected.time].timeVar.vals : undefined;
    var vals = defined(this.selected.data) ? this.variables[this.selected.data].vals : undefined;
    var length = defined(vals) ? vals.length : lon.length;
    if (!defined(maxPoints)) {
        maxPoints = length;
    }

    var ret = [];
    for (var i = 0; i < length && i < maxPoints; i++) {
        var rec = {val: defined(vals) ? vals[i] : 0};
        rec.time =  time ? time[i] : undefined;
        rec.pos = [lon ? lon[i] : 0.0, lat ? lat[i] : 0.0, alt ? alt[i] : 0.0];
        rec.row = i;
        if (this.isNoData(rec.pos[0]) || this.isNoData(rec.pos[1])) {
            continue;
        }
        ret.push(rec);
    }
    return ret;
};




/**
 * Check if there is a region variable, and identify it if so.
 *
 * @param {RegionProviderList} regionProviderList
 */
DataTable.prototype.checkForRegionVariable = function(regionProviderList) {
    var r = regionProviderList.chooseRegionProvider(this.getVariableNames());
    if (r && defined(r.regionProvider)) {
        this.variables[r.regionVariable].setRegionProvider(r.regionProvider);
        this.selected.region = r.regionVariable;
        this._disambigVariable = r.disambigVariable;
        return true;
    } else {
        this.selected.region = undefined;
        this._disambigVariable = undefined;
        return false;
    }
};

/**
 * Destroy the object and release resources
 */
DataTable.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = DataTable;


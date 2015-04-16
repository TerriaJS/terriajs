/*global require,$*/
"use strict";

var VarType = require('./VarType');
var DataVariable = require('./DataVariable');

var defined = require('../../third_party/cesium/Source/Core/defined');
var destroyObject = require('../../third_party/cesium/Source/Core/destroyObject');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

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
var DataTable = function() {
    this.variables = {};
    this.selected = {};
    this.noData = 1e-34;
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
* @returns {Integer} The maximum time value in Cesium JulianTime
*/
DataTable.prototype.getRowCount = function () {
    if (defined(this.selected.data)) {
        return this.variables[this.selected.data].vals.length;
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
        var name = columnNames[c].trim();
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
    this.selected.data = this.getVariableNamesByType([VarType.SCALAR,VarType.ENUM])[0];

    console.log(this);
};

/**
* Load text into a dataset
*
* @param {String} text Text to load as dataset
*
*/
DataTable.prototype.loadText = function (text) {
        //normalize line breaks
    text = text.replace(/\r\n|\r|\n/g, "\r\n");
    var jsonTable = $.csv.toArrays(text, {
            onParseValue: $.csv.hooks.castToScalar
        });
    this.loadJson(jsonTable);
};

/**
* Set the current data variable
*
* @param {String} varName The name of the variable
*
*/
DataTable.prototype.setDataVariable = function (varName) {
    if (!defined(this.variables[varName])) {
        return;
    }
    this.selected.data = varName;
};

/**
* Get the current variable name
*
* @returns {Object} varName The current variable name
*
*/
DataTable.prototype.getDataVariable = function () {
    return this.selected.data;
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
    if (variable.varType === VarType.ENUM) {
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
*
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
*
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
*
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
* Return a boolean as to whether this is a nodata item
*
* @param {Float} ptVal The value to check
*
* @returns {Boolean} True if this is NoData
*/
DataTable.prototype.isNoData = function (ptVal) {
    function _float_equals(a, b) { return (Math.abs((a - b) / b) < 0.00001); }
    return _float_equals(this.noData, ptVal);
};

/**
* Get a set of values, positions, and times for the current data variable
*
* @param {Integer} maxPoints The maximum number of points to return (optional)
*
* @returns {Array} An array of point objects based on the selected variables
*/
DataTable.prototype.getPointList = function (maxPoints) {
    if (!defined(this.variables[this.selected.data])) {
        return [];
    }

    var lon = defined(this.selected.lon) ? this.variables[this.selected.lon].vals : undefined;
    var lat = defined(this.selected.lat) ? this.variables[this.selected.lat].vals : undefined;
    var alt = defined(this.selected.alt) ? this.variables[this.selected.alt].vals : undefined;
    var time = this.selected.time ? this.variables[this.selected.time].timeVar.vals : undefined;
    var vals = this.variables[this.selected.data].vals;
    if (!defined(maxPoints)) {
        maxPoints = vals.length;
    }

    var ret = [];
    for (var i = 0; i < vals.length && i < maxPoints; i++) {
        var rec = {val: vals[i]};
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
* Destroy the object and release resources
*
*/
DataTable.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = DataTable;


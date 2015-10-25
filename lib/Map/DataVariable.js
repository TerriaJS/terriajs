/*global require*/
"use strict";

/*!
 * Copyright(c) 2012-2013 National ICT Australia Limited (NICTA).  All rights reserved.
 */

var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var VarType = require('./VarType');

/**
* @class DataVariable contains a single variable (or column) from a table dataset
* @name DataVariable
*
* @alias DataVariable
* @internalConstructor
* @constructor
*/
var DataVariable = function (name, values) {
    this.name = name;
    this.vals = values || [];
    this._varType = undefined;
    this.noData = undefined;
    this.minVal = undefined;
    this.maxVal = undefined;
    this.timeVar = undefined;
    this.enumList = undefined;
    this.regionProvider = undefined;
    this.regionCodes = undefined;
    this.rowsByRegionCode = undefined;
    this.regionUniqueIds = undefined;
    this.rowsByRegionUniqueId = undefined;

    if (this.vals.length > 0) {
        this.update();
    }
};

Object.defineProperties(DataVariable.prototype, {
    varType: {
        get: function() { return this._varType; },
        set: function(x) {
            this._varType = x;
            this.update();
        }
    }
});

/**
* Update the variable metadata based on the current set of values
*
*/
DataVariable.prototype.update = function () {

        //guess var type if not set
    if (!defined(this.varType)) {
        this._guessVariableType();
    }
        //process time thiss
    if (this.varType === VarType.TIME) {
        this._processTimeVariable();
        //if failed then default type to scalar
        if (!defined(this.timeVar)) {
            this.varType = VarType.SCALAR;
        }
    }
        //calculate var min/max
    if (this.varType !== VarType.TIME) {
        this._calculateVarMinMax();
    }
        //if min/max failed then handle as enumerated variable
    if (this.varType === VarType.SCALAR && this.minVal > this.maxVal) {
        this.varType = VarType.ENUM;
    }
    if (this.varType === VarType.ENUM && !defined(this.enumList)) {
        this._processEnumVariable();
    }
};


// Based on variable name, try to determine best default for varType
DataVariable.prototype._guessVariableType = function () {
    var hintSet = [
        { hint: /^(lon|longitude|lng)$/i, type: VarType.LON },
        { hint: /^(lat|latitude)$/i, type: VarType.LAT },
        { hint: /^(.*[_ ])?(depth|height|elevation)$/i, type: VarType.ALT },
        { hint: /^(.*[_ ])?(time|date)$/i, type: VarType.TIME },
        { hint: /^postcode|poa|(.*_code)$/i, type: VarType.ENUM }];

    for (var i in hintSet) {
        if (hintSet[i].hint.test(this.name)) {
            this.varType = hintSet[i].type;
            return;
        }
    }
    this.varType = VarType.SCALAR;
};

DataVariable.prototype._calculateVarMinMax = function () {
    var vals = this.vals;
    var minVal = Number.MAX_VALUE;
    var maxVal = -Number.MAX_VALUE;
    for (var i = 0; i < vals.length; i++) {
        if (defined(vals[i]) && vals[i] !== null) {
            if (minVal > vals[i]) {
                minVal = vals[i];
            }
            if (maxVal < vals[i]) {
                maxVal = vals[i];
            }
        }
    }
    this.minVal = minVal;
    this.maxVal = maxVal;
};

DataVariable.prototype._calculateTimeMinMax = function () {
    var vals = this.vals;
    var minVal = vals[0];
    var maxVal = vals[0];
    for (var i = 1; i < vals.length; i++) {
        if (JulianDate.greaterThan(minVal, vals[i])) {
            minVal = vals[i];
        }
        if (JulianDate.lessThan(maxVal, vals[i])) {
            maxVal = vals[i];
        }
    }
    this.minVal = minVal;
    this.maxVal = maxVal;
};

// Convert input time variable to Cesium Time variable
DataVariable.prototype._processTimeVariable = function () {
    if (this.varType !== VarType.TIME || this.vals.length === 0 || typeof this.vals[0] !== 'string') {
        return;
    }

    function swapDateFormat(v) {
        var part = v.split(/[/-]/);
        if (part.length === 3) {
            v = part[1] + '/' + part[0] + '/' + part[2];
        }
        return v;
    }

    //create new Cessium time variable to attach to the variable
    var timeVar = new DataVariable();
    var vals = this.vals;

    //simple check to try to guess date format
    var max = 0;
    vals.map( function (v) {
        max = Math.max(max, parseInt(v));
    });

    var parseFunc;
    if (max > 31) {  //iso format  yyyy-mm-dd
        parseFunc = function(v) { return JulianDate.fromIso8601(v); };
    }
    else if (max > 12) { //intl javascript format dd-mm-yyyy
        parseFunc = function(v) { return JulianDate.fromDate(new Date(swapDateFormat(v))); };
    }
    else {  //us javascript date format mm-dd-yyyy
        parseFunc = function(v) { return JulianDate.fromDate(new Date(v)); };
    }

    //parse the time values trying iso and javascript date parsing
    try {
        for (var i = 0; i < vals.length; i++) {
            timeVar.vals[i] = parseFunc(vals[i].toString());
        }
        timeVar._calculateTimeMinMax();
        this.timeVar = timeVar;
    }
    catch (err) {
        console.log('Unable to parse date', err);
    }
};


//Convert input enum variable to values and enumList
DataVariable.prototype._processEnumVariable = function () {
    if (this.varType !== VarType.ENUM) {
        return;
    }
    //create new enum list for the variable
    var enumList = [];
    var enumHash = {};
    for (var i = 0; i < this.vals.length; i++) {
        if (this.vals[i] === this.noData || this.vals[i] === null) {
            this.vals[i] = 'undefined';
        }
        var n = enumHash[this.vals[i]];
        if (!defined(n)) {
            n = enumList.length;
            enumList.push(String(this.vals[i]));
            enumHash[this.vals[i]] = n;
        }
        this.vals[i] = n;
    }
    this.enumList = enumList;
    this._calculateVarMinMax();
};

/** 
 * Returns the row indices that match a given value or enum value
 */
DataVariable.prototype.getIndicesForValue = function(val) {
    var indices = [];
    if (defined(this.enumList)) {
        val = this.enumList.indexOf(String(val));
        if (val < 0) {
            return indices;
        }
    }
    for (var i = 0; i < this.vals.length; i++) {
        if (this.vals[i] === val) {
            indices.push(i);
        }
    }
    return indices;
};

/**
* Destroy the object and release resources
*
*/
DataVariable.prototype.destroy = function () {
    return destroyObject(this);
};

DataVariable.prototype.setRegionProvider = function(regionProvider) {
    this.varType = VarType.REGION;
    this.regionProvider = regionProvider;
    this.regionCodes = [];
    this.rowsByRegionCode = {};
    this.regionUniqueIds = [];
    this.rowsByRegionUniqueId = {};
};

DataVariable.prototype.getRegionProvider = function() {
    if (this.varType !== VarType.REGION) {
        return undefined;
    }
    return this.regionProvider;
};

DataVariable.prototype.setRegionCode = function(row, code) {
    this.regionCodes[row] = code;
    this.rowsByRegionCode[code] = row;
};

DataVariable.prototype.setRegionUniqueId = function(row, uniqueId) {
    this.regionUniqueIds[row] = uniqueId;
    this.rowsByRegionUniqueId[uniqueId] = row;
};
/** 
 * Return the row corresponding to a given region code. This not redundant
 * if the match was made by regex - it's the only place the actual region identifier
 * is stored. 
 */

DataVariable.prototype.getRowByRegionCode = function(code) {
    return this.rowsByRegionCode[code];
};

DataVariable.prototype.getRowByRegionUniqueId = function(uniqueId) {
    return this.rowsByRegionUniqueId[uniqueId];
};


module.exports = DataVariable;




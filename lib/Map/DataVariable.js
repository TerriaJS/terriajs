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
    this.varType = undefined;
    this.noData = undefined;
    this.minVal = undefined;
    this.maxVal = undefined;
    this.timeVar = undefined;
    this.enumList = undefined;

    if (this.vals.length > 0) {
        this.update();
    }
};

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
        this._processEnumVariable();
    }
};


// Based on variable name, try to determine best default for varType
DataVariable.prototype._guessVariableType = function () {
    //functions to try to figure out position and time variables.
    function matchColumn(name, hints) {
        name = name.toLowerCase();
        for (var h in hints) {
            if (hints.hasOwnProperty(h)) {
                var hint = hints[h].toLowerCase();
                if (name.indexOf(hint) === 0 || name.indexOf(' ' + hint) !== -1 || name.indexOf('_' + hint) !== -1) {
                    return true;
                }
            }
        }
        return false;
    }

    var hintSet = [
        { hints: ['lon'], type: VarType.LON },
        { hints: ['lat'], type: VarType.LAT },
        { hints: ['depth', 'height', 'elevation'], type: VarType.ALT },
        { hints: ['time', 'date'], type: VarType.TIME }];

    for (var vt in hintSet) {
        if (matchColumn(this.name, hintSet[vt].hints)) {
            this.varType = hintSet[vt].type;
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
        if (this.vals[i] === this.noData) {
            this.vals[i] = 'undefined';
        }
        var n = enumHash[this.vals[i]];
        if (!defined(n)) {
            n = enumList.length;
            enumList.push(this.vals[i]);
            enumHash[this.vals[i]] = n;
        }
        this.vals[i] = n;
    }
    this.enumList = enumList;
    this._calculateVarMinMax();
};


/**
* Destroy the object and release resources
*
*/
DataVariable.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = DataVariable;




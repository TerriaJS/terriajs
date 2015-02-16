/*global require*/
"use strict";

/*!
 * Copyright(c) 2012-2013 National ICT Australia Limited (NICTA).  All rights reserved.
 */

var defined = require('../../third_party/cesium/Source/Core/defined');
var destroyObject = require('../../third_party/cesium/Source/Core/destroyObject');
var JulianDate = require('../../third_party/cesium/Source/Core/JulianDate');
var VarType = require('./VarType');

/**
* @class Variable contains a single variable from a table dataset
* @name Variable
*
* @alias Variable
* @internalConstructor
* @constructor
*/
var Variable = function () {
    this.vals = [];
    this.varType = undefined;
    this.noData = 1e-34;
    this.minVal = undefined;
    this.maxVal = undefined;
    this.timeVar = undefined;
    this.enumList = undefined;
};

Variable.prototype._calculateVarMinMax = function () {
    var vals = this.vals;
    var minVal = Number.MAX_VALUE;
    var maxVal = -Number.MAX_VALUE;
    for (var i = 0; i < vals.length; i++) {
        if (vals[i] === undefined || vals[i] === null) {
            vals[i] = this.noData;
        }
        else {
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

Variable.prototype._calculateTimeMinMax = function () {
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

/**
* Convert input time variable to Cesium Time variable
*
*/
Variable.prototype.processTimeVar = function () {
    if (this.varType !== VarType.TIME) {
        return;
    }
    
    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function _swapDateFormat(v) {
        var part = v.split(/[/-]/);
        if (part.length === 3) {
            v = part[1] + '/' + part[0] + '/' + part[2];
        }
        return v;
    }

    //time parsing functions
    function timeString(v) { //  9/2/94 0:56
        return JulianDate.fromDate(new Date(v));
    }
    function timeExcel(v) {   // 40544.4533
        var date = JulianDate.fromDate(new Date('January 1, 1970 0:00:00'));
        date = JulianDate.addDays(date, Math.floor(v) - 25569.0, date); //account for offset to 1900
        date = JulianDate.addSeconds(date, (v - Math.floor(v)) * 60 * 60 * 24, date);
        return date;
    }
    function timeUtc(v) {   //12321231414434
        return JulianDate.fromDate(Date.setTime(v));
    }
    function timeSosus(v) {   //19912410952050
        var dateString = v.toString();
        var year = parseInt(dateString.substring(0, 4), 10);
        var dayofyear = parseInt(dateString.substring(4, 7), 10);
        if (dateString.length !== 14 || year < 1950 || year > 2050 || dayofyear > 366) {
            return new JulianDate(0.0, 0.0);
        }
        var d = new Date();
        d.setUTCFullYear(year);
        d.setUTCHours(dateString.substring(7, 9), dateString.substring(9, 11), dateString.substring(11, 13));
        var date = JulianDate.addDays(JulianDate.fromDate(d), dayofyear, new JulianDate());
        return date;
    }
    //create new Cessium time variable to attach to the variable
    var timeVar = new Variable();
    var vals = this.vals;
    //select time parsing function
    var parseFunc;
    if (parseInt(vals[0], 10) > 500000) {
        if (timeSosus(vals[0]).dayNumber !== 0) {
            parseFunc = timeSosus;
        }
        else {
            parseFunc = timeUtc;
        }
    }
    else if (_isNumber(vals[0])) {
        parseFunc = timeExcel;
    }
    else {
        parseFunc = timeString;
    }
    //parse the time values
    var bSuccess = false;
    try {
        for (var i = 0; i < vals.length; i++) {
            timeVar.vals[i] = parseFunc(vals[i]);
        }
        bSuccess = true;
    }
    catch (err) {
        if (parseFunc === timeString) {
            console.log('Trying swap of day and month in date strings');
            timeVar.vals = [];
            try {
                for (var i = 0; i < vals.length; i++) {
                    timeVar.vals[i] = parseFunc(_swapDateFormat(vals[i]));
                }
                bSuccess = true;
            }
            catch (err) {
            }
        }
    }
    if (bSuccess) {
        timeVar._calculateTimeMinMax();
        this.timeVar = timeVar;
    }
    else {
        this.varType = VarType.SCALAR;
        console.log('Unable to parse time variable');
    }
};


/**
* Convert input enum variable to values and enumList
*
*/
Variable.prototype.processEnumVar = function () {
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
* Based on variable name, guess what the VarType should be
*
* @param {String} name Make an initial guess at the variable type based on its name
*
*/
Variable.prototype.guessVarType = function (name) {
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
        if (matchColumn(name, hintSet[vt].hints)) {
            this.varType = hintSet[vt].type;
            return;
        }
    }
    this.varType = VarType.SCALAR;
};

/**
* Destroy the object and release resources
*
*/
Variable.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = Variable;




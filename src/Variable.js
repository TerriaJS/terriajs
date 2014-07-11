/*global require,Cesium*/
"use strict";

/*!
 * Copyright(c) 2012-2013 National ICT Australia Limited (NICTA).  All rights reserved.
 */

var destroyObject = Cesium.destroyObject;
var JulianDate = Cesium.JulianDate;

var VarType = {LON: 0, LAT: 1, ALT: 2, TIME: 3, SCALAR: 4, ENUM: 5 };

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
    this.fNoData = 1e-34;
    this.min = undefined;
    this.max = undefined;
    this.type = undefined;
    this.time_var = undefined;
    this.enum_list = undefined;
};

Variable.prototype._calculateVarMinMax = function () {
    var vals = this.vals;
    var min_val = Number.MAX_VALUE;
    var max_val = -Number.MAX_VALUE;
    for (var i = 0; i < vals.length; i++) {
        if (vals[i] === undefined || vals[i] === null) {
            vals[i] = this.fNoData;
        }
        else {
            if (min_val > vals[i]) {
                min_val = vals[i];
            }
            if (max_val < vals[i]) {
                max_val = vals[i];
            }
        }
    }
    this.min = min_val;
    this.max = max_val;
};

Variable.prototype._calculateTimeMinMax = function () {
    var vals = this.vals;
    var min_val = vals[0];
    var max_val = vals[0];
    for (var i = 1; i < vals.length; i++) {
        if (JulianDate.greaterThan(min_val, vals[i])) {
            min_val = vals[i];
        }
        if (JulianDate.lessThan(max_val, vals[i])) {
            max_val = vals[i];
        }
    }
    this.min = min_val;
    this.max = max_val;
};

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

/**
* Convert input time variable to Cesium Time variable
*
*/
Variable.prototype.processTimeVar = function () {
    if (this.type !== VarType.TIME) {
        return;
    }
    //time parsing functions
    function time_string(v) { //  9/2/94 0:56
        return JulianDate.fromDate(new Date(v));
    }
    function time_excel(v) {   // 40544.4533
        var date = JulianDate.fromDate(new Date('January 1, 1970 0:00:00'));
        date = JulianDate.addDays(date, Math.floor(v) - 25569.0, date); //account for offset to 1900
        date = JulianDate.addSeconds(date, (v - Math.floor(v)) * 60 * 60 * 24, date);
        return date;
    }
    function time_utc(v) {   //12321231414434
        return JulianDate.fromDate(Date.setTime(v));
    }
    function time_sosus(v) {   //19912410952050
        var date_str = v.toString();
        var year = parseInt(date_str.substring(0, 4), 10);
        var dayofyear = parseInt(date_str.substring(4, 7), 10);
        if (date_str.length !== 14 || year < 1950 || year > 2050 || dayofyear > 366) {
            return new JulianDate(0.0, 0.0);
        }
        var d = new Date();
        d.setUTCFullYear(year);
        d.setUTCHours(date_str.substring(7, 9), date_str.substring(9, 11), date_str.substring(11, 13));
        var date = JulianDate.addDays(JulianDate.fromDate(d), dayofyear, new JulianDate());
        return date;
    }
    //create new Cessium time variable to attach to the variable
    var time_var = new Variable();
    var vals = this.vals;
    //select time parsing function
    var parseFunc;
    if (parseInt(vals[0], 10) > 500000) {
        if (time_sosus(vals[0]).dayNumber !== 0) {
            parseFunc = time_sosus;
        }
        else {
            parseFunc = time_utc;
        }
    }
    else if (_isNumber(vals[0])) {
        parseFunc = time_excel;
    }
    else {
        parseFunc = time_string;
    }
    //parse the time values
    var bSuccess = false;
    try {
        for (var i = 0; i < vals.length; i++) {
            time_var.vals[i] = parseFunc(vals[i]);
        }
        bSuccess = true;
    }
    catch (err) {
        if (parseFunc === time_string) {
            console.log('Trying swap of day and month in date strings');
            time_var.vals = [];
            try {
                for (var i = 0; i < vals.length; i++) {
                    time_var.vals[i] = parseFunc(_swapDateFormat(vals[i]));
                }
                bSuccess = true;
            }
            catch (err) {
            }
        }
    }
    if (bSuccess) {
        time_var._calculateTimeMinMax();
        this.time_var = time_var;
    }
    else {
        this.type = VarType.SCALAR;
        console.log('Unable to parse time variable');
    }
};


/**
* Convert input enum variable to values and enum_list
*
*/
Variable.prototype.processEnumVar = function () {
    if (this.type !== VarType.ENUM) {
        return;
    }
    //create new enum list for the variable
    var enum_list = [];
    for (var i = 0; i < this.vals.length; i++) {
        if (this.vals[i] === this.fNoData) {
            this.vals[i] = 'undefined';
        }
        var n = enum_list.indexOf(this.vals[i]);
        if (n === -1) {
            n = enum_list.length;
            enum_list.push(this.vals[i]);
        }
        this.vals[i] = parseFloat(n);
    }
    this.enum_list = enum_list;
    this.calculateVarMinMax();
};


/**
* Based on variable name, guess what the VarType should be
*
* @param {String} name Make an initial guess at the variable type based on its name
*
*/
Variable.prototype.guessVarType = function (name) {
    //functions to try to figure out position and time variables.
    function match_col(name, hints) {
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

    var hint_set = [
        { hints: ['lon'], type: VarType.LON },
        { hints: ['lat'], type: VarType.LAT },
        { hints: ['depth', 'height', 'elevation'], type: VarType.ALT },
        { hints: ['time', 'date'], type: VarType.TIME }];

    for (var vt in hint_set) {
        if (match_col(name, hint_set[vt].hints)) {
            this.type = hint_set[vt].type;
            return;
        }
    }
    this.type = VarType.SCALAR;
};

/**
* Destroy the object and release resources
*
*/
Variable.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = Variable;




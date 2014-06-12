/*global require,Cesium,$*/
"use strict";

var Variable = require('./Variable');

/*!
 * Copyright(c) 2012-2013 National ICT Australia Limited (NICTA).  All rights reserved.
 */
 
var defaultValue = Cesium.defaultValue;

var EMPTY_OBJECT = {};

var VarType = {LON: 0, LAT: 1, ALT: 2, TIME: 3, SCALAR: 4, ENUM: 5 };

/**
* @class Dataset is a container for table based datasets
* @name Dataset
*
* @alias Dataset
* @internalConstructor
* @constructor
*/
var Dataset = function() {
    this._nodataVal = 1e-34;
    this._rowCnt = 0;
    this._dataShape = undefined;
    this._varID = [];
    this._variables = undefined;
    this._loadingData = false;
};

/**
* Return the geographic extent of the dataset
*
* @memberof Dataset
*
*/
Dataset.prototype.getExtent = function () {
    var minpos = [0, 0, 0];
    var maxpos = [0, 0, 0];
    var type = [VarType.LON, VarType.LAT, VarType.ALT];
    for (var p in type) {
        if (this._varID[type[p]]) {
            minpos[p] = this._variables[this._varID[type[p]]].min;
            maxpos[p] = this._variables[this._varID[type[p]]].max;
        }
    }
    return Cesium.Rectangle.fromDegrees(minpos[0], minpos[1], maxpos[0], maxpos[1]);
};

Dataset.prototype.getMinVal = function () {
    if (this._variables && this._varID[VarType.SCALAR]) {
        return this._variables[this._varID[VarType.SCALAR]].min;
    }
};

Dataset.prototype.getMaxVal = function () {
    if (this._variables && this._varID[VarType.SCALAR]) {
        return this._variables[this._varID[VarType.SCALAR]].max;
    }
};

Dataset.prototype.getMinTime = function () {
    if (this._variables && this._varID[VarType.TIME]) {
        return this._variables[this._varID[VarType.TIME]].time_var.min;
    }
};

Dataset.prototype.getMaxTime = function () {
    if (this._variables && this._varID[VarType.TIME]) {
        return this._variables[this._varID[VarType.TIME]].time_var.max;
    }
};


/**
* Get a list of available scalar and enum type variables
*
* @memberof Dataset
*
*/
Dataset.prototype.getVarList = function () {
    var ret = [];
    for (var v in this._variables) {
        if (this._variables[v].type === VarType.SCALAR || this._variables[v].type === VarType.ENUM) {
            ret.push(v);
        }
    }
    return ret;
};

// Determine the min, max, and type of each variable
Dataset.prototype._processVariables = function () {
    this._varID = [];

    for (var id in this._variables) {
        if (this._variables.hasOwnProperty(id)) {
            var variable = this._variables[id];
            //guess var type if not set
            if (variable.type === undefined) {
                variable.guessVarType(id);
            }
            if (variable.type === VarType.TIME) {
                variable.processTimeVar();            //calculate time variables
                //if failed then default type to scalar
                if (variable.time_var === undefined) {
                    variable.type = VarType.SCALAR;
                }
            }
            if (variable.type !== VarType.TIME) {
                variable._calculateVarMinMax();            //calculate var min/max
            }
            //deal with enumerated variables
            if (variable.type === VarType.SCALAR && variable.min > variable.max) {
                variable.type = VarType.ENUM;
                variable.processEnumVar();            //calculate enum variables
            }

            //set the varIDs
            for (var vt in VarType) {
                if (VarType.hasOwnProperty(vt)) {
                    if (this._varID[VarType[vt]] === undefined && variable.type === VarType[vt]) {
                        this._varID[VarType[vt]] = id;
                    }
                }
            }
        }
    }

    //set variable if preset
    if (this._var_name && this._var_name.length && this._variables[this._var_name]) {
        this._varID[VarType.SCALAR] = this._var_name;
    }

    if (this._varID[VarType.SCALAR] === undefined) {
        this._varID[VarType.SCALAR] = this._varID[VarType.ENUM];
    }
    //set point count
    this._rowCnt = this._variables[this._varID[VarType.SCALAR]].vals.length;

    //save the shape information
    if (this._dataShape === undefined) {
        this._dataShape = [this._rowCnt];
    }
};


/**
* Load a JSON object into a dataset
*
* @memberof Dataset
* NOTE: result is now the same format as returned by d3.csv.parseRows
*
*/
Dataset.prototype.loadJson = function (result) {

    var dataObject = { positions: [], data_values: [] };
    this._dataShape = undefined;

    //create the variable set
    this._variables = {};
    var columnNames = result[0];
    for (var c = 0; c < columnNames.length; c++) {
        var name = columnNames[c];
        var variable = new Variable();
        for (var i = 1; i < result.length; ++i) {
            variable.vals.push(result[i][c]);
        }
        this._variables[name] = variable;
    }

    //calculate variable type and min/max vals
    this._processVariables();

    if (this._var_name) {
        this.setCurrentVariable({ variable: this._var_name });
    }

    console.log(this);

    this._loadingData = false;
};

/**
* Load text into a dataset
*
* @memberof Dataset
*
*/
Dataset.prototype.loadText = function (text) {
    var result = $.csv.toArrays(text, {
            onParseValue: $.csv.hooks.castToScalar
        });
    this.loadJson(result);
};

/**
* Load a dataset - returns header and optionally variable data
*
* @memberof Dataset
*
*/
Dataset.prototype.loadUrl = function (description) {
    description = defaultValue(description, EMPTY_OBJECT);

    this._url = defaultValue(description.url, this._url);
    this._var_name = defaultValue(description.variable, '');

    if (!this._url) {
        return;
    }

    console.log('loading: ' + this._url);

    this._loadingData = true;
    var that = this;
    
    Cesium.when(Cesium.loadText(this._url), function (text) { that.loadText(text); });
};

/**
* Set the current variable
*
* @memberof Dataset
*
*/
Dataset.prototype.setCurrentVariable = function (description) {
    if (!this._variables[description.variable] || 
        this._variables[description.variable].vals.length === 0) {
        return;
    }
    this._var_name = description.variable;
    if (this._var_name.length && this._variables[this._var_name]) {
        this._varID[VarType.SCALAR] = this._var_name;
    }
};

function _float_equals(a, b) { return (Math.abs((a - b) / b) < 0.00001); }

/**
* Get the current variable
*
* @memberof Dataset
*
*/
Dataset.prototype.getCurrentVariable = function () {
    return this._varID[VarType.SCALAR];
};


/**
* Get a data value
*
* @memberof Dataset
*
*/
Dataset.prototype.getDataValue = function (var_name, idx) {
    var variable = this._variables[var_name];
    if (variable === undefined || variable.vals === undefined) {
        return undefined;
    }
    if (variable.type === VarType.ENUM) {
        return variable.enum_list[variable.vals[idx]];
    }
    else if (variable.type === VarType.TIME) {
        return variable.time_var.vals[idx];
    }
     return variable.vals[idx];
};

/**
* Get all of the data values
*
* @memberof Dataset
*
*/
Dataset.prototype.getDataValues = function (var_name) {
    if (this._variables[var_name] === undefined || this._variables[var_name].vals === undefined) {
        return undefined;
    }
    return this._variables[var_name].vals;
};


/**
* Return a boolean as to whether this is a nodata item
*
* @memberof Dataset
*
*/
Dataset.prototype.isNoData = function (pt_val) {
    return _float_equals(this._nodataVal, pt_val);
};

/**
* Get a set of data points and positions for the current variable
*
* @memberof Dataset
*
*/
Dataset.prototype.getPointList = function (maxPts) {

    var lon = this._varID[VarType.LON] ? this._variables[this._varID[VarType.LON]].vals : undefined;
    var lat = this._varID[VarType.LAT] ? this._variables[this._varID[VarType.LAT]].vals : undefined;
    var alt = this._varID[VarType.ALT] ? this._variables[this._varID[VarType.ALT]].vals : undefined;
    var vals = this._variables[this._varID[VarType.SCALAR]].vals;
    var time = this._varID[VarType.TIME] ? this._variables[this._varID[VarType.TIME]].time_var.vals : undefined;
    if (maxPts === undefined) {
        maxPts = vals.length;
    }

    var ret = [];
    for (var i = 0; i < vals.length && i < maxPts; i++) {
        var rec = {val: vals[i]};
        rec.time =  time ? time[i] : undefined;
        rec.pos = [lon ? lon[i] : 0.0, lat ? lat[i] : 0.0, alt ? alt[i] : 0.0];
        ret.push(rec);
    }
    return ret;
};


/**
* Destroy the object and release resources
*
* @memberof Dataset
*
*/
Dataset.prototype.destroy = function () {
    return Cesium.destroyObject(this);
};

module.exports = Dataset;


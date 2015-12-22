/*global require*/
"use strict";

var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var VarType = require('../Map/VarType');  // TODO: makes little sense for VarType to be in Map directory

var hintSet = [
    { hint: /^(lon|longitude|lng)$/i, type: VarType.LON },
    { hint: /^(lat|latitude)$/i, type: VarType.LAT },
    { hint: /^(.*[_ ])?(depth|height|elevation)$/i, type: VarType.ALT },
    { hint: /^(.*[_ ])?(time|date)/i, type: VarType.TIME },
    { hint: /^postcode|poa|(.*_code)$/i, type: VarType.ENUM }
];

/**
* TableColumn is a very light class containing a single variable (or column) from a TableStructure.
* It guesses the variable type (time, enum etc) from the variable name.
* It provides an extra field for the column's color, useful for charts.
* In future it may perform additional processing.
*
* @alias TableColumn
* @constructor
* @param {String} name The name of the variable.
* @param {Number[]} values An array of values for the variable.
*/
var TableColumn = function(name, values) {
    this.name = name;
    this.type = TableColumn.guessVariableTypeFromName(name);
    this.values = values;
    this.color = undefined;
    // this.minVal = undefined;
    // this.maxVal = undefined;
};

/**
 * Try to determine the best variable type based on the variable name.
 * @param  {String} name The variable name, eg. 'Time (AEST)'.
 * @return {VarType} The variable type, eg. VarType.SCALAR.
 */
TableColumn.guessVariableTypeFromName = function(name) {
    for (var i in hintSet) {
        if (hintSet[i].hint.test(name)) {
            return hintSet[i].type;
        }
    }
    return VarType.SCALAR;
};

/**
 * Returns this column as an array, with the name as the first element, eg. ['x', 1, 3, 4].
 * @return {Array} The column as an array.
 */
TableColumn.prototype.toArrayWithName = function() {
    return [this.name].concat(this.values);
};

// function swapDateFormat(v) {
//     // converts a string such as '12-30-2015' into '30/12/2015'.
//     var part = v.split(/[/-]/);
//     if (part.length === 3) {
//         v = part[1] + '/' + part[0] + '/' + part[2];
//     }
//     return v;
// }

// /**
//  * Returns this variable's values after any necessary processing, based on its type. Eg. converts string dates to Julian Dates.
//  * @return {Array} Processsed values.
//  */
// TableColumn.prototype.processedValues = function() {

// }

// /**
//  * Converts this variable's string datetimes into JulianDates.
//  * @return {JulianDate[]} Processsed datetimes.
//  */
// TableColumn.prototype.processDateTimes = function() {
//     if (this.type !== VarType.TIME || this.values.length === 0 || typeof this.values[0] !== 'string') {
//         return;
//     }

//     //create new Cesium time variable to attach to the variable
//     var timeVar = new DataVariable();
//
//     //simple check to try to guess date format
//     var max = 0;
//     this.values.map(function(value) {
//         max = Math.max(max, parseInt(value));
//     });

//     var parseFunc;
//     if (max > 31) {  //iso format  yyyy-mm-dd
//         parseFunc = function(v) { return JulianDate.fromIso8601(v); };
//     }
//     else if (max > 12) { //intl javascript format dd-mm-yyyy
//         parseFunc = function(v) { return JulianDate.fromDate(new Date(swapDateFormat(v))); };
//     }
//     else {  //us javascript date format mm-dd-yyyy
//         parseFunc = function(v) { return JulianDate.fromDate(new Date(v)); };
//     }

//     //parse the time values trying iso and javascript date parsing
//     try {
//         for (var i = 0; i < vals.length; i++) {
//             timeVar.vals[i] = parseFunc(vals[i].toString());
//         }
//         timeVar._calculateTimeMinMax();
//         this.timeVar = timeVar;
//     }
//     catch (err) {
//         console.log('Unable to parse date', err);
//     }
// };

/**
* Destroy the object and release resources
*
*/
TableColumn.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = TableColumn;




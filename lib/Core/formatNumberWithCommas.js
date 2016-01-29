"use strict";

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');

/**
* Format the number using commas to separate thousands, eg. 912345.6789 => '912,345.6789'.
*
* @param {Number} number The number to format.
* @param {Number} minDigits The minimum number of digits to the left of the decimal point, before commas should be used. Defaults to 6, so 12345.6 => '12345.6'.
*/
function formatNumberWithCommas(number, minDigits) {
    if (!defined(minDigits)) {
        minDigits = 6;
    }
    var str = number.toString();
    var idx = str.indexOf('.');
    var frac = '';
    if (idx !== -1) {
        frac = str.substring(idx);
        str = str.substring(0, idx);
    }
    if (str.length < minDigits) {
        return str + frac;
    }
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + frac;
}

module.exports = formatNumberWithCommas;
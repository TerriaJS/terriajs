"use strict";

/*global require,Intl*/
var defined = require('terriajs-cesium/Source/Core/defined');

function toLocaleStringSupportsOptions() {
  return !!(typeof Intl === 'object' && Intl && typeof Intl.NumberFormat === 'function');
}

var formatter;
if (toLocaleStringSupportsOptions()) {
    formatter = new Intl.NumberFormat(undefined, {maximumFractionDigits: 20});
}

/**
* Format the number using the locale format if there are at least minDigits.
* In older browsers, applies commas to separate thousands, eg. 912345.6789 => '912,345.6789'.
*
* @param {Number} number The number to format.
* @param {Number} minDigits The minimum number of digits to the left of the decimal point, before commas should be used. Defaults to 5, so 1234.5 => '1234.5'.
*/
function formatNumberToLocale(number, minDigits) {
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
    if (defined(formatter)) {
        return formatter.format(+number);
    }
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + frac;
}

module.exports = formatNumberToLocale;
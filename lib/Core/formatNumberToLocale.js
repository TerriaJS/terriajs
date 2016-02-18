'use strict';

/*global require,Intl*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

function toLocaleStringSupportsOptions() {
  return !!(typeof Intl === 'object' && Intl && typeof Intl.NumberFormat === 'function');
}

/**
* Format the number using the locale format.
* When Intl is not available (includes Safari), applies commas to separate thousands, eg. 912345.6789 => '912,345.6789',
* and polyfills the maximumFractionDigits option.
*
* @param {Number} number The number to format.
* @param {Object} [options] Options as per Javascript's Intl NumberFormat,
*        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString .
*        Note we default useGrouping to false (not true) and maximumFractionDigits to 20 (not 3).
*/
function formatNumberToLocale(number, options) {
    options = defaultValue(options, {});
    options.useGrouping = defaultValue(options.useGrouping, false);
    options.maximumFractionDigits = defaultValue(options.maximumFractionDigits, 20);
    if (toLocaleStringSupportsOptions()) {
        var formatter = new Intl.NumberFormat(undefined, options);
        return formatter.format(+number);
    }
    var str = number.toString();
    var idx = str.indexOf('.');
    var frac = '';
    if (idx !== -1) {
        frac = str.substring(idx);
        frac = frac.substring(0, options.maximumFractionDigits);
        str = str.substring(0, idx);
    }
    if (str.length < 5 || !options.useGrouping) {
        return str + frac;
    }
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + frac;
}

module.exports = formatNumberToLocale;
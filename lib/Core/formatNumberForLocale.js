'use strict';

/*global require,Intl*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

function toLocaleStringSupportsOptions() {
  return !!(typeof Intl === 'object' && Intl && typeof Intl.NumberFormat === 'function');
}

/**
* Format the number using the locale format.
* Nulls are returned as an empty string, not 0.
* When Intl is not available (includes Safari), applies commas to separate thousands, eg. 912345.6789 => '912,345.6789',
* and polyfills:
*  - maximumFractionDigits
*  - style: percent
*
* @param {Number} number The number to format.
* @param {Object} [options] Options as per Javascript's Intl NumberFormat,
*        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString .
*        Note we default useGrouping to false (not true) and maximumFractionDigits to 20 (not 3).
*/
function formatNumberForLocale(number, options) {
    if (number === null) {
        return '';
    }
    options = defaultValue(options, {});
    options.useGrouping = defaultValue(options.useGrouping, false);
    options.maximumFractionDigits = defaultValue(options.maximumFractionDigits, 20);
    if (toLocaleStringSupportsOptions()) {
        var formatter = new Intl.NumberFormat(undefined, options);
        return formatter.format(+number);
    }
    var suffix = '';
    if (options.style === 'percent') {
        number = number * 100;
        suffix = '%';
    }
    var str = number.toString();
    var idx = str.indexOf('.');
    var frac = '';
    if (idx !== -1) {
        frac = str.substring(idx);
        // Ideally we could have just done number.toFixed(options.maximumFractionDigits),
        // but toFixed uses exactly that number of digits. So we only use it if the number of decimal places > maximum.
        if (frac.length > options.maximumFractionDigits + 1) {
            str = ((+number).toFixed(options.maximumFractionDigits));
            idx = str.indexOf('.');
            frac = '';
            if (idx !== -1) {
                frac = str.substring(idx);
                str = str.substring(0, idx);
            }
        } else {
            str = str.substring(0, idx);
        }
    }
    if (str.length < 5 || !options.useGrouping) {
        return str + frac + suffix;
    }
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + frac + suffix;
}

module.exports = formatNumberForLocale;
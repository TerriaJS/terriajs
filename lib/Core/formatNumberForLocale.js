'use strict';

/*global require,Intl*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');

// function toLocaleStringSupportsOptions() {
//   return !!(typeof Intl === 'object' && Intl && typeof Intl.NumberFormat === 'function');
// }

// var cachedFormatters = {};

var separator = ',';
if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
    var thousand = Intl.NumberFormat().format(1000);
    if (thousand.length === 5) {
        separator = thousand[1];
    }
}

/**
* Format the number using the locale format.
* Nulls are returned as an empty string, not 0.
* When Intl is not available (includes Safari), applies commas to separate thousands, eg. 912345.6789 => '912,345.6789',
* and polyfills:
*  - maximumFractionDigits
*  - style: percent
*  For speed, we cache Intl.NumberFormat for each value of options.
*
* @param {Number} number The number to format.
* @param {Object} [options] Options as per Javascript's Intl NumberFormat,
*        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString .
*        Note we default useGrouping to false (not true) and maximumFractionDigits to 20 (not 3).
*/
function formatNumberForLocale(number, options) {
    if (!definedNotNull(number)) {
        return '';
    }
    if (isNaN(number)) {
        return number;
    }
    options = defaultValue(options, {});
    options.useGrouping = defaultValue(options.useGrouping, false);
    options.maximumFractionDigits = defaultValue(options.maximumFractionDigits, 20);
    // if (toLocaleStringSupportsOptions()) {
    //     return formatWithIntl(number, options);
    // }
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
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, separator) + frac + suffix;
}

// function formatWithIntl(number, options) {
//     // The order of options may lead to equivalent keys being cached multiple times, but this is still better than creating a new Intl.NumberFormat every time.
//     var optionsAsKey = JSON.stringify(options);
//     try {
//         // IE11 can produce a RangeError: Option value is outside of valid range with the 'style: percent' option.
//         if (!cachedFormatters[optionsAsKey]) {
//             cachedFormatters[optionsAsKey] = new Intl.NumberFormat(undefined, options);
//         }
//         return cachedFormatters[optionsAsKey].format(+number);
//     }
//     catch(err) {}   
// }

module.exports = formatNumberForLocale;
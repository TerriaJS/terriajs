"use strict";

/*global require,Intl*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

// function toLocaleStringSupportsOptions() {
//   return !!(typeof Intl === 'object' && Intl && typeof Intl.NumberFormat === 'function');
// }

// var cachedFormatters = {};

var separator = ",";
var decimalPoint = ".";
if (typeof Intl === "object" && typeof Intl.NumberFormat === "function") {
  var thousand = Intl.NumberFormat().format(1000);
  if (thousand.length === 5) {
    separator = thousand[1];
  }
  var decimal = Intl.NumberFormat().format(0.5);
  if (decimal.length === 2) {
    decimalPoint = decimal[1];
  }
}

/**
 * Format the number using the locale format.
 * When Intl is not available (includes Safari), applies commas to separate thousands, eg. 912345.6789 => '912,345.6789'.
 * Nulls are returned as an empty string, not 0.
 *
 * @param {Number} number The number to format.
 * @param {Object} [options] A subset of the options of Javascript's Intl NumberFormat,
 *        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString .
 *        Note we default useGrouping to false (not true) and maximumFractionDigits to 20 (not 3).
 * @param {Boolean} [options.useGrouping] A flag for whether to separate thousands. Defaults to false.
 * @param {Integer} [options.minimumFractionDigits] Minimum number of decimal places. Defaults to 0.
 * @param {Integer} [options.maximumFractionDigits] Maximum number of decimal places. Defaults to 20.
 * @param {String}  [options.style] Pass 'percent' to format 0.83 as 83%.
 */
function formatNumberForLocale(number, options) {
  if (!defined(number)) {
    return "";
  }
  if (isNaN(number)) {
    return number;
  }
  options = defaultValue(options, {});
  options.useGrouping = defaultValue(options.useGrouping, false);
  options.maximumFractionDigits = defaultValue(
    options.maximumFractionDigits,
    20
  );
  options.minimumFractionDigits = defaultValue(
    options.minimumFractionDigits,
    0
  );
  // if (toLocaleStringSupportsOptions()) {
  //     return formatWithIntl(number, options);
  // }
  var suffix = "";
  if (options.style === "percent") {
    number = number * 100;
    suffix = "%";
  }
  var str = number.toString();
  var frac = "";

  function setStrAndFracToFixedDecimalPlaces(number, numberOfDecimalPlaces) {
    str = (+number).toFixed(numberOfDecimalPlaces);
    var decimalIndex = str.indexOf(".");
    frac = "";
    if (decimalIndex !== -1) {
      frac = decimalPoint + str.substring(decimalIndex + 1);
      str = str.substring(0, decimalIndex);
    }
  }

  var idx = str.indexOf(".");
  if (idx !== -1) {
    frac = decimalPoint + str.substring(idx + 1);
    // Ideally we could have just done number.toFixed(options.maximumFractionDigits),
    // but toFixed uses exactly that number of digits. So we only use it if the number of decimal places > maximum.
    if (frac.length > options.maximumFractionDigits + 1) {
      setStrAndFracToFixedDecimalPlaces(number, options.maximumFractionDigits);
    } else if (frac.length < options.minimumFractionDigits + 1) {
      setStrAndFracToFixedDecimalPlaces(number, options.minimumFractionDigits);
    } else {
      str = str.substring(0, idx);
    }
  } else if (options.minimumFractionDigits > 0) {
    // We need to show an integer with the minimum number of decimal places.
    setStrAndFracToFixedDecimalPlaces(number, options.minimumFractionDigits);
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

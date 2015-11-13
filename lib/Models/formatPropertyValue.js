"use strict";

/*global require*/
var markdownToHtml = require('../Core/markdownToHtml');

function numberWithCommas(x) {
    var str = x.toString();
    var idx = str.indexOf('.');
    var frac = '';
    if (idx !== -1) {
        frac = str.substring(idx);
        str = str.substring(0, idx);
    }
    if (str.length < 6) {
        return str+frac;
    }
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + frac;
}

/**
* Format the value for the description, used by the Feature Info Panel.
* Strings have markdown applied to them, and numbers are formatted with commas.
* Anything else is returned as-is.
*
* @param {} value The value to format.
*
*/
function formatPropertyValue(value) {
    if (typeof value === 'number') {
        return numberWithCommas(value);
    } else if (typeof value === 'string') {
        return markdownToHtml(value, false);
    }
    return value;
}

module.exports = formatPropertyValue;
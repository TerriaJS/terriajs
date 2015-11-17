"use strict";

/*global require*/
var linkifyContent = require('./linkifyContent');


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
        // do not linkify if it contains html elements, which we detect by looking for <x...>
        // this could catch some non-html strings such as "a<3 && b>1", but not linkifying those is no big deal
        if (!/<[a-z][\s\S]*>/i.test(value)) {
            return linkifyContent(value);
        }
    }
    return value;
}

module.exports = formatPropertyValue;
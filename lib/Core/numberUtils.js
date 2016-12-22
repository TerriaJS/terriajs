'use strict';

function isInteger(value) {
    return !isNaN(value) && parseInt(Number(value), 10) === value && !isNaN(parseInt(value, 10));
}

function isNumeric(n) {
    // isNumeric("15") = true
    // isNumeric("-1.1") = true
    // isNumeric("-1.1a") = false
    // isNumeric("Infinity") = false
    // isNumeric("NaN") = false
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function startsNumeric(n) {
    // startsNumeric("15") = true
    // startsNumeric("-1.1") = true
    // startsNumeric("-1.1a") = true   // ** Note difference from isNumeric.
    // startsNumeric("Infinity") = true  // ** Also different, but unlikely to be a problem.
    // startsNumeric("NaN") = false
    return !isNaN(parseFloat(n));
}

function compareStringsAndNumbers(a, b) {
    // A function that can be used as an argument to sort, which will sort the following sensibly:
    // ["other", "10 bottles", "5 bottles", "none", "etc", "8"] -> ["5 bottles", "8", "10 bottles", "etc", "none", "other"].
    if (startsNumeric(a) && startsNumeric(b)) {
        return parseFloat(a) - parseFloat(b);
    }
    return a > b ? 1 : a < b ? -1 : 0;
}

module.exports = {isInteger, isNumeric, startsNumeric, compareStringsAndNumbers};
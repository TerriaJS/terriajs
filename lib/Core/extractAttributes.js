"use strict";
/**
 * Extract a single xml element's attributes into an object
 * e.g. <chart src="one" src-preview="two" />
 * would be converted into { src: "one", srcPreview: "two" }
 * Does not handle quotes with backslashes.
 *
 * @param {String} elementString eg. <chart src="one" src-preview="two" />
 * @return {Object} An object with the keys and values of the elementString's attributes
 */
var extractAttributes = function(elementString) {
    // split on = signs.
    // the key is the word preceding the = , converted to camelCase.
    // the value is everything in quotes after it.
    var result = {};
    var split = elementString.split('=');
    var key, trimmed, value, quote, nextQuoteIndexMinusOne;
    for (var i = 1; i < split.length; i++) {
        key = lastWord(split[i - 1]).replace(/-([a-z])/gi, function (g) { return g[1].toUpperCase(); });
        trimmed = split[i].trim();
        quote = trimmed[0];
        // note this does not handle quotes with backslashes
        nextQuoteIndexMinusOne = trimmed.substr(1).indexOf(quote);
        value = trimmed.substr(1, nextQuoteIndexMinusOne);
        result[key] = value;
    }
    return result;
};

function lastWord(s) {
    var words = s.split(" ");
    return words[words.length - 1];
}

module.exports = extractAttributes;

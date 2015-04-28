'use strict';

var mapping = [];

/**
 * Creates a type derived from {@link CatalogMember} based on a given URL.
 *
 * @param {String} url The derived type name.
 * @param {Terria} terria The Terria instance.
 * @returns {CatalogMember} The constructed data item, or undefined if the URL is not supported.
 */
var createCatalogItemFromUrl = function(url, terria) {
    for (var i = 0; i < mapping.length; ++i) {
        var matcher = mapping[i];
        if (matcher.matcher(url)) {
            return new matcher.constructor(terria, url);
        }
    }
    return undefined;
};

/**
 * Registers a constructor for a given type of {@link CatalogMember}.
 * 
 * @param {createCatalogItemFromUrl~Matcher} matcher A function that is given a URL to match as its only parameter.  If the function returns true, The type name for which to register a constructor.
 * @param {createCatalogItemFromUrl~Constructor} constructor The constructor for data items that match the given matcher.
 */
 createCatalogItemFromUrl.register = function(matcher, constructor) {
    mapping.push({
        matcher: matcher,
        constructor: constructor
    });
};

/**
 * Function interface for matching a URL to a {@link CatalogMember} constructor
 * for that URL.
 * @callback createCatalogItemFromUrl~Matcher
 * @param {String} url The URL to match.
 * @returns {Boolean} True if the constructor can be used with this URL; otherwise, false.
 *
 * @example
 * var czmlExtensionRegex = /\.czml$/i;
 * function isCzml(url) {
 *     return url.match(czmlExtensionRegex);
 * }
 */

 /**
  * Function interface for matching a URL to a {@link CatalogMember} constructor
  * for that URL.
  * @callback createCatalogItemFromUrl~Constructor
  * @param {Terria} terria The Terria instance.
  * @param {String} url The URL from which to obtain the data.
  * @returns {CatalogMember} The created data item.
  */

module.exports = createCatalogItemFromUrl;
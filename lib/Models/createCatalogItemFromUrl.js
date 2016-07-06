'use strict';

var mapping = [];

/**
 * Creates a type derived from {@link CatalogMember} based on a given URL.
 *
 * @param {String} url The derived type name.
 * @param {Terria} terria The Terria instance.
 * @param {Boolean} allowLoad Whether it's ok to attempt to load the URL and detect failures. We generally do this for WMS type services, but not for local files.
 * @returns {CatalogMember} The constructed data item or promise, or undefined if the URL is not supported.
 */
var createCatalogItemFromUrl = function(url, terria, allowLoad, index) {
    index = index || 0;
    if (index >= mapping.length) {
        return undefined;
    }
    if (mapping[index].matcher && !mapping[index].matcher(url) || (mapping[index].requiresLoad && !allowLoad)) {
        return createCatalogItemFromUrl(url, terria, allowLoad, index + 1);
    } else {
        var item = new mapping[index].constructor(terria);
        if (!allowLoad) {
            return item;
        }
        item.url = url;
        item.name = url;
        return item.load().yield(item).otherwise(function(e) {
            console.log(e);
            return createCatalogItemFromUrl(url, terria, allowLoad, index + 1);
        });
    }
};

/**
 * Registers a constructor for a given type of {@link CatalogMember}.
 *
 * @param {createCatalogItemFromUrl~Matcher} matcher A function that is given a URL to match as its only parameter.  If the function returns true, The type name for which to register a constructor.
 * @param {createCatalogItemFromUrl~Constructor} constructor The constructor for data items that match the given matcher.
 * @param {createCatalogItemFromUrl~requiresLoad} requiresLoad A boolean indicating whether the URL must be actually loaded in order to really determine if it matches.
 */
 createCatalogItemFromUrl.register = function(matcher, constructor, requiresLoad) {
    mapping.push({
        matcher: matcher,
        constructor: constructor,
        requiresLoad: requiresLoad
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

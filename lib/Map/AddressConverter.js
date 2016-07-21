'use strict';

/*global require*/
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

/*
Determine lat and long coordinates for a given address.
If TableStructure has address column, adds two new columns: lat and long.
*/

/**
 * Instantiate an address converter with a TableStructure that it must convert.
 *
 * @alias AddressConverter
 * @constructor
 */
var AddressConverter = function() {
    /**
     * Missing addresses from last geocode.
     * @type {Array}
     */
    this.missingAddresses = [];
};

/**
 * Convert addresses in miniumum number of calls to the server. When the promise fulfills, the tableStructure has been
 * updated with new lat and lon columns.
 *
 * @param {TableStructure} [tableStructure] A tableStructure that contains an address column.
 * @param {CorsProxy} [corsProxy] Proxy for cross origin resource sharing
 *
 * @return {Promise} Promise with no return value.
 */
AddressConverter.prototype.bulkConvertAddresses = function(tableStructure, corsProxy) {
    throw new DeveloperError('bulkConvertAddresses must be implemented in the derived class.');
};

module.exports = AddressConverter;

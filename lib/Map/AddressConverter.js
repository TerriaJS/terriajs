'use strict';

/*global require*/
var when = require('terriajs-cesium/Source/ThirdParty/when');
var VarType = require('../Map/VarType');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var URI = require('urijs');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var GNAFApi = require('../Models/GNAFApi');

/*
If TableStructure has address column, adds two new columns: lat and long.
It must call a geocoding service to determine the lat and long coordinates for a given address.
*/

/**
 * Instantiate an address converter with a TableStructure that it must convert.
 *
 * @alias AddressConverter
 * @constructor
 * @param {TableStructure} [tableStructure] A tableStructure that contains an address column.
 * @param {CorsProxy} [corsProxy] Proxy for cross origin resource sharing
 */
var AddressConverter = function(tableStructure, corsProxy) {
    /**
     * TableStructure containing data loaded in from csv, including an address column
     * @type {TableStructure}
     */
    this.tableStructure = tableStructure;

    /**
     * CorsProxy from Terria to help access the Geocoder.
     * @type {CorsProxy}
     */
    this.corsProxy = corsProxy;
};

/**
 * Convert addresses one at a time, making multiple calls to the server. For some geocoding services, this is all they
 * provide. When the promise fulfills, the tableStructure has been updated with new lat and lon columns.
 *
 * @return {Promise} Promise with no return value.
 */
AddressConverter.prototype.convertEachAddress = function() {

    if (!this.tableStructure.hasAddress)
    {
        throw new DeveloperError('This tableStructure has no addresses!');
    }

    var addressesCol = this.tableStructure.columnsByType[VarType.ADDR][0];
    if (addressesCol.length === 0)
    {
        throw new DeveloperError('Even though the tableStructure reports it has an address column, '
                                 + 'it has no addresses!');
    }

    var that = this;
    var promises = addressesCol.values.map(function(address) { return convertAddress(address, that.corsProxy); });
    return when.all(promises).then( function(results) {
        var longValues = results.map(function(latLong) { return latLong.longitude; });
        that.tableStructure.addColumn("Lon", longValues);

        var latValues = results.map(function(latLong) { return latLong.latitude; });
        that.tableStructure.addColumn("Lat", latValues);
        return when(true);
    }).otherwise(function(e) {
        console.log("Unable to create lat and lon columns for TableStructure.");
        console.log(e);
    });
};

/**
 * A promise to convert a single address to lat long coordinates, which resolves to
 * a length two array with (longitude, latitude) coordinates.
 *
 * @param {String} [address] The address to convert
 * @param {String} [corsProxy] Proxy for cross origin resource sharing
 * @return {Promise} A promise that eventually returns a pair of coordinates.
 */
function convertAddress(address, corsProxy) {

    var gnafApi = new GNAFApi(corsProxy);

    return gnafApi.geoCode(address, undefined, 1).then(function(info) {
        return info[0].location;
    }).otherwise(function(e) {
        console.log("Error retrieving lat-long coordinates for address.", e);
    });
}

module.exports = AddressConverter;

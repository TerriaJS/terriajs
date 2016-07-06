'use strict';

/*global require*/
var when = require('terriajs-cesium/Source/ThirdParty/when');
var VarType = require('../Map/VarType');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var GNAFApi = require('../Models/GNAFApi');
var defined = require('terriajs-cesium/Source/Core/defined');

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

    if (!this.tableStructure.hasAddress) {
        throw new DeveloperError('This tableStructure has no addresses!');
    }

    var addressesCol = this.tableStructure.columnsByType[VarType.ADDR][0];
    if (addressesCol.length === 0) {
        throw new DeveloperError('Even though the tableStructure reports it has an address column, '
                                 + 'it has no addresses!');
    }
    var suburbs = this.tableStructure.getColumnWithName("Suburb");
    smooshColumn(addressesCol, suburbs);
    var state = this.tableStructure.getColumnWithName("State");
    smooshColumn(addressesCol, state);
    var postCodeCol = this.tableStructure.getColumnWithName("Postcode");
    smooshColumn(addressesCol, postCodeCol);

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
 * Add info to address, comma separated.
 * @param {TableColumn} [addressesCol] Table column with addresses to be added to
 * @param {TableColumn} [newCol] Table column with extra info to be added to addresses column
 */
function smooshColumn(addressesCol, newCol) {
    if (!defined(newCol)) {
        return;
    }
    if (newCol.values.length === addressesCol.values.length) {
        for (var i=0; i<addressesCol.values.length; i++) {
            if (addressesCol.values[i] !== null && newCol.values[i] !== null) {
                addressesCol.values[i] = addressesCol.values[i] + "," + newCol.values[i];
            }
        }
    }
}

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
    if (address === null) {
        return {'latitude': undefined, 'longitude': undefined};
    }
    if (address.indexOf("PO Box") !== -1 || address.indexOf("Post Office Box") !== -1) {
        return {'latitude': undefined, 'longitude': undefined};
    }

    return gnafApi.geoCode(address, undefined, 1).then(function(info) {
        if (!defined(info) || info.length !== 1) {
            console.log("Address " + address + " couldn't be found.");
            return {'latitude': undefined, 'longitude': undefined};
        }
        return info[0].location;
    }).otherwise(function(e) {
        console.log("Error retrieving lat-long coordinates for address.", e);
    });
}

module.exports = AddressConverter;

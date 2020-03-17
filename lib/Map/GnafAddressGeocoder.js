"use strict";

import i18next from "i18next";
/*global require*/
var VarType = require("../Map/VarType");
var AddressGeocoder = require("../Map/AddressGeocoder");
var BulkAddressGeocoderResult = require("../Map/BulkAddressGeocoderResult");
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var GnafApi = require("../Models/GnafApi");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;

/**
 * Australia-only address converter, which uses the GNAF api to determine lat and long coordinates for a given address.
 * If TableStructure has address column, adds two new columns: lat and long.
 *
 * @alias GnafAddressGeocoder
 * @constructor
 * @extends AddressGeocoder
 *
 */
var GnafAddressGeocoder = function() {
  AddressGeocoder.call(this);
};

/**
 * Convert addresses in miniumum number of calls to the server. When the promise fulfills, the tableStructure has been
 * updated with new lat and lon columns.
 *
 * @param {TableStructure} [tableStructure] A tableStructure that contains an address column.
 * @param {CorsProxy} [corsProxy] Proxy for cross origin resource sharing
 * @return {Promise} Promise that resolves to an BulkAddressGeocoderResult object.
 */
GnafAddressGeocoder.prototype.bulkConvertAddresses = function(
  tableStructure,
  corsProxy
) {
  this.startTime = JulianDate.now();
  this.tableStructure = tableStructure;
  if (!tableStructure.hasAddress) {
    throw new DeveloperError(i18next.t("map.gnafAddressGeocoder.noAddresses"));
  }

  var addressesCol = tableStructure.columnsByType[VarType.ADDR][0];
  if (addressesCol.length === 0) {
    throw new DeveloperError(i18next.t("map.gnafAddressGeocoder.noAddresses2"));
  }
  var suburbs = tableStructure.getColumnWithName(
    i18next.t("map.gnafAddressGeocoder.suburb")
  );
  smooshColumn(addressesCol, suburbs);
  var state = tableStructure.getColumnWithName(
    i18next.t("map.gnafAddressGeocoder.state")
  );
  smooshColumn(addressesCol, state);
  var postCodeCol = tableStructure.getColumnWithName(
    i18next.t("map.gnafAddressGeocoder.postcode")
  );
  smooshColumn(addressesCol, postCodeCol);
  var gnafApi = new GnafApi(corsProxy);

  var addressesPlusInd = prefilterAddresses(addressesCol.values);
  this.skipIndices = addressesPlusInd.skipIndices;
  this.addressesCol = addressesCol;
  this.numberOfAddressesConverted = addressesPlusInd.addresses.length;
  var that = this;

  return gnafApi
    .bulkGeoCode(addressesPlusInd.addresses, undefined)
    .then(function(info) {
      var longValues = [];
      var latValues = [];
      var matchedAddresses = [];
      var resultScores = [];
      var missingAddresses = [];
      var j = 0;
      for (var i = 0; i < that.addressesCol.values.length; i++) {
        if (
          that.skipIndices.indexOf(i) !== -1 ||
          !defined(info[j]) ||
          !defined(info[j].location) ||
          isNaN(info[j].location.longitude) ||
          isNaN(info[j].location.latitude)
        ) {
          if (that.addressesCol.values[i] !== null) {
            missingAddresses.push(that.addressesCol.values[i]);
          }
          longValues.push(null);
          latValues.push(null);
          resultScores.push(null);
          matchedAddresses.push(null);
          continue;
        }
        longValues.push(info[j].location.longitude);
        latValues.push(info[j].location.latitude);
        resultScores.push(info[j].score);
        matchedAddresses.push(info[j].name);
        j++;
      }
      that.tableStructure.addColumn(
        i18next.t("map.gnafAddressGeocoder.postcode"),
        matchedAddresses
      );
      that.tableStructure.addColumn(
        i18next.t("map.gnafAddressGeocoder.lon"),
        longValues
      );
      that.tableStructure.addColumn(
        i18next.t("map.gnafAddressGeocoder.lat"),
        latValues
      );
      that.tableStructure.addColumn(
        i18next.t("map.gnafAddressGeocoder.score"),
        resultScores
      );
      var addressGeocoderData = new BulkAddressGeocoderResult(
        that.startTime,
        that.numberOfAddressesConverted,
        addressesPlusInd.nullAddresses,
        missingAddresses
      );
      return addressGeocoderData;
    });
};

/**
 * Add info to address, comma separated.
 * @param {TableColumn} [addressesCol] Table column with addresses to be added to
 * @param {TableColumn} [newCol] Table column with extra info to be added to addresses column
 *
 * @private
 */
function smooshColumn(addressesCol, newCol) {
  if (!defined(newCol)) {
    return;
  }
  if (newCol.values.length === addressesCol.values.length) {
    for (var i = 0; i < addressesCol.values.length; i++) {
      if (addressesCol.values[i] !== null && newCol.values[i] !== null) {
        addressesCol.values[i] =
          addressesCol.values[i] + " " + newCol.values[i];
      }
    }
  }
}

/**
 * Do not try to geocode addresses that don't look valid.
 *
 * @param {Array} addressList List of addresses that will be considered for geocoding
 * @return {Object} Probably shorter list of addresses that should be geocoded, as well as indices of addresses that
 *                  were removed.
 * @private
 */
function prefilterAddresses(addressList) {
  var addressesPlusInd = { skipIndices: [], nullAddresses: 0, addresses: [] };

  for (var i = 0; i < addressList.length; i++) {
    var address = addressList[i];
    if (address === null) {
      addressesPlusInd.skipIndices.push(i);
      addressesPlusInd.nullAddresses++;
      continue;
    }
    if (
      address
        .toLowerCase()
        .indexOf(i18next.t("map.gnafAddressGeocoder.poBox")) !== -1 ||
      address
        .toLowerCase()
        .indexOf(i18next.t("map.gnafAddressGeocoder.postOfficeBox")) !== -1
    ) {
      addressesPlusInd.skipIndices.push(i);
      continue;
    }
    addressesPlusInd.addresses.push(address);
  }
  return addressesPlusInd;
}

module.exports = GnafAddressGeocoder;

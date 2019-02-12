'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var L = require('leaflet');

/**
 * Consolidates all of the latLngBounds in the given array to compute a latLngBounds 
 * which encloses all of the given bounds.
 * @param {L.latLngBounds[]} [latLngBoundsArray] The array of latLngBounds.
 * @return {L.latLngBounds} The computed bounds.
 */
var combineLatLngBounds = function(latLngBoundsArray) {
    if (!defined(latLngBoundsArray)) {
        throw new DeveloperError('latLngBoundsArray is required.');
    }
    if (!Array.isArray(latLngBoundsArray) || latLngBoundsArray.length <= 0) {
        throw new DeveloperError('latLngBoundsArray should be a non-empty array');
    }

    var result = latLngBoundsArray[0];
    for (var i = 1, len = latLngBoundsArray.length; i < len; i++) {
        result.extend(latLngBoundsArray[i]);
    }
    return result;
};

module.exports = combineLatLngBounds;

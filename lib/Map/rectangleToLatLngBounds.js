'use strict';

/*global require*/
var L = require('leaflet');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');

/**
 * Converts a Cesium Rectangle into a Leaflet LatLngBounds.
 * @param {Rectangle} rectangle The rectangle to convert.
 * @return {L.latLngBounds} The equivalent Leaflet latLngBounds.
 */
var rectangleToLatLngBounds = function(rectangle) {
    var west = CesiumMath.toDegrees(rectangle.west);
    var south = CesiumMath.toDegrees(rectangle.south);
    var east = CesiumMath.toDegrees(rectangle.east);
    var north = CesiumMath.toDegrees(rectangle.north);
    return L.latLngBounds([south, west], [north, east]);
};

module.exports = rectangleToLatLngBounds;

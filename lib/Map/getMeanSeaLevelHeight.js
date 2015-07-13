'use strict';

/*global require*/
var loadArrayBuffer = require('terriajs-cesium/Source/Core/loadArrayBuffer');

/**
 * Gets the height of mean sea level (MSL) above the surface of the ellipsoid.  This functions uses the Earth Gravity Model 1996
 * (EGM96) geoid to approximate mean sea level.
 * @param {Number} longitude The longitude.
 * @param {Number} latitude The latitude
 * @return {Number} The height of mean sea level above the ellipsoid at the specified location.  Negative numbers indicate that mean sea level
 *                  is below the ellipsoid.
 */
var getMeanSeaLevelHeight = function(longitude, latitude) {
};

module.exports = getMeanSeaLevelHeight;
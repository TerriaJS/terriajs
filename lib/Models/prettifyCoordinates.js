'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import proj4 from 'proj4/lib/index.js';

/**
 * Turns the latitude / longitude in degrees into a human readable pretty strings.
 */
function prettifyCoordinates(latitude, longitude, height, errorBar) {
    var result = {};

    result.latitude = Math.abs(latitude).toFixed(3) +
        '°' + (latitude < 0.0 ? 'S' : 'N');
    result.longitude = Math.abs(longitude).toFixed(3) +
        '°' + (longitude < 0.0 ? 'W' : 'E');

    if (defined(height)) {
        result.elevation = Math.round(height) + (defined(errorBar) ? '±' +
            Math.round(errorBar) : '') + 'm';
    } else {
        result.elevation = undefined;
    }

    return result;
}

module.exports = prettifyCoordinates;

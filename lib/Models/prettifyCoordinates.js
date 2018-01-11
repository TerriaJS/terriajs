'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';

/**
 * Turns the longitude / latitude in degrees into a human readable pretty strings.
 *
 * @param {Number} longitude The longitude to format.
 * @param {Number} latitude The latitude to format.
 * @param {Object} options Object with the following properties:
 * @param {Number} options.height The height.
 * @param {Number} options.errorBar The error +/- for the height.
 * @param {Number} options.digits The number of digits to fix the lat / lon to.
 */
function prettifyCoordinates(longitude, latitude, options) {
    var result = {};

    options = defaultValue(options, {});
    options.digits = defaultValue(options.digits, 3);

    result.latitude = Math.abs(latitude).toFixed(options.digits) +
        '°' + (latitude < 0.0 ? 'S' : 'N');
    result.longitude = Math.abs(longitude).toFixed(options.digits) +
        '°' + (longitude < 0.0 ? 'W' : 'E');

    if (defined(options.height)) {
        result.elevation = Math.round(options.height) + (defined(options.errorBar) ? '±' +
            Math.round(options.errorBar) : '') + 'm';
    } else {
        result.elevation = undefined;
    }

    return result;
}

module.exports = prettifyCoordinates;

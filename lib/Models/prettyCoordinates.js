import defined from 'terriajs-cesium/Source/Core/defined';
import proj4 from 'proj4/lib/index.js';

/**
 * Turns the latitude / longitude in degrees into a human readable pretty strings.
 */
export function prettifyCoordinates(latitude, longitude, height, errorBar) {
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

/**
 * Turns the latitude / longitude in degrees into a human readable pretty UTM zone representation.
 */
export function prettifyProjection(latitude, longitude, proj4Projection, proj4longlat, projectionUnits) {
    const zone = 1 + Math.floor((longitude + 180) / 6);

    const projection = proj4Projection + ' +zone=' + zone +
        (latitude < 0 ? ' +south' : '');

    const projPoint = proj4((proj4longlat), (projection),
        [longitude, latitude]);


    return {
        utmZone: zone + (latitude < 0.0 ? 'S' : 'N'),
        north: projPoint[1].toFixed(2) + projectionUnits,
        east: projPoint[0].toFixed(2) + projectionUnits
    };
}

'use strict';

/*global require*/
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

/**
 * A parameter that specifies a single location on the globe.
 *
 * @alias PointParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {Boolean} [options.defaultValue] The default value.
 */
var PointParameter = function(options) {
    FunctionParameter.call(this, options);

    /**
     * Determines whether the point parameter is currently holding valid data.
     * @member {*} isValid
     * @memberof FunctionParameter.prototype
     */
    knockout.defineProperty(this, 'isValid', {
        get: function () {
            // Note: 3 possible states of the value: empty, invalid, and valid Cartographic.
            //       Empty is considered valid or invalid depending on the .isRequired state.

            // Check if the parameter is not required and it is empty.
            if ((this.isRequired === false) && !defined(this.value)) {
                return true;
            }

            // Check that the parameter is well formed.
            if (defined(this.value)) {
                if (this.value instanceof Cartographic) {
                    if ((isNaN(this.value.longitude) === false) && (isNaN(this.value.latitude) === false)) {
                        return true;
                    }
                }
            }

            return false;
        }
    });
};

inherit(FunctionParameter, PointParameter);

defineProperties(PointParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof DateTimeParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'point';
        }
    }

    /**
     * Gets or sets the value of this parameter.
     * @memberof PointParameter.prototype
     * @member {Cartographic} value
     */
});

/**
 * Represents value as string.
 * @param {Object} value Value to format as string.
 * @return {String} String representing value.
 */
PointParameter.prototype.formatValueAsString = function(value) {
    value = defaultValue(value, this.value);
    if (!defined(value)) {
        return '-';
    }

    return Math.abs(CesiumMath.toDegrees(value.latitude)) + '°' + (value.latitude < 0 ? 'S ' : 'N ') +
           Math.abs(CesiumMath.toDegrees(value.longitude)) + '°' + (value.longitude < 0 ? 'W' : 'E');
};

/**
 * Get feature as geojson for display on map.
 * @param {Object} value Value to use.
 * @return GeoJson object.
 */
PointParameter.prototype.getGeoJsonFeature = function(value) {
    value = defaultValue(value, this.value);
    if (!defined(value) || value === '') {
        return undefined;
    }

    var coordinates = [
        CesiumMath.toDegrees(value.longitude),
        CesiumMath.toDegrees(value.latitude),
    ];

    if (defined(value.height)) {
        coordinates.push(value.height);
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: coordinates
        }
    };
};

/**
 * Parses the value stores the value as this.value. If the value is valid it is stored as Cartographic otherwise updates
 * this.value simply holds the value unparsed. The empty string is converted to undefined.
 * @param {String} value Text that is to be parsed.
 */
PointParameter.prototype.parseParameterLonLat = function(value) {
    const parsedValue = this.tryParseCartographicValueFromTextLonLat(value);

    // Here we need to store the value in its unparsed form when we can't validate it so that we can differentiate
    // between when the field is empty and when the field contains data that is not valid.
    if (defined(parsedValue)) {
        this.value = parsedValue;
    } else if (value === "") {
        this.value = undefined;
    } else {
        this.value = value;
    }
};

/**
 * Parses the value into a Cartographic if it is in a valid format, otherwise returns undefined.
 * @param {String} value Text that is to be parsed. The value is expected to be formatted as "{Lon},{Lat}".
 * @return {Cartographic} The value if it was able to be parsed otherwise undefined.
 */
PointParameter.prototype.tryParseCartographicValueFromTextLonLat = function(value) {
    const coordinates = value.split(',');
    if (coordinates.length >= 2) {
        const lon = parseFloat(coordinates[0]);
        const lat = parseFloat(coordinates[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
            return Cartographic.fromDegrees(lon, lat);
        }
    }

    return undefined;
};

PointParameter.formatValueAsString = PointParameter.prototype.formatValueAsString;
PointParameter.getGeoJsonFeature = PointParameter.prototype.getGeoJsonFeature;

/**
 * Process value so that it can be used in an URL.
 * @param {String} value Value to use to format.
 * @return {String} Stringified JSON that can be used to pass parameter value in URL.
 */
PointParameter.formatValueForUrl = function(value) {
    return JSON.stringify({
        type: 'FeatureCollection',
        features: [
            PointParameter.getGeoJsonFeature(value)
        ]
    });
};

PointParameter.AvailableFormatters = {
    default: formatAsLongitudeCommaLatitude,
    longitudeCommaLatitude: formatAsLongitudeCommaLatitude,
    latitudeCommaLongitude: formatAsLatitudeCommaLongitude,
    geoJsonFeature: formatAsGeoJsonFeature,
    geoJsonFeatureCollection: PointParameter.formatValueForUrl
};

function formatAsLongitudeCommaLatitude(value) {
    const longitude = CesiumMath.toDegrees(value.longitude);
    const latitude = CesiumMath.toDegrees(value.latitude);
    return `${longitude},${latitude}`;
}

function formatAsLatitudeCommaLongitude(value) {
    const longitude = CesiumMath.toDegrees(value.longitude);
    const latitude = CesiumMath.toDegrees(value.latitude);
    return `${latitude},${longitude}`;
}

function formatAsGeoJsonFeature(value) {
    return JSON.stringify(PointParameter.getGeoJsonFeature(value));
}

module.exports = PointParameter;

'use strict';

/*global require*/
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');
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
        'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': coordinates
                }
            };
};

/**
 * Process value so that it can be used in an URL.
 * @param {String} value Value to use to format.
 * @return {String} Stringified JSON that can be used to pass parameter value in URL.
 */
PointParameter.formatValueForUrl = function(value) {
    const coordinates = [
        CesiumMath.toDegrees(value.longitude),
        CesiumMath.toDegrees(value.latitude),
    ];

    if (defined(value.height)) {
        coordinates.push(value.height);
    }

    return JSON.stringify({
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': coordinates
                }
            }
        ]
    });
};


PointParameter.formatValueAsString = PointParameter.prototype.formatValueAsString;
PointParameter.getGeoJsonFeature = PointParameter.prototype.getGeoJsonFeature;
module.exports = PointParameter;

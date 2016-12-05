'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defined = require('terriajs-cesium/Source/Core/defined');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var EllipsoidGeodesic = require('terriajs-cesium/Source/Core/EllipsoidGeodesic.js');

/**
 * A parameter that specifies a line on the globe.
 *
 * @alias LineParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter. If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {Boolean} [options.defaultValue] The default value.
 */
var LineParameter = function(options) {
    FunctionParameter.call(this, options);
};

inherit(FunctionParameter, LineParameter);

defineProperties(LineParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof LineParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'line';
        }
    }

    /**
     * Gets or sets the value of this parameter.
     * @memberof LineParameter.prototype
     * @member {Number[][]} value
     */
});

/**
 * Represents value as string.
 * @param {Object} value Value to format as string.
 * @return {String} String representing value.
 */
LineParameter.prototype.formatValueAsString = function(value) {
    value = defaultValue(value, this.value);
    if (!defined(value)) {
        return '-';
    }

    let line = '';
    for (let i = 0; i < value.length; i++) {
        line += '[' + value[i][0].toFixed(3) + ', ' + value[i][1].toFixed(3) + ']';
        if (i !== value.length - 1) {
            line += ', ';
        }
    }
    if (line.length > 0) {
        return line;
    } else {
        return '';
    }
};

/**
 * Represents value as WKT linestring.
 * @param {Object} value Value to format as string.
 * @return {String} String representing value.
 */
LineParameter.prototype.formatValueAsLinestring = function(value) {
    value = defaultValue(value, this.value);

    let linestring = 'LINESTRING(';
    for (let i = 0; i < value.length; i++) {
        linestring += value[i][0] + ' ' + value[i][1];
        if (i !== value.length - 1) {
            linestring += ',';
        }
    }
    linestring += ')';
    return linestring;
};

/**
 * Get length of line.
 * @param {Object} value Value of line to measure.
 * @return {Number} Length of line.
 */
LineParameter.prototype.getLineDistance = function(value) {
    value = defaultValue(value, this.value);
    var totalLength = 0;
    var prevPoint = new Cartesian3(value[0][0], value[0][1]);
    for (let i = 1; i < value.length; i++) {
        var currentPoint = new Cartesian3(value[i][0], value[i][1]);
        const prevPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(prevPoint);
        const currentPointCartogrphic = Ellipsoid.WGS84.cartesianToCartographic(currentPoint);
        const geodesic = new EllipsoidGeodesic(prevPointCartographic, currentPointCartogrphic);
        totalLength += geodesic.surfaceDistance;
        prevPoint = currentPoint;
    }
    return totalLength;
};

/**
 * Get feature as geojson for display on map.
 * @param {Object} value Value to use.
 * @return GeoJson object.
 */
LineParameter.prototype.getGeoJsonFeature = function(value) {
    value = defaultValue(value, this.value);

    return {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: value
                }
            };
};

LineParameter.formatValueAsString = LineParameter.prototype.formatValueAsString;
LineParameter.getGeoJsonFeature = LineParameter.prototype.getGeoJsonFeature;
module.exports = LineParameter;

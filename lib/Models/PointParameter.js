'use strict';

/*global require*/
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');

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

    this.defaultValue = options.defaultValue;
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
    },
});

PointParameter.prototype.formatValueAsString = function(value) {
    if (!defined(value)) {
        return '-';
    }

    return Math.abs(CesiumMath.toDegrees(value.latitude)) + '°' + (value.latitude < 0 ? 'S ' : 'N ') +
           Math.abs(CesiumMath.toDegrees(value.longitude)) + '°' + (value.longitude < 0 ? 'W' : 'E');
};

module.exports = PointParameter;

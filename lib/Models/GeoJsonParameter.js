'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defined = require('terriajs-cesium/Source/Core/defined');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');

/**
 * A parameter that specifies an arbitrary polygon on the globe.
 *
 * @alias GeoJsonParameter
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
var GeoJsonParameter = function(options) {
    FunctionParameter.call(this, options);
    this.regionParameter = options.regionParameter;
    this.value = "";
    this.processedValue = "";
};

inherit(FunctionParameter, GeoJsonParameter);

defineProperties(GeoJsonParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof GeoJsonParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'geojson';
        }
    },

    /**
     * Gets or sets the value of this parameter.
     * @memberof GeoJsonParameter.prototype
     * @member {Cartographic} value // TODO is this true?
     */
});

GeoJsonParameter.prototype._load = function() {
    return this.regionParameter.regionTypeParameter._load();
};

GeoJsonParameter.prototype.formatValueAsString = function(value) {
    if (!defined(value)) {
        return '-';
    }

    // TODO
    return value;
};

module.exports = GeoJsonParameter;

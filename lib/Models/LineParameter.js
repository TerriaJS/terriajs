'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defined = require('terriajs-cesium/Source/Core/defined');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');

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

LineParameter.prototype.formatValueAsString = function(value) {
    var val = defined(value) ? value : this.value;
    if (!defined(val)) {
        return '-';
    }

    let line = '';
    for (let i = 0; i < val.length; i++) {
        line += '[' + val[i][0].toFixed(3) + ', ' + val[i][1].toFixed(3) + ']';
        if (i !== val.length - 1) {
            line += ', ';
        }
    }
    if (line.length > 0) {
        return line;
    } else {
        return '';
    }
};

LineParameter.prototype.getGeoJsonFeature = function(value) {
    var val = defined(value) ? value : this.value;

    return {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: val
                }
            };
};

module.exports = LineParameter;

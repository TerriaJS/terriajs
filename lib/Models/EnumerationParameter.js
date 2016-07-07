'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');

/**
 * A parameter that specifies a single value from a set of possible values.
 *
 * @alias EnumerationParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {String[]} [options.possibleValues] The possible values of this parameter.
 * @param {Boolean} [options.defaultValue] The default value.  If not specified, the first possible value is the default.
 */
var EnumerationParameter = function(options) {
    FunctionParameter.call(this, options);

    this.possibleValues = defaultValue(options.possibleValues, []).slice();
};

inherit(FunctionParameter, EnumerationParameter);

defineProperties(EnumerationParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof EnumerationParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'enumeration';
        }
    },
});

module.exports = EnumerationParameter;

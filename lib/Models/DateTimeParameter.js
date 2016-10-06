'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');

/**
 * A parameter that specifies a date/time.
 *
 * @alias DateTimeParameter
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
var DateTimeParameter = function(options) {
    FunctionParameter.call(this, options);
};

inherit(FunctionParameter, DateTimeParameter);

defineProperties(DateTimeParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof DateTimeParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'dateTime';
        }
    },
});

module.exports = DateTimeParameter;

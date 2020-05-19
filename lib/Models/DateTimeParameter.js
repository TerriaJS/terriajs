"use strict";

/*global require*/

var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");

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

Object.defineProperties(DateTimeParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof DateTimeParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "dateTime";
    }
  }

  /**
   * Gets or sets the value of this parameter.  The value is a date/time string in ISO8601 format.
   * @memberof DateTimeParameter.prototype
   * @member {String} value
   */
});

/**
 * Process value so that it can be used in an URL.
 * @param {String} value Value to use to format.
 * @return {String} Stringified JSON that can be used to pass parameter value in URL.
 */
DateTimeParameter.formatValueForUrl = function(value) {
  return JSON.stringify({
    type: "object",
    properties: {
      timestamp: {
        type: "string",
        format: "date-time",
        "date-time": value
      }
    }
  });
};

module.exports = DateTimeParameter;

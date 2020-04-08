"use strict";

/*global require*/

var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");

/**
 * A parameter that specifies a true or false value.
 *
 * @alias BooleanParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {String} [options.trueName] The name for the "true" value of the boolean parameter.
 * @param {String} [options.trueDescription] The description for the "true" value of the boolean parameter.
 * @param {String} [options.falseName] The name for the "false" value of the boolean parameter.
 * @param {String} [options.falseDescription] The description for the "false" value of the boolean parameter.
 * @param {Boolean} [options.defaultValue=false] The default value.
 */
var BooleanParameter = function(options) {
  FunctionParameter.call(this, options);

  this.trueName = options.trueName;
  this.trueDescription = options.trueDescription;
  this.falseName = options.falseName;
  this.falseDescription = options.falseDescription;
};

inherit(FunctionParameter, BooleanParameter);

Object.defineProperties(BooleanParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof BooleanParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "boolean";
    }
  },

  /**
   * Gets a value indicating whether this parameter has names for its "true" and "false" states.
   * @memberof EnumerationParameter.prototype
   * @type {Object}
   */
  hasNamedStates: {
    get: function() {
      return this.trueName && this.falseName;
    }
  }

  /**
   * Gets or sets the value of this parameter.
   * @memberof BooleanParameter.prototype
   * @member {Boolean} value
   */
});

module.exports = BooleanParameter;

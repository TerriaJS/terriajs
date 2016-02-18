'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

/**
 * A parameter to a {@link CatalogFunction}.
 *
 * @alias FunctionParameter
 * @constructor
 * @abstract
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 */
var FunctionParameter = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    if (!defined(options.id)) {
        throw new DeveloperError('options.id is required.');
    }

    this._terria = options.terria;
    this._id = options.id;

    /**
     * Gets or sets the name of the parameter.
     * @type {String}
     */
    this.name = defaultValue(options.name, options.id);

    /**
     * Gets or sets the description of the parameter.
     * @type {String}
     */
    this.description = options.description;

    /**
     * A converter that can be used to convert this parameter for use with a {@link CatalogFunction}.
     * The actual type and content of this property is defined by the catalog function.
     * @type {Any}
     */
    this.converter = undefined;
};

defineProperties(FunctionParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof FunctionParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            throw new DeveloperError('FunctionParameter.type must be overridden in derived classes.');
        }
    },

    /**
     * Gets the Terria instance associated with this parameter.
     * @memberof FunctionParameter.prototype
     * @type {Terria}
     */
    terria: {
        get: function() {
            return this._terria;
        }
    },

    /**
     * Gets the ID of the parameter.
     * @memberof FunctionParameter.prototype
     * @type {String}
     */
    id: {
        get: function() {
            return this._id;
        }
    }
});

FunctionParameter.prototype.formatValueAsString = function(value) {
    return defined(value) ? value.toString() : '-';
};

module.exports = FunctionParameter;

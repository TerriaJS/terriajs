'use strict';

/*global require*/
var arraysAreEqual = require('../Core/arraysAreEqual');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var runLater = require('../Core/runLater');

/**
 * A parameter to a {@link CatalogFunction}.
 *
 * @alias FunctionParameter
 * @constructor
 * @abstract
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {CatalogFunction} options.catalogFunction The function that this is a parameter to.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {Boolean} [options.isRequired] True if this parameter is required, false if it is optional.
 * @param {Object} [options.value] The initial value of the parameter.
 */
var FunctionParameter = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    if (!defined(options.catalogFunction)) {
        throw new DeveloperError('options.catalogFunction is required.');
    }

    if (!defined(options.id)) {
        throw new DeveloperError('options.id is required.');
    }

    this._terria = options.terria;
    this._catalogFunction = options.catalogFunction;
    this._id = options.id;

    this._loadingPromise = undefined;
    this._lastLoadInfluencingValues = undefined;

    /**
     * Gets or sets a value indicating whether the parameter is currently loading.  This property
     * is observable.
     * @type {Boolean}
     */
    this.isLoading = false;

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
     * Gets or sets a value indicating whether this parameter is required.
     * @type {Boolean}
     * @default false
     */
    this.isRequired = defaultValue(options.isRequired, false);

    /**
     * A converter that can be used to convert this parameter for use with a {@link CatalogFunction}.
     * The actual type and content of this property is defined by the catalog function.
     * @type {Any}
     */
    this.converter = undefined;

    this._defaultValue = options.defaultValue;
    this._value = options.value;

    knockout.track(this, ['_value']);
};

FunctionParameter.defaultValueGetter = function() {
    if (!defined(this._value)) {
        return this.defaultValue;
    }
    return this._value;
};

FunctionParameter.defaultValueSetter = function(value) {
    this._value = value;
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
     * Gets the function to which this is a parameter.
     * @memberof FunctionParameter.prototype
     * @type {CatalogFunction}
     */
    catalogFunction: {
        get: function() {
            return this._catalogFunction;
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
    },

    /**
     * Gets the default value for this parameter, or undefined if there is no default value.
     * @memberof FunctionParameter.prototype
     */
    defaultValue: {
        get: function() {
            return this._defaultValue;
        }
    },

    /**
     * Gets or sets the current value of this parameter.
     * @memberof FunctionParameter.prototype
     */
    value: {
        get: FunctionParameter.defaultValueGetter,
        set: FunctionParameter.defaultValueSetter
    }
});

FunctionParameter.prototype.load = function() {
    if (!defined(this._load)) {
        // No loading required.
        return undefined;
    }

    if (defined(this._loadingPromise)) {
        // Load already in progress.
        return this._loadingPromise;
    }

    var loadInfluencingValues = [];
    if (defined(this._getValuesThatInfluenceLoad)) {
        loadInfluencingValues = this._getValuesThatInfluenceLoad();
    }

    if (arraysAreEqual(loadInfluencingValues, this._lastLoadInfluencingValues)) {
        // Already loaded, and nothing has changed to force a re-load.
        return undefined;
    }

    this.isLoading = true;

    var that = this;
    this._loadingPromise = runLater(function() {
        that._lastLoadInfluencingValues = [];
        if (defined(that._getValuesThatInfluenceLoad)) {
            that._lastLoadInfluencingValues = that._getValuesThatInfluenceLoad();
        }

        return that._load();
    }).then(function() {
        that._loadingPromise = undefined;
        that.isLoading = false;
    }).otherwise(function(e) {
        that._lastLoadInfluencingValues = undefined;
        that._loadingPromise = undefined;
        that.isLoading = false;
        throw e;
    });

    return this._loadingPromise;
};

/**
 * Represents value as string.
 * @param {Object} value Value to format as string.
 * @return {String} String representing value.
 */
FunctionParameter.prototype.formatValueAsString = function(value) {
    value = defaultValue(value, this._value);
    return defined(value) ? value.toString() : '-';
};

module.exports = FunctionParameter;

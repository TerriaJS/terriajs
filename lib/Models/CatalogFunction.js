'use strict';

/*global require*/
var arraysAreEqual = require('../Core/arraysAreEqual');
var CatalogItem = require('./CatalogItem');
var CatalogMember = require('./CatalogMember');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var runLater = require('../Core/runLater');

/**
 * A member of a catalog that does some kind of parameterized processing or analysis.
 *
 * @alias CatalogFunction
 * @constructor
 * @extends CatalogMember
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var CatalogFunction = function(terria) {
    CatalogMember.call(this, terria);

    this._loadingPromise = undefined;
    this._lastLoadInfluencingValues = undefined;

    /**
     * Gets or sets a value indicating whether the group is currently loading.  This property
     * is observable.
     * @type {Boolean}
     */
    this.isLoading = false;

    knockout.track(this, ['isLoading']);
};

inherit(CatalogMember, CatalogFunction);

defineProperties(CatalogFunction.prototype, {
    /**
     * Gets a value indicating whether this catalog member can show information.  If so, an info icon will be shown next to the item
     * in the data catalog.
     * @memberOf CatalogFunction.prototype
     * @type {Boolean}
     */
    showsInfo : {
        get : function() {
            return true;
        }
    },

    /**
     * Gets the parameters used to {@link CatalogFunction#invoke} to this process.
     * @memberOf CatalogFunction
     * @type {CatalogFunctionParameters[]}
     */
    parameters : {
        get : function() {
            throw new DeveloperError('parameters must be implemented in the derived class.');
        }
    },

    /**
     * Gets the metadata associated with this data item and the server that provided it, if applicable.
     * @memberOf CatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            return CatalogItem.defaultMetadata;
        }
    }
});

/**
 * Loads this function, if it's not already loaded.  It is safe to
 * call this method multiple times.  The {@link CatalogFunction#isLoading} flag will be set while the load is in progress.
 * Derived classes should implement {@link CatalogFunction#_load} to perform the actual loading for the function.
 * Derived classes may optionally implement {@link CatalogFunction#_getValuesThatInfluenceLoad} to provide an array containing
 * the current value of all properties that influence this function's load process.  Each time that {@link CatalogFunction#load}
 * is invoked, these values are checked against the list of values returned last time, and {@link CatalogFunction#_load} is
 * invoked again if they are different.  If {@link CatalogFunction#_getValuesThatInfluenceLoad} is undefined or returns an
 * empty array, {@link CatalogFunction#_load} will only be invoked once, no matter how many times
 * {@link CatalogFunction#load} is invoked.
 *
 * @returns {Promise} A promise that resolves when the load is complete, or undefined if the function is already loaded.
 *
 */
CatalogFunction.prototype.load = function() {
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
 * Invokes the process.
 * @param {Object} parameters The parameters to the process.  Each required parameter in {@link CatalogFunction#parameters} must have a corresponding key in this object.
 * @return {AsyncProcessResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
CatalogFunction.prototype.invoke = function(parameters) {
    throw new DeveloperError('invoke must be implemented in the derived class.');
};

module.exports = CatalogFunction;

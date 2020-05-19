"use strict";

/*global require*/
var arraysAreEqual = require("../Core/arraysAreEqual");
var CatalogItem = require("./CatalogItem");
var CatalogMember = require("./CatalogMember");
var clone = require("terriajs-cesium/Source/Core/clone").default;
var createCatalogMemberFromType = require("./createCatalogMemberFromType");
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var inherit = require("../Core/inherit");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var runLater = require("../Core/runLater");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

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
  this._parameters = [];

  /**
   * Gets or sets a value indicating whether the group is currently loading.  This property
   * is observable.
   * @type {Boolean}
   */
  this.isLoading = false;

  /**
   * A catalog item that will be enabled while preparing to invoke this catalog function, in order to
   * provide context for the function.
   * @type {CatalogItem}
   */
  this.contextItem = undefined;

  knockout.track(this, ["isLoading"]);
};

inherit(CatalogMember, CatalogFunction);

Object.defineProperties(CatalogFunction.prototype, {
  /**
   * Gets a value indicating whether this catalog member can show information.  If so, an info icon will be shown next to the item
   * in the data catalog.
   * @memberOf CatalogFunction.prototype
   * @type {Boolean}
   */
  showsInfo: {
    get: function() {
      return true;
    }
  },

  /**
   * Gets the parameters used to {@link CatalogFunction#invoke} to this process.
   * @memberOf CatalogFunction
   * @type {CatalogFunctionParameters[]}
   */
  parameters: {
    get: function() {
      throw new DeveloperError(
        "parameters must be implemented in the derived class."
      );
    }
  },

  /**
   * Gets the metadata associated with this data item and the server that provided it, if applicable.
   * @memberOf CatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      return CatalogItem.defaultMetadata;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf CatalogFunction.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return CatalogFunction.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf CatalogFunction.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return CatalogFunction.defaultSerializers;
    }
  },

  /**
   * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
   * for a share link.
   * @memberOf ImageryLayerCatalogItem.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return CatalogFunction.defaultPropertiesForSharing;
    }
  }
});

CatalogFunction.defaultUpdaters = clone(CatalogMember.defaultUpdaters);

CatalogFunction.defaultUpdaters.contextItem = function(
  catalogFunction,
  json,
  propertyName,
  options
) {
  var itemJson = json[propertyName];
  var itemObject = (catalogFunction.contextItem = createCatalogMemberFromType(
    itemJson.type,
    catalogFunction.terria
  ));
  return itemObject.updateFromJson(itemJson, options);
};

Object.freeze(CatalogFunction.defaultUpdaters);

CatalogFunction.defaultSerializers = clone(CatalogMember.defaultSerializers);

CatalogFunction.defaultSerializers.contextItem = function(
  catalogFunction,
  json,
  propertyName,
  options
) {
  if (defined(catalogFunction.contextItem)) {
    json[propertyName] = catalogFunction.contextItem.serializeToJson(options);
  }
};

Object.freeze(CatalogFunction.defaultSerializers);

CatalogFunction.defaultPropertiesForSharing = clone(
  CatalogMember.defaultPropertiesForSharing
);

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

    // Load the catalog function itself
    return when(that._load()).then(function(loadResult) {
      // And then load all the parameters.
      return when
        .all(that.parameters.map(parameter => parameter.load()))
        .then(function() {
          // And then return the result of the catalog function load.
          return loadResult;
        });
    });
  })
    .then(function() {
      that._loadingPromise = undefined;
      that.isLoading = false;
    })
    .otherwise(function(e) {
      that._lastLoadInfluencingValues = undefined;
      that._loadingPromise = undefined;
      that.isLoading = false;
      throw e;
    });

  return this._loadingPromise;
};

/**
 * Invokes the function.
 * @return {AsyncProcessResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
CatalogFunction.prototype.invoke = function() {
  throw new DeveloperError("invoke must be implemented in the derived class.");
};

/**
 * Gets the current parameters to this function.
 * @return {Object} An object with a property for each parameter.  The property name is the `id` of the
 *                  parameter and the property value is the value of that parameter.
 */
CatalogFunction.prototype.getParameterValues = function() {
  var result = {};

  this.parameters.forEach(function(parameter) {
    result[parameter.id] = parameter.value;
  });

  return result;
};

/**
 * Sets the current parameters to this function.
 * @param {Object} parameterValues An object describing the parameters to set and their values.  Each property name
 *                 in this object corresponds to the `id` of a parameter, and the value of that property is the new
 *                 value for the parameter.  If there is no parameter corresponding to a property in this object, that
 *                 property is silently ignored.
 */
CatalogFunction.prototype.setParameterValues = function(parameterValues) {
  Object.keys(parameterValues).forEach(function(id) {
    var parameter = this.parameters.filter(p => p.id === id)[0];
    if (defined(parameter)) {
      parameter.value = parameterValues[id];
    }
  });
};

module.exports = CatalogFunction;

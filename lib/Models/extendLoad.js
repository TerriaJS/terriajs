"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Extends a catalog member's `load` method with another, potentially asynchronous.
 * load function.  The catalog member will not be fully loaded until both the original
 * and the new load return and their promises resolve.
 * @param {CatalogMember} catalogMember The catalog member for which to extend the loading process.
 * @param {Function} f The additional load function.  This function will be called with `this` set to the `catalogMember`.
 */
var extendLoad = function(catalogMember, f) {
  var originalLoad = catalogMember._load;

  catalogMember._load = function() {
    var originalResult = originalLoad.call(this);
    if (defined(originalResult)) {
      return originalResult.then(f.bind(this));
    } else {
      return f.call(this);
    }
  };
};

module.exports = extendLoad;

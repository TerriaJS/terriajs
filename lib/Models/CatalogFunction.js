'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var CatalogMember = require('./CatalogMember');
var inherit = require('../Core/inherit');

var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

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
 * Invokes the process.
 * @param {Object} parameters The parameters to the process.  Each required parameter in {@link CatalogFunction#parameters} must have a corresponding key in this object.
 * @return {AsyncProcessResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
CatalogFunction.prototype.invoke = function(parameters) {
    throw new DeveloperError('invoke must be implemented in the derived class.');
};

module.exports = CatalogFunction;

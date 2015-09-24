'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');

var WhyAmISpecialFunction = function(terria) {
    CatalogFunction.call(this, terria);
};

inherit(CatalogFunction, WhyAmISpecialFunction);

defineProperties(WhyAmISpecialFunction.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf WhyAmISpecialFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'why-am-i-special-function';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Why Am I Special?'.
     * @memberOf WhyAmISpecialFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Why Am I Special?';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogProcess#invoke} to this process.
     * @memberOf WhyAmISpecialFunction
     * @type {CatalogProcessParameters[]}
     */
    parameters : {
        get : function() {
            return [];
        }
    }
});

/**
 * Invokes the process.
 * @param {Object} parameters The parameters to the process.  Each required parameter in {@link CatalogProcess#parameters} must have a corresponding key in this object.
 * @return {AsyncProcessResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
WhyAmISpecialFunction.prototype.invoke = function(parameters) {
};

module.exports = WhyAmISpecialFunction;

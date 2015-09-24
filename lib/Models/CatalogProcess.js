'use strict';

/*global require*/
var CatalogMember = require('./CatalogMember');
var inherit = require('../Core/inherit');

var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

/**
 * A member of a catalog that does some kind of parameterized processing or analysis.
 *
 * @alias CatalogProcess
 * @constructor
 * @extends CatalogMember
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var CatalogProcess = function(terria) {
    CatalogMember.call(this, terria);
};

inherit(CatalogMember, CatalogProcess);

defineProperties(CatalogProcess.prototype, {
    /**
     * Gets the parameters used to {@link CatalogProcess#invoke} to this process.
     * @type {CatalogProcessParameters[]}
     */
    parameters : {
        get : function() {
            throw new DeveloperError('parameters must be implemented in the derived class.');
        }
    }
});

/**
 * Invokes the process.
 * @param {Object} parameters The parameters to the process.  Each required parameter in {@link CatalogProcess#parameters} must have a corresponding key in this object.
 * @return {AsyncProcessResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
CatalogProcess.prototype.invoke = function(parameters) {
    throw new DeveloperError('invoke must be implemented in the derived class.');
};

module.exports = CatalogProcess;

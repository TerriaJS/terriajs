'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');

var WhyAmISpecialFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.name = "Why is a given region unique or special?";
    this.description = "Determines the characteristics by which a particular region is _most different_ from all other regions.";
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
     * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
     * @memberOf WhyAmISpecialFunction
     * @type {CatalogProcessParameters[]}
     */
    parameters : {
        get : function() {
            return [
                {
                    id: "regionType",
                    name: "Region Type",
                    description: "The type of region to analyze.",
                    type: "regionType"
                },
                {
                    id: "region",
                    name: "Region",
                    description: "The region to analyze.  The analysis will determine the characteristics by which this region is most different from all others.",
                    type: "region",
                    regionType: {
                        parameter: "regionType"
                    }
                },
                {
                    id: "includeBasicCommunityProfile",
                    name: "Include characteristics from the Basic Community Profile",
                    description: "Whether to include the characteristics in the Basic Community Profile of the most recent Census among the characteristics to analyze.",
                    type: "bool",
                    defaultValue: true
                },
                {
                    id: "data",
                    name: "Additional Characteristics",
                    description: "Additional region characteristics to include in the analysis.",
                    type: "regionData",
                    regionType: {
                        parameter: "regionType"
                    }
                }
            ];
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

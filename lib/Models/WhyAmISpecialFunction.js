'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var RegionDataParameter = require('./RegionDataParameter');
var RegionParameter = require('./RegionParameter');
var RegionTypeParameter = require('./RegionTypeParameter');

var WhyAmISpecialFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.url = undefined;
    this.name = "What makes this region unique or special?";
    this.description = "Determines the characteristics by which a particular region is _most different_ from all other regions.";

    this._regionTypeParameter = new RegionTypeParameter({
        terria: this.terria,
        id: 'regionType',
        name: 'Region Type',
        description: 'The type of region to analyze.'
    });

    this._regionParameter = new RegionParameter({
        terria: this.terria,
        id: 'region',
        name: 'Region',
        description: 'The region to analyze.  The analysis will determine the characteristics by which this region is most different from all others.',
        regionProvider: this._regionTypeParameter
    });

    this._dataParameter = new RegionDataParameter({
        terria: this.terria,
        id: 'data',
        name: 'Characteristics',
        description: "The region characteristics to include in the analysis.",
        regionProvider: this._regionTypeParameter
    });

    this._parameters = [
        this._regionTypeParameter,
        this._regionParameter,
        this._dataParameter
    ];
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
            return this._parameters;
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
    var data = this._dataParameter.getValue(parameters);

    var request = {
        algorithm: 'whyamispecial',
        boundaries_name: parameters.regionType.regionType,
        region_codes: data.regionCodes,
        columns: data.columnHeadings,
        table: data.table,
        parameters: {
            query: parameters.region.id,
            param2: 0.5
        }
    };

    return loadWithXhr({
        url: this.url,
        method: 'POST',
        data: JSON.stringify(request)
    }).then(function(response) {
        console.log(response);
    });
};

module.exports = WhyAmISpecialFunction;

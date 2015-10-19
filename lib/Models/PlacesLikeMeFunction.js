'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var PlacesLikeMeAsyncResultCatalogItem = require('./PlacesLikeMeAsyncResultCatalogItem');
var RegionDataParameter = require('./RegionDataParameter');
var RegionParameter = require('./RegionParameter');
var RegionTypeParameter = require('./RegionTypeParameter');

var PlacesLikeMeFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.url = undefined;
    this.name = "Regions like this";
    this.description = "Identifies regions that are _most like_ a given region according to a given set of characteristics.";

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
        description: 'The region to analyze.  The analysis will determine which regions are most similar to this one.',
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

inherit(CatalogFunction, PlacesLikeMeFunction);

defineProperties(PlacesLikeMeFunction.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf PlacesLikeMeFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'places-like-me-function';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Spatial Detailing'.
     * @memberOf PlacesLikeMeFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Places Like Me';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
     * @memberOf PlacesLikeMeFunction
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
 * @return {AsyncFunctionResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
PlacesLikeMeFunction.prototype.invoke = function(parameters) {
    var data = this._dataParameter.getValue(parameters);

    var request = {
        algorithm: 'placeslikeme',
        boundaries_name: parameters.regionType.regionType,
        region_codes: data.regionCodes,
        columns: data.columnHeadings,
        table: data.table,
        parameters: {
            query: parameters.region.id
        }
    };

    var that = this;
    return loadWithXhr({
        url: this.url,
        method: 'POST',
        data: JSON.stringify(request)
    }).then(function(response) {
        var json = JSON.parse(response);
        var result = new PlacesLikeMeAsyncResultCatalogItem(that, data.regionCodes, parameters, json.status_uri, json.uri);
        result.isEnabled = true;
    });
};

module.exports = PlacesLikeMeFunction;

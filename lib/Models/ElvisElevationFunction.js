'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var ResultPendingCatalogItem = require('./ResultPendingCatalogItem');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var inherit = require('../Core/inherit');
var LineParameter = require('./LineParameter');
var ElvisElevationCatalogItem = require('./ElvisElevationCatalogItem');
var sprintf = require('terriajs-cesium/Source/ThirdParty/sprintf');
var Mustache = require('mustache');
var inputsTableTemplate = require('./ElvisElevationInputsTableTemplate.xml');

/**
 * Uses Geoscience Australia's ELVIS (Elevation Information System) as a backend service to retrieve elevation and
 * water table data for points along a user-defined line. See http://www.ga.gov.au/elvis/ for more details.
 *
 * @alias ElvisElevationFunction
 * @constructor
 * @extends CatalogFunction
 *
 * @param {Terria} terria The Terria instance.
 */
var ElvisElevationFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.url = undefined;
    this.name = 'Get an elevation profile along a line';
    this.description = 'Geoscience Australia provides digital elevation data under the National Elevation Data Framework (NEDF). Digital elevation data maps the height of Australia\'s landforms and seabeds for a wide range of purposes. This service uses Geoscience Australia\'s ELVIS (Elevation Information System) to plot height points along a user-defined line, showing elevation along the line, both as a 3D line in the viewport and also charted against distance along the line. If water table information is available, that is also charted. For more information, please see http://www.ga.gov.au/scientific-topics/national-location-information/digital-elevation-data. To download the data, go to http://www.ga.gov.au/elvis/.';

    this._lineParameter = new LineParameter({
        terria: this.terria,
        catalogFunction: this,
        id: 'line',
        name: 'Line',
        description: 'The line for which to display elevation.'
    });

    this._parameters = [
        this._lineParameter
    ];
};

inherit(CatalogFunction, ElvisElevationFunction);

defineProperties(ElvisElevationFunction.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf ElvisElevationFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'elevation-function';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Elevation'
     * @memberOf ElvisElevationFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Elevation';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
     * @memberOf ElvisElevationFunction
     * @type {CatalogProcessParameters[]}
     */
    parameters : {
        get : function() {
            return this._parameters;
        }
    }
});

ElvisElevationFunction.prototype._load = function() {
};

/**
 * Invokes the function.
 * @return {ResultPendingCatalogItem} The result of invoking this process. Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
ElvisElevationFunction.prototype.invoke = function() {
    var lineString = this._lineParameter.formatValueAsLinestring();
    var count = 500;
    var distance = this._lineParameter.getLineDistance();

    var request = {
        wkt: lineString,
        count: count,
        distance: distance
    };

    var proxiedUrl = this.terria.corsProxy.getURLProxyIfNecessary(this.url);
    var proxiedUrlElevation = proxiedUrl + 'elevation';
    var proxiedUrlWater = proxiedUrl + 'waterTable';
    var asyncResult = new ResultPendingCatalogItem(this.terria);
    // Create a catalog item to track the progress of this service invocation.
    var now = new Date();
    var timestamp = sprintf('%02d:%02d:%02d', now.getHours(), now.getMinutes(), now.getSeconds());
    asyncResult.name = "ELVIS Elevation Function " + timestamp;
    asyncResult.description = 'Geoscience Australia\'s ELVIS (Elevation Information System) was invoked, providing a preview of elevation along a path, along with water table data if available. To download the elevation datasets, go to http://www.ga.gov.au/elvis. Function invoked with parameters:';

    var inputsSection = Mustache.render(inputsTableTemplate, {lineString: lineString, count: count, distance: distance});

    asyncResult.info.push({
        name: 'Inputs',
        content: inputsSection
    });

    // Invoke the service
    var that = this;
    var elevationPromise = loadWithXhr({
        url: proxiedUrlElevation,
        method: 'POST',
        headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json;charset=UTF-8',
            Origin: 'http://www.ga.gov.au'
        },
        preferText: true,
        data: JSON.stringify(request)
    }).then(function(elevationResponse) {
        var elevationJson = JSON.parse(elevationResponse);
        var resultCatalogItem = new ElvisElevationCatalogItem(that.terria);
        resultCatalogItem.name = asyncResult.name;
        resultCatalogItem.description = asyncResult.description;
        resultCatalogItem.parameters = that.parameters;
        resultCatalogItem.elevationResult = elevationJson;
        resultCatalogItem.chartName = "ELVIS " + timestamp;

        // We may also be able to retrieve water table data. Give it a try; if it doesn't work, show only elevation.
        loadWithXhr({
            url: proxiedUrlWater,
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            preferText: true,
            data: JSON.stringify(request)
        }).then(function(response) {
            var waterJson = JSON.parse(response);
            resultCatalogItem.waterResult = waterJson;
            asyncResult.isEnabled = false;
            resultCatalogItem.isEnabled = true;

        }).otherwise(function() {
            // Nope, couldn't retrieve water data.
            asyncResult.isEnabled = false;
            resultCatalogItem.isEnabled = true;
        });
    }).otherwise(function() {
        asyncResult.isFailed = true;
        asyncResult.shortReport = 'Elevation invocation failed.';
    });

    asyncResult.loadPromise = elevationPromise;
    asyncResult.isEnabled = true;
};

module.exports = ElvisElevationFunction;

'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var ResultPendingCatalogItem = require('./ResultPendingCatalogItem');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var inherit = require('../Core/inherit');
var LineParameter = require('./LineParameter');
var ElevationCatalogItem = require('./ElevationCatalogItem');
var sprintf = require('terriajs-cesium/Source/ThirdParty/sprintf');

var ElevationFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.url = undefined;
    this.name = 'Get an elevation profile along a line';
    this.description = 'Draw a line, and see the elevation along that line.';

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

inherit(CatalogFunction, ElevationFunction);

defineProperties(ElevationFunction.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf ElevationFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'elevation-function';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Elevation'
     * @memberOf ElevationFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Elevation';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
     * @memberOf ElevationFunction
     * @type {CatalogProcessParameters[]}
     */
    parameters : {
        get : function() {
            return this._parameters;
        }
    }
});

ElevationFunction.prototype._load = function() {
};

/**
 * Invokes the function.
 * @return {ResultPendingCatalogItem} The result of invoking this process. Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
ElevationFunction.prototype.invoke = function() {
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
    asyncResult.name = "Elevation Function " + timestamp;
    asyncResult.description = 'Invoked elevation function with parameters below';

    var inputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
          '<tr>' +
            '<td style="vertical-align: middle">line</td>' +
            '<td>' + lineString + '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="vertical-align: middle">count</td>' +
            '<td>' + count + '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="vertical-align: middle">distance</td>' +
            '<td>' + distance + '</td>' +
          '</tr>' +
        '</table>';

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
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        preferText: true,
        data: JSON.stringify(request)
    }).then(function(elevationResponse) {
        var elevationJson = JSON.parse(elevationResponse);
        var resultCatalogItem = new ElevationCatalogItem(that.terria);
        resultCatalogItem.name = asyncResult.name;
        resultCatalogItem.description = asyncResult.description;
        resultCatalogItem.parameters = that.parameters;
        resultCatalogItem.elevationResult = elevationJson;
        resultCatalogItem.chartName = "EF " + timestamp;

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

module.exports = ElevationFunction;

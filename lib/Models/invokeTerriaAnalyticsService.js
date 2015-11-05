'use strict';

/*global require*/
var AsyncFunctionResultCatalogItem = require('./AsyncFunctionResultCatalogItem');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var runLater = require('../Core/runLater');

var invokeTerriaAnalyticsService = function(terria, name, url, request) {
    // Create a catalog item to track the progress of this service invocation.
    var asyncResult = new AsyncFunctionResultCatalogItem(terria);
    asyncResult.name = name;

    // Invoke the service
    var promise = loadWithXhr({
        url: url,
        method: 'POST',
        data: JSON.stringify(request)
    }).then(function(response) {
        var json = JSON.parse(response);

        // Poll until the invocation is complete.
        return pollForCompletion(json, asyncResult);
    });

    asyncResult.loadPromise = promise;
    asyncResult.isEnabled = true;

    return promise;
};

var pollInterval = 1000;

function pollForCompletion(invocation, invocationCatalogItem) {
    return loadJson(invocation.status_uri).then(function(statusResult) {
        if (statusResult.queueing_status !== 'finished') {
            if (definedNotNull(statusResult.stage_description)) {
                invocationCatalogItem.loadingMessage = statusResult.stage_description;
            }

            // Try again later, if this catalog item is still enabled.
            if (invocationCatalogItem.isEnabled) {
                return runLater(pollForCompletion.bind(undefined, invocation, invocationCatalogItem), pollInterval);
            }
        }

        // Finished!
        return loadJson(invocation.uri).then(function(jobResult) {
            // Remove the temporary catalog item showing invocation progress.
            invocationCatalogItem.isEnabled = false;
            return {
                url: invocation.uri,
                result: jobResult
            };
        });
    });
}

module.exports = invokeTerriaAnalyticsService;

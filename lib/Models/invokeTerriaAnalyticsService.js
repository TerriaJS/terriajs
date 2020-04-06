"use strict";

/*global require*/
var ResultPendingCatalogItem = require("./ResultPendingCatalogItem");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var loadWithXhr = require("../Core/loadWithXhr");
var loadJson = require("../Core/loadJson");
var TerriaError = require("../Core/TerriaError");
var runLater = require("../Core/runLater");
var i18next = require("i18next").default;

var invokeTerriaAnalyticsService = function(terria, name, url, request) {
  // Create a catalog item to track the progress of this service invocation.
  var asyncResult = new ResultPendingCatalogItem(terria);
  asyncResult.name = name;

  var startDate = JulianDate.now();

  // Invoke the service
  var promise = loadWithXhr({
    url: url,
    method: "POST",
    data: JSON.stringify(request)
  }).then(function(response) {
    var json = JSON.parse(response);

    // Poll until the invocation is complete.
    return pollForCompletion(json, asyncResult, startDate);
  });

  asyncResult.loadPromise = promise;
  asyncResult.isEnabled = true;

  return promise;
};

var pollInterval = 1000;

function pollForCompletion(invocation, invocationCatalogItem, startDate) {
  return loadJson(invocation.status_uri).then(function(statusResult) {
    if (statusResult.queueing_status !== "finished") {
      if (defined(statusResult.stage_description)) {
        invocationCatalogItem.loadingMessage = statusResult.stage_description;
      }

      if (statusResult.queueing_status === "failed") {
        throw new TerriaError({
          title: i18next.t(
            "models.invokeAnalyticsService.invocationFailedTitle"
          ),
          message: i18next.t(
            "models.invokeAnalyticsService.invocationFailedMessage",
            { invocationName: invocationCatalogItem.name }
          )
        });
      }

      // Try again later, if this catalog item is still enabled.
      if (invocationCatalogItem.isEnabled) {
        return runLater(
          pollForCompletion.bind(
            undefined,
            invocation,
            invocationCatalogItem,
            startDate
          ),
          pollInterval
        );
      }
    }

    // Finished!
    return loadJson(invocation.uri).then(function(jobResult) {
      // Remove the temporary catalog item showing invocation progress.
      invocationCatalogItem.isEnabled = false;
      return {
        startDate: startDate,
        finishDate: JulianDate.now(),
        url: invocation.uri,
        result: jobResult
      };
    });
  });
}

module.exports = invokeTerriaAnalyticsService;

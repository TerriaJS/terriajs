"use strict";

/*global require*/
var inherit = require("../Core/inherit");
var SearchProviderViewModel = require("./SearchProviderViewModel");
var SearchResultViewModel = require("./SearchResultViewModel");
var zoomRectangleFromPoint = require("../Map/zoomRectangleFromPoint");

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var loadJson = require("../Core/loadJson");
import i18next from "i18next";

var GazetteerSearchProviderViewModel = function(options) {
  SearchProviderViewModel.call(this);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this.terria = options.terria;
  this._geocodeInProgress = undefined;

  this.name = i18next.t("viewModels.searchPlaceNames");
  this.url = defaultValue(
    options.url,
    "http://www.ga.gov.au/gazetteer-search/gazetteer2012/select/"
  );
  this.forceUseOfProxy = defaultValue(options.forceUseOfProxy, true);
  this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
};

inherit(SearchProviderViewModel, GazetteerSearchProviderViewModel);

GazetteerSearchProviderViewModel.prototype.search = function(searchText) {
  if (!defined(searchText) || /^\s*$/.test(searchText)) {
    this.isSearching = false;
    this.searchResults.removeAll();
    return;
  }

  this.isSearching = true;
  this.searchResults.removeAll();
  this.searchMessage = undefined;

  this.terria.analytics.logEvent("search", "gazetteer", searchText);

  // If there is already a search in progress, cancel it.
  if (defined(this._geocodeInProgress)) {
    this._geocodeInProgress.cancel = true;
    this._geocodeInProgress = undefined;
  }

  // I don't know how to get server-side sorting, so we have to retrieve lots of rows, then filter.
  // Retrieving only 10 rows (default) means "Sydney" fails to actually retrieve Sydney...

  // Worth considering using "fq=class_code:(R%20X)", which would only return towns, states etc

  var url = this.url + "?q=name:*" + searchText + "*";
  // filter out bores, built structures, caves, landmarks, trig stations
  url += "%20-class_code:(D%20E%20G%20J%20T)%20-feature_code:PRS";
  url += "&rows=200";

  if (this.forceUseOfProxy || this.terria.corsProxy.shouldUseProxy(url)) {
    url = this.terria.corsProxy.getURL(url);
  }

  var promise = loadJson(url);

  var that = this;
  var geocodeInProgress = (this._geocodeInProgress = promise
    .then(function(solrQueryResponse) {
      if (geocodeInProgress.cancel) {
        return;
      }
      that.isSearching = false;

      if (
        defined(solrQueryResponse.response) &&
        solrQueryResponse.response.numFound > 0
      ) {
        var results = solrQueryResponse.response.docs.sort(function(a, b) {
          return sortResults(a, b, searchText);
        });
        results = stripDuplicates(results);
        results.slice(0, 10).forEach(function(result) {
          var locLat = result.location.split(",")[0];
          var locLng = result.location.split(",")[1];

          that.searchResults.push(
            new SearchResultViewModel({
              name:
                result.name +
                (result.state_id !== "N/A" ? " (" + result.state_id + ")" : ""),
              isImportant: !!result.feature_code.match(
                "^(CNTY|CONT|DI|PRSH|STAT|LOCB|LOCU|SUB|URBN)$"
              ),
              clickAction: createZoomToFunction(that, locLat, locLng),
              location: {
                latitude: locLat,
                longitude: locLng
              }
            })
          );
        });
      } else {
        that.searchMessage = i18next.t("viewModels.searchNoPlaceNames");
      }

      that.isSearching = false;
    })
    .otherwise(function() {
      if (geocodeInProgress.cancel) {
        return;
      }

      that.isSearching = false;
      that.searchMessage = i18next.t("viewModels.searchErrorOccurred");
    }));

  return geocodeInProgress;
};

// Given a list of results sorted in decreasing importance, strip results that are close to another result with the same name
function stripDuplicates(results) {
  var i;
  var placeshash = {};
  var stripped = [];
  for (i = 0; i < results.length; i++) {
    var lat = Number(results[i].location.split(",")[0]).toFixed(1);
    var lng = Number(results[i].location.split(",")[1]).toFixed(1);

    var hash = results[i].name + "_" + lat + " " + lng;
    if (!defined(placeshash[hash])) {
      placeshash[hash] = results[i];
      stripped.push(results[i]);
    }
  }
  return stripped;
}

function featureScore(a, searchText) {
  // could be further refined using http://www.ga.gov.au/image_cache/GA19367.pdf
  // feature_code is defined on p24
  // class_code (A-X) matches a row in the table on p23 (eg, 'C' is 'Bays & Gulfs')
  var featureTypes = [
    "CONT",
    "STAT",
    "URBN",
    "LOCB",
    "LOCU",
    "SUB",
    "DI",
    "CNTY",
    "DI"
  ];
  featureTypes.push(
    "HBR",
    "CAPE",
    "PEN",
    "PT",
    "BAY",
    "PORT",
    "GULF",
    "BGHT",
    "COVE",
    "MT",
    "HILL",
    "PEAK",
    "OCEN",
    "SEA",
    "RESV",
    "LAKE",
    "RES",
    "STRM"
  );
  featureTypes.push("PLN", "REEF", "VAL", "PRSH");

  var aScore = 10000 - (featureTypes.indexOf(a.feature_code) + 1) * 100;
  if (aScore === 10000) {
    aScore = 0;
  }

  if (a.name.toUpperCase() === searchText.toUpperCase()) {
    // Bonus for exact match
    // More testing required to choose this value. Should "Geelong" (parish in Queensland) outrank "North Geelong" (suburb in Vic)?
    aScore += 10 * 100;
  } else if (a.name.match(new RegExp("^" + searchText + "\\b", "i"))) {
    // bonus for first word match ('Steve Bay' better than 'West Steve Bay')
    aScore += 8 * 100;
  } else if (a.name.match(new RegExp("\\b" + searchText + "\\b", "i"))) {
    // bonus for word-boundary match ('Steve' better than 'Steveville')
    aScore += 4 * 100;
  } else if (a.name.match(new RegExp("^" + searchText, "i"))) {
    // bonus for word-boundary match ('Steventon' better than 'Nosteve Town')
    aScore += 2 * 100;
  }
  if (a.state_id === "N/A") {
    // seems to be an indicator of a low quality result
    aScore -= 10 * 100;
  }
  if (a.status === "U") {
    // Not official? H=historical, U=unofficial. Bleh.
    aScore -= 5 * 100;
  }
  if (a.status === "H") {
    aScore -= 10 * 100;
  }

  return aScore;
}

function sortResults(a, b, searchText) {
  return featureScore(b, searchText) - featureScore(a, searchText);
}

function createZoomToFunction(viewModel, locLat, locLng) {
  // Server does not return information of a bounding box, just a location.
  // bboxSize is used to expand a point
  var bboxSize = 0.2;
  var rectangle = zoomRectangleFromPoint(locLat, locLng, bboxSize);

  return function() {
    var terria = viewModel.terria;
    terria.currentViewer.zoomTo(rectangle, viewModel.flightDurationSeconds);
  };
}

module.exports = GazetteerSearchProviderViewModel;

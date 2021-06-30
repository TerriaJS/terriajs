"use strict";

var inherit = require("../Core/inherit");
var SearchProviderViewModel = require("./SearchProviderViewModel");
var SearchResultViewModel = require("../Models/SearchResultViewModel");
var zoomRectangleFromPoint = require("../Map/zoomRectangleFromPoint");
var GnafApi = require("../Models/GnafApi");

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
const i18next = require("i18next").default;

import { Category, SearchAction } from "../Core/AnalyticEvents/analyticEvents";

/**
 * Search provider that uses the Data61 Elastic Search GNAF service to look up addresses.
 *
 * @param options.terria Terria instance
 * @param [options.gnafApi] The GnafApi object to query - if none is provided one will be created using terria.corsProxy
 *      and the default settings.
 * @param [options.flightDurationSeconds] The number of seconds for the flight animation when zooming to new results.
 * @constructor
 */
var GnafSearchProviderViewModel = function(options) {
  SearchProviderViewModel.call(this);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  this.terria = options.terria;

  var url = defaultValue(
    options.url,
    this.terria.configParameters.gnafSearchUrl
  );

  this.name = i18next.t("viewModels.searchAddresses");
  this.gnafApi = defaultValue(
    options.gnafApi,
    new GnafApi(this.terria.corsProxy, url)
  );
  this._geocodeInProgress = undefined;
  this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
};

inherit(SearchProviderViewModel, GnafSearchProviderViewModel);

GnafSearchProviderViewModel.prototype.search = function(searchText) {
  this.isSearching = true;
  this.searchResults.removeAll();

  if (!defined(searchText) || /^\s*$/.test(searchText)) {
    return;
  }

  this.searchMessage = undefined;
  this.terria.analytics?.logEvent(
    Category.search,
    SearchAction.gnaf,
    searchText
  );

  // If there is already a search in progress, cancel it.
  if (defined(this._geocodeInProgress)) {
    this._geocodeInProgress.cancel = true;
    this._geocodeInProgress = undefined;
  }

  var thisGeocode = this.gnafApi
    .geoCode(searchText)
    .then(
      function(hits) {
        if (thisGeocode.cancel) {
          return;
        }

        this.isSearching = false;

        if (hits.length === 0) {
          this.searchMessage = i18next.t("viewModels.searchNoLocations");
          return;
        }

        this.searchResults = hits.map(
          function(hit) {
            return new SearchResultViewModel({
              name: hit.name,
              isImportant: hit.locational,
              clickAction: createZoomToFunction(
                this.terria,
                hit.location,
                this.flightDurationSeconds
              ),
              location: hit.location
            });
          }.bind(this)
        );
      }.bind(this)
    )
    .otherwise(
      function() {
        if (thisGeocode.cancel) {
          return;
        }

        this.isSearching = false;
        this.searchMessage = i18next.t("viewModels.searchErrorOccurred");
      }.bind(this)
    );

  this._geocodeInProgress = thisGeocode;
};

function createZoomToFunction(terria, location, duration) {
  var rectangle = zoomRectangleFromPoint(
    location.latitude,
    location.longitude,
    0.01
  );

  return function() {
    terria.currentViewer.zoomTo(rectangle, duration);
  };
}

module.exports = GnafSearchProviderViewModel;

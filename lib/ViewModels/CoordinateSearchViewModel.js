"use strict";

/*global require*/
var i18next = require("i18next").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var inherit = require("../Core/inherit");
var SearchProviderViewModel = require("./SearchProviderViewModel");
var SearchResultViewModel = require("./SearchResultViewModel");
var zoomRectangleFromPoint = require("../Map/zoomRectangleFromPoint");

/**
 * Search provider that check if user inputs are coordinates and convert it to search result.
 * This is a fallback when BingMapsApiKey is not defined, and should be called from TerriaMap instance.
 *
 * @param options.terria Terria instance
 * @param [options.flightDurationSeconds] The number of seconds for the flight animation when zooming to new results.
 * @constructor
 */
var CoordinateSearchViewModel = function(options) {
  SearchProviderViewModel.call(this);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this.terria = options.terria;
  this.name = i18next.t("viewModels.searchLocations");

  this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
};

inherit(SearchProviderViewModel, CoordinateSearchViewModel);

/** TO DO
 *  more formats for lat lon search, i.e. lat: -37, lon: 144
 *  search with coordinate system choice
 */
CoordinateSearchViewModel.prototype.search = function(searchText) {
  if (!defined(searchText) || /^\s*$/.test(searchText)) {
    this.isSearching = false;
    this.searchResults.removeAll();
    return;
  }

  this.isSearching = true;
  this.searchResults.removeAll();
  this.searchMessage = undefined;

  this.terria.analytics.logEvent("search", "coordinates", searchText);

  if (
    /^(-|\+){0,1}\d*(\.\d{1,}){0,1}\,\s*(-|\+){0,1}\d*(\.\d{1,}){0,1}$/.test(
      searchText
    )
  ) {
    var latlong = searchText.split(",");
    var latitude = latlong[0].trim();
    var longitude = latlong[1].trim();
    if (
      latitude >= 90 ||
      latitude <= -90 ||
      longitude >= 180 ||
      longitude <= -180
    ) {
      this.searchMessage = i18next.t("viewModels.searchNoLocations");
    } else {
      this.searchResults.push(
        new SearchResultViewModel({
          name: i18next.t("viewModels.searchPoint"),
          isImportant: true,
          clickAction: createZoomToFunction(
            this,
            latitude,
            longitude,
            this.flightDurationSeconds
          ),
          location: {
            latitude: latitude,
            longitude: longitude
          }
        })
      );
    }

    this.isSearching = false;
  } else {
    this.isSearching = false;
    this.searchResults.removeAll();
    this.searchMessage = i18next.t("viewModels.searchNoLocations");
    return;
  }
};

function createZoomToFunction(viewModel, locLat, locLng, duration) {
  // Search returns just a location.
  // bboxSize is used to expand a point
  var bboxSize = 0.2;
  var rectangle = zoomRectangleFromPoint(locLat, locLng, bboxSize);

  return function() {
    var terria = viewModel.terria;
    terria.currentViewer.zoomTo(rectangle, duration);
  };
}

module.exports = CoordinateSearchViewModel;

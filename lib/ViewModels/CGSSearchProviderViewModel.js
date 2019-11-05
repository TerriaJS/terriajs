"use strict";

/*global require*/
var inherit = require("../Core/inherit");
var SearchProviderViewModel = require("./SearchProviderViewModel");
var SearchResultViewModel = require("./SearchResultViewModel");
var zoomRectangleFromPoint = require("../Map/zoomRectangleFromPoint");
var CGSApi = require("../Models/CGSApi");

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue");
var defined = require("terriajs-cesium/Source/Core/defined");

var NAME = "Locations";

/**
 * Search provider that uses the CGS Search and Locate Service to look up addresses.
 *
 * @param options.terria Terria instance
 * @param [options.flightDurationSeconds] The number of seconds for the flight animation when zooming to new results.
 * @constructor
 */
var CGSSearchProviderViewModel = function(options) {
  SearchProviderViewModel.call(this);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  this.terria = options.terria;

  this.name = NAME;
  this.CGSApi = new CGSApi();
  this._geocodeInProgress = undefined;
  this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
};

inherit(SearchProviderViewModel, CGSSearchProviderViewModel);

CGSSearchProviderViewModel.prototype.search = function(searchText) {
  this.isSearching = true;
  this.searchResults.removeAll();

  if (!defined(searchText) || /^\s*$/.test(searchText)) {
    return;
  }

  this.searchMessage = undefined;

  // If there is already a search in progress, cancel it.
  if (defined(this._geocodeInProgress)) {
    this._geocodeInProgress.cancel = true;
    this._geocodeInProgress = undefined;
  }

  var thisGeocode = this.CGSApi
    .geoCode(searchText)
    .then(
      function(hits) {
        if (thisGeocode.cancel) {
          return;
        }

        this.isSearching = false;

        if (hits.length === 0) {
          this.searchMessage = "Sorry, no locations match your search query.";
          return;
        }

        this.searchResults = hits.map(
          function(hit) {
            return new SearchResultViewModel({
              name: hit.name,
              isImportant: true,
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
        this.searchMessage =
          "An error occurred while searching.  Please check your internet connection or try again later.";
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

module.exports = CGSSearchProviderViewModel;

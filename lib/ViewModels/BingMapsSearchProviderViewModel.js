"use strict";

/*global require*/
var inherit = require("../Core/inherit");
var SearchProviderViewModel = require("./SearchProviderViewModel");
var SearchResultViewModel = require("./SearchResultViewModel");

var BingMapsApi = require("terriajs-cesium/Source/Core/BingMapsApi").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var loadJsonp = require("../Core/loadJsonp");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var Resource = require("terriajs-cesium/Source/Core/Resource").default;
import i18next from "i18next";

var BingMapsSearchProviderViewModel = function(options) {
  SearchProviderViewModel.call(this);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this.terria = options.terria;
  this._geocodeInProgress = undefined;

  this.name = i18next.t("viewModels.searchLocations");
  this.url = defaultValue(options.url, "//dev.virtualearth.net/");
  if (this.url.length > 0 && this.url[this.url.length - 1] !== "/") {
    this.url += "/";
  }
  this.key = BingMapsApi.getKey(options.key);
  this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
  this.primaryCountry = defaultValue(options.primaryCountry, "Australia");
  this.culture = defaultValue(options.culture, "en-au");

  if (!this.key) {
    console.warn(
      "The " +
        this.name +
        " geocoder will always return no results because a Bing Maps key has not been provided. Please get a Bing Maps key from bingmapsportal.com and add it to parameters.bingMapsKey in config.json."
    );
  }
};

inherit(SearchProviderViewModel, BingMapsSearchProviderViewModel);

BingMapsSearchProviderViewModel.prototype.search = function(searchText) {
  if (!defined(searchText) || /^\s*$/.test(searchText)) {
    this.isSearching = false;
    this.searchResults.removeAll();
    return;
  }

  this.isSearching = true;
  this.searchResults.removeAll();
  this.searchMessage = undefined;

  this.terria.analytics.logEvent("search", "bing", searchText);

  // If there is already a search in progress, cancel it.
  if (defined(this._geocodeInProgress)) {
    this._geocodeInProgress.cancel = true;
    this._geocodeInProgress = undefined;
  }

  var longitudeDegrees;
  var latitudeDegrees;

  if (defined(this.terria.cesium)) {
    var scene = this.terria.cesium.scene;
    var cameraPosition = scene.camera.positionWC;
    var cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(
      cameraPosition
    );
    longitudeDegrees = CesiumMath.toDegrees(
      cameraPositionCartographic.longitude
    );
    latitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.latitude);
  } else if (defined(this.terria.leaflet)) {
    var center = this.terria.leaflet.map.getCenter();
    longitudeDegrees = center.lng;
    latitudeDegrees = center.lat;
  }

  var promise = loadJsonp(
    new Resource({
      url:
        this.url +
        "REST/v1/Locations?culture=" +
        this.culture +
        "&userLocation=" +
        latitudeDegrees +
        "," +
        longitudeDegrees,
      queryParameters: {
        query: searchText,
        key: this.key
      }
    }),
    "jsonp"
  );

  var that = this;
  var geocodeInProgress = (this._geocodeInProgress = promise
    .then(function(result) {
      if (geocodeInProgress.cancel) {
        return;
      }
      that.isSearching = false;

      if (result.resourceSets.length === 0) {
        that.searchMessage = i18next.t("viewModels.searchNoLocations");
        return;
      }

      var resourceSet = result.resourceSets[0];
      if (resourceSet.resources.length === 0) {
        that.searchMessage = i18next.t("viewModels.searchNoLocations");
        return;
      }

      var primaryCountryLocations = [];
      var otherLocations = [];

      // Locations in the primary country go on top, locations elsewhere go undernearth and we add
      // the country name to them.
      for (var i = 0; i < resourceSet.resources.length; ++i) {
        var resource = resourceSet.resources[i];

        var name = resource.name;
        if (!defined(name)) {
          continue;
        }

        var list = primaryCountryLocations;
        var isImportant = true;

        var country = resource.address
          ? resource.address.countryRegion
          : undefined;
        if (defined(that.primaryCountry) && country !== that.primaryCountry) {
          // Add this location to the list of other locations.
          list = otherLocations;
          isImportant = false;

          // Add the country to the name, if it's not already there.
          if (
            defined(country) &&
            name.lastIndexOf(country) !== name.length - country.length
          ) {
            name += ", " + country;
          }
        }

        list.push(
          new SearchResultViewModel({
            name: name,
            isImportant: isImportant,
            clickAction: createZoomToFunction(that, resource),
            location: {
              latitude: resource.point.coordinates[0],
              longitude: resource.point.coordinates[1]
            }
          })
        );
      }

      that.searchResults.push.apply(
        that.searchResults,
        primaryCountryLocations
      );
      that.searchResults.push.apply(that.searchResults, otherLocations);

      if (that.searchResults.length === 0) {
        that.searchMessage = i18next.t("viewModels.searchNoLocations");
      }
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

function createZoomToFunction(viewModel, resource) {
  var bbox = resource.bbox;
  var south = bbox[0];
  var west = bbox[1];
  var north = bbox[2];
  var east = bbox[3];

  var rectangle = Rectangle.fromDegrees(west, south, east, north);

  return function() {
    var terria = viewModel.terria;
    terria.currentViewer.zoomTo(rectangle, viewModel.flightDurationSeconds);
  };
}

module.exports = BingMapsSearchProviderViewModel;

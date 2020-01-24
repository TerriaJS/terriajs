"use strict";

/*global require*/
var inherit = require("../Core/inherit");
var SearchProviderViewModel = require("./SearchProviderViewModel");
var SearchResultViewModel = require("./SearchResultViewModel");

var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var Cartesian2 = require("terriajs-cesium/Source/Core/Cartesian2").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var loadJson = require("../Core/loadJson");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
import i18next from "i18next";

var NominatimSearchProviderViewModel = function(options) {
  SearchProviderViewModel.call(this);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this.terria = options.terria;
  this.countryCodes = defined(options.countryCodes)
    ? "&countrycodes=" + options.countryCodes
    : "";

  this._geocodeInProgress = undefined;

  this.name = "Nominatim";
  this.url = defaultValue(options.url, "//nominatim.openstreetmap.org/");
  if (this.url.length > 0 && this.url[this.url.length - 1] !== "/") {
    this.url += "/";
  }
  this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
  this.limitBounded = 2;
  this.limitOthers = 2;
};

inherit(SearchProviderViewModel, NominatimSearchProviderViewModel);

NominatimSearchProviderViewModel.prototype.search = function(searchText) {
  if (!defined(searchText) || /^\s*$/.test(searchText)) {
    this.isSearching = false;
    this.searchResults.removeAll();
    return;
  }

  this.isSearching = true;
  this.searchResults.removeAll();
  this.searchMessage = undefined;

  this.terria.analytics.logEvent("search", "nominatim", searchText);

  // If there is already a search in progress, cancel it.
  if (defined(this._geocodeInProgress)) {
    this._geocodeInProgress.cancel = true;
    this._geocodeInProgress = undefined;
  }

  var bboxStr = "";

  if (defined(this.terria.cesium)) {
    var viewer = this.terria.cesium.viewer;
    var posUL = viewer.camera.pickEllipsoid(
      new Cartesian2(0, 0),
      Ellipsoid.WGS84
    );
    var posLR = viewer.camera.pickEllipsoid(
      new Cartesian2(viewer.canvas.width, viewer.canvas.height),
      Ellipsoid.WGS84
    );
    if (defined(posUL) && defined(posLR)) {
      posUL = Ellipsoid.WGS84.cartesianToCartographic(posUL);
      posLR = Ellipsoid.WGS84.cartesianToCartographic(posLR);
      bboxStr =
        "&viewbox=" +
        CesiumMath.toDegrees(posUL.longitude) +
        "," +
        CesiumMath.toDegrees(posUL.latitude) +
        "," +
        CesiumMath.toDegrees(posLR.longitude) +
        "," +
        CesiumMath.toDegrees(posLR.latitude);
    } else {
      bboxStr = "";
    }
  } else if (defined(this.terria.leaflet)) {
    var bbox = this.terria.leaflet.map.getBounds();
    bboxStr =
      "&viewbox=" +
      bbox.getWest() +
      "," +
      bbox.getNorth() +
      "," +
      bbox.getEast() +
      "," +
      bbox.getSouth();
  }
  var promiseBounded = loadJson(
    this.url +
      "search?q=" +
      searchText +
      bboxStr +
      "&bounded=1&format=json" +
      this.countryCodes +
      "&limit=" +
      this.limitBounded
  );
  var promiseOthers = loadJson(
    this.url +
      "search?q=" +
      searchText +
      "&format=json" +
      this.countryCodes +
      "&limit=" +
      this.limitOthers
  );

  var that = this;
  var geocodeInProgress = (this._geocodeInProgress = {
    cancel: false
  });

  return when
    .all([promiseBounded, promiseOthers])
    .then(function(result) {
      if (geocodeInProgress.cancel) {
        return;
      }
      that.isSearching = false;

      if (result.length === 0) {
        return;
      }

      var locations = [];

      // Locations in the bounded query go on top, locations elsewhere go undernearth
      var findDbl = function(elts, id) {
        return elts.filter(function(elt) {
          return elt.id === id;
        })[0];
      };

      for (var i = 0; i < result.length; ++i) {
        for (var j = 0; j < result[i].length; ++j) {
          var resource = result[i][j];

          var name = resource.display_name;
          if (!defined(name)) {
            continue;
          }

          if (!findDbl(locations, resource.place_id)) {
            locations.push(
              new SearchResultViewModel({
                id: resource.place_id,
                name: name,
                isImportant: true,
                clickAction: createZoomToFunction(that, resource)
              })
            );
          }
        }
      }

      that.searchResults.push.apply(that.searchResults, locations);

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
    });
};

function createZoomToFunction(viewModel, resource) {
  var bbox = resource.boundingbox;
  var south = bbox[0];
  var west = bbox[2];
  var north = bbox[1];
  var east = bbox[3];

  var rectangle = Rectangle.fromDegrees(west, south, east, north);

  return function() {
    var terria = viewModel.terria;
    terria.currentViewer.zoomTo(rectangle, viewModel.flightDurationSeconds);
  };
}

module.exports = NominatimSearchProviderViewModel;

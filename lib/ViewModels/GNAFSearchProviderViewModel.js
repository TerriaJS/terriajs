'use strict';

/*global require*/
var inherit = require('../Core/inherit');
var SearchProviderViewModel = require('./SearchProviderViewModel');
var SearchResultViewModel = require('./SearchResultViewModel');
var zoomRectangleFromPoint = require('../Map/zoomRectangleFromPoint');
var GNAFApi = require('../Models/GNAFApi');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');

var DATA61_GNAF_SEARCH_URL = 'http://gnaf.it.csiro.au/es/_search';
var NAME = 'Addresses';

var GNAFSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.terria = options.terria;
    this._geocodeInProgress = undefined;

    this.name = NAME;
    var url = this.terria.corsProxy.getURLProxyIfNecessary(defaultValue(options.url, DATA61_GNAF_SEARCH_URL));

    this.gnafApi = new GNAFApi(url);
    this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
};

inherit(SearchProviderViewModel, GNAFSearchProviderViewModel);

GNAFSearchProviderViewModel.prototype.search = function(searchText) {
    this.isSearching = true;
    this.searchResults.removeAll();

    if (!defined(searchText) || /^\s*$/.test(searchText)) {
        return;
    }

    this.searchMessage = undefined;
    this.terria.analytics.logEvent('search', 'gnaf', searchText);

    // If there is already a search in progress, cancel it.
    if (defined(this._geocodeInProgress)) {
        this._geocodeInProgress.cancel = true;
        this._geocodeInProgress = undefined;
    }

    var location = this._getLocation();

    var thisGeocode = this.gnafApi.geoLocate(searchText, location)
        .then(function(hits) {
            if (thisGeocode.cancel) {
                return;
            }

            this.isSearching = false;

            if (hits.length === 0) {
                this.searchMessage = 'Sorry, no locations match your search query.';
                return;
            }

            this.searchResults = hits.map(function(hit) {
                return new SearchResultViewModel({
                    name: hit.name,
                    isImportant: hit.locational,
                    clickAction: createZoomToFunction(this.terria, hit.location, this.flightDurationSeconds)
                });
            }.bind(this));
        }.bind(this)).otherwise(function() {
            if (thisGeocode.cancel) {
                return;
            }

            this.isSearching = false;
            this.searchMessage = 'An error occurred while searching.  Please check your internet connection or try again later.';
        }.bind(this));

    this._geocodeInProgress = thisGeocode;
};

GNAFSearchProviderViewModel.prototype._getLocation = function() {
    var centreLatLong = this._getCentreLatLong();
    var dims = this.terria.currentViewer.getRealWorldViewDimensions();

    if (defined(dims) && defined(centreLatLong)) {
        var maxViewRadius = Math.max(dims.height, dims.width) / 2;

        return {
            latitude: centreLatLong.latitude,
            longitude: centreLatLong.longitude,
            distance: maxViewRadius
        };
    }
};

GNAFSearchProviderViewModel.prototype._getCentreLatLong = function() {
    var longitudeDegrees;
    var latitudeDegrees;

    if (defined(this.terria.cesium)) {
        var scene = this.terria.cesium.scene;
        var cameraPosition = scene.camera.positionWC;
        var cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(cameraPosition);
        longitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.longitude);
        latitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.latitude);
    } else if (defined(this.terria.leaflet)) {
        var center = this.terria.leaflet.map.getCenter();
        longitudeDegrees = center.lng;
        latitudeDegrees = center.lat;
    }

    return {
        latitude: latitudeDegrees,
        longitude: longitudeDegrees
    };
};

function createZoomToFunction(terria, location, duration) {
    var rectangle = zoomRectangleFromPoint(location.latitude, location.longitude, 0.01);

    return function() {
        terria.currentViewer.zoomTo(rectangle, duration);
    };
}

module.exports = GNAFSearchProviderViewModel;

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

var IMPORTANT_SCORE_THRESHOLD = 2;

var GNAFSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.terria = options.terria;
    this._geocodeInProgress = undefined;

    this.name = 'GNAF';

    var url = defaultValue(options.url, 'http://gnaf.it.csiro.au/es/_search');
    this.url = this.terria.corsProxy.getURLProxyIfNecessary(url);

    this.gnafApi = new GNAFApi(url);


    this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
};

inherit(SearchProviderViewModel, GNAFSearchProviderViewModel);

GNAFSearchProviderViewModel.prototype.search = function(searchText) {
    if (!defined(searchText) || /^\s*$/.test(searchText)) {
        this.isSearching = false;
        this.searchResults.removeAll();
        return;
    }

    this.isSearching = true;
    this.searchResults.removeAll();
    this.searchMessage = undefined;

    this.terria.analytics.logEvent('search', 'gnaf', searchText);

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
        var cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(cameraPosition);
        longitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.longitude);
        latitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.latitude);
    } else if (defined(this.terria.leaflet)) {
        var center = this.terria.leaflet.map.getCenter();
        longitudeDegrees = center.lng;
        latitudeDegrees = center.lat;
    }

    var dims = this.terria.currentViewer.getRealWorldViewDimensions();
    var location;

    if (defined(dims)) {
        var maxViewRadius = Math.max(dims.height, dims.width) / 2;
        location = {
            latitude: latitudeDegrees,
            longitude: longitudeDegrees,
            distance: maxViewRadius
        };
    }

    var promise = this.gnafApi.geoLocate(searchText, location);

    this._geocodeInProgress = promise.then(function(hits) {
        if (this._geocodeInProgress.cancel) {
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
                isImportant: hit.score > IMPORTANT_SCORE_THRESHOLD,
                clickAction: createZoomToFunction(this.terria, hit.location, this.flightDurationSeconds)
            });
        }.bind(this));
    }.bind(this)).otherwise(function() {
        if (this.geocodeInProgress.cancel) {
            return;
        }

        this.isSearching = false;
        this.searchMessage = 'An error occurred while searching.  Please check your internet connection or try again later.';
    }.bind(this));
};

function createZoomToFunction(terria, location, duration) {
    var rectangle = zoomRectangleFromPoint(location.latitude, location.longitude, 0.01);

    return function() {
        terria.currentViewer.zoomTo(rectangle, duration);
    };
}

module.exports = GNAFSearchProviderViewModel;

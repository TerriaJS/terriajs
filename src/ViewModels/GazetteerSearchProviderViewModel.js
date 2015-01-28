'use strict';

/*global require,ga*/
var corsProxy = require('../Core/corsProxy');
var inherit = require('../Core/inherit');
var SearchProviderViewModel = require('./SearchProviderViewModel');
var SearchResultViewModel = require('./SearchResultViewModel');

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var GazetteerSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.application = options.application;
    this._geocodeInProgress = undefined;

    this.name = 'Official Place Names';
    this.url = defaultValue(options.url, 'http://www.ga.gov.au/gazetteer-search/gazetteer2012/select/');
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

    ga('send', 'event', 'search', 'gazetteer', searchText);

    // If there is already a search in progress, cancel it.
    if (defined(this._geocodeInProgress)) {
        this._geocodeInProgress.cancel = true;
        this._geocodeInProgress = undefined;
    }

    var longitudeDegrees;
    var latitudeDegrees;

    if (defined(this.application.cesium)) {
        var scene = this.application.cesium.scene;
        var cameraPosition = scene.camera.positionWC;
        var cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(cameraPosition);
        longitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.longitude);
        latitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.latitude);
    } else if (defined(this.application.leaflet)) {
        var center = this.application.leaflet.map.getCenter();
        longitudeDegrees = center.lng;
        latitudeDegrees = center.lat;
    }

    var url = this.url + '?q=name:*' + searchText + '*';

    if (this.forceUseOfProxy || corsProxy.shouldUseProxy(url)) {
        url = corsProxy.getURL(url);
    }

    var promise = loadJson(url);

    var that = this;
    var geocodeInProgress = this._geocodeInProgress = promise.then(function(solarQueryResponse) {
        if (geocodeInProgress.cancel) {
            return;
        }
        that.isSearching = false;

        if (defined(solarQueryResponse.response) && solarQueryResponse.response.numFound > 0) {
            solarQueryResponse.response.docs.forEach(function(result) {
                that.searchResults.push(new SearchResultViewModel({
                    name: result.name,
                    isImportant: true,
                    clickAction: createZoomToFunction(that, result)
                }));
            });
        } else {
            that.searchMessage = 'Sorry, no official place names match your search query';
        }

        that.isSearching = false;
    }).otherwise(function() {
        if (geocodeInProgress.cancel) {
            return;
        }

        that.isSearching = false;
        that.searchMessage = 'An error occurred while searching.  Please check your internet connection or try again later.';
    });
};

function createZoomToFunction(viewModel, resource) {
    // Server does not return information of a bounding box, just a location.
    // bboxSize is used to expand a point
    var bboxSize = 0.2;
    var locLat = resource.location.split(',')[0];
    var locLng = resource.location.split(',')[1];
    var south = parseFloat(locLat) + bboxSize / 2;
    var west = parseFloat(locLng) - bboxSize / 2;
    var north = parseFloat(locLat) - bboxSize / 2;
    var east = parseFloat(locLng) + bboxSize / 2;
    var rectangle = Rectangle.fromDegrees(west, south, east, north);

    return function() {
        var application = viewModel.application;
        application.currentViewer.zoomTo(rectangle, viewModel.flightDurationSeconds);
    };
}

module.exports = GazetteerSearchProviderViewModel;

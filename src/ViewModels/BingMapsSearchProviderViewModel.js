'use strict';

/*global require,ga*/
var inherit = require('../Core/inherit');
var SearchProviderViewModel = require('./SearchProviderViewModel');
var SearchResultViewModel = require('./SearchResultViewModel');

var BingMapsApi = require('../../third_party/cesium/Source/Core/BingMapsApi');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var jsonp = require('../../third_party/cesium/Source/Core/jsonp');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var BingMapsSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.application = options.application;
    this._geocodeInProgress = undefined;

    this.name = 'Locations';
    this.url = defaultValue(options.url, '//dev.virtualearth.net/');
    if (this.url.length > 0 && this.url[this.url.length - 1] !== '/') {
        this.url += '/';
    }
    this.key = BingMapsApi.getKey(options.key);
    this.flightDurationSeconds = defaultValue(options.flightDurationSeconds, 1.5);
    this.primaryCountry = defaultValue(options.primaryCountry, 'Australia');
    this.culture = defaultValue(options.culture, 'en-au');
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

    ga('send', 'event', 'search', 'bing', searchText);

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

    var promise = jsonp(this.url + 'REST/v1/Locations?culture=' + this.culture + '&userLocation=' + latitudeDegrees + ',' + longitudeDegrees , {
        parameters : {
            query : searchText,
            key : this.key
        },
        callbackParameterName : 'jsonp'
    });

    var that = this;
    var geocodeInProgress = this._geocodeInProgress = promise.then(function(result) {
        if (geocodeInProgress.cancel) {
            return;
        }
        that.isSearching = false;

        if (result.resourceSets.length === 0) {
            that.searchMessage = 'Sorry, no locations match your search query.';
            return;
        }

        var resourceSet = result.resourceSets[0];
        if (resourceSet.resources.length === 0) {
            that.searchMessage = 'Sorry, no locations match your search query.';
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

            var country = resource.address ? resource.address.countryRegion : undefined;
            if (defined(that.primaryCountry) && country !== that.primaryCountry) {
                // Add this location to the list of other locations.
                list = otherLocations;
                isImportant = false;

                // Add the country to the name, if it's not already there.
                if (defined(country) && name.lastIndexOf(country) !== name.length - country.length) {
                    name += ', ' + country;
                }
            }

            list.push(new SearchResultViewModel({
                name: name,
                isImportant: isImportant,
                clickAction: createZoomToFunction(that, resource)
            }));
        }

        that.searchResults.push.apply(that.searchResults, primaryCountryLocations);
        that.searchResults.push.apply(that.searchResults, otherLocations);

        if (that.searchResults.length === 0) {
            that.searchMessage = 'Sorry, no locations match your search query.';
        }
    }).otherwise(function() {
        if (geocodeInProgress.cancel) {
            return;
        }

        that.isSearching = false;
        that.searchMessage = 'An error occurred while searching.  Please check your internet connection or try again later.';
    });
};

function createZoomToFunction(viewModel, resource) {
    var bbox = resource.bbox;
    var south = bbox[0];
    var west = bbox[1];
    var north = bbox[2];
    var east = bbox[3];

    var rectangle = Rectangle.fromDegrees(west, south, east, north);

    return function() {
        var application = viewModel.application;
        application.currentViewer.zoomTo(rectangle, viewModel.flightDurationSeconds);
    };
}

module.exports = BingMapsSearchProviderViewModel;

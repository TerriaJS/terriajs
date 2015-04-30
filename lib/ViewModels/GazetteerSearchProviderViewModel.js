'use strict';

/*global require,ga*/
var corsProxy = require('../Core/corsProxy');
var inherit = require('../Core/inherit');
var SearchProviderViewModel = require('./SearchProviderViewModel');
var SearchResultViewModel = require('./SearchResultViewModel');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

var GazetteerSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

     this.terria = options.terria;
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

    if (defined( this.terria.cesium)) {
        var scene =  this.terria.cesium.scene;
        var cameraPosition = scene.camera.positionWC;
        var cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(cameraPosition);
        longitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.longitude);
        latitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.latitude);
    } else if (defined( this.terria.leaflet)) {
        var center =  this.terria.leaflet.map.getCenter();
        longitudeDegrees = center.lng;
        latitudeDegrees = center.lat;
    }

    // I don't know how to get server-side sorting, so we have to retrieve lots of rows, then filter.
    // Retrieving only 10 rows (default) means "Sydney" fails to actually retrieve Sydney...

    // Worth considering using "fq=class_code:(R%20X)", which would only return towns, states etc


    var url = this.url + '?q=name:*' + searchText + '*';
    // filter out bores, built structures, caves, landmarks, trig stations
    url += '%20-class_code:(D%20E%20G%20J%20T)%20-feature_code:PRS';
    url += '&rows=200';

    if (this.forceUseOfProxy || corsProxy.shouldUseProxy(url)) {
        url = corsProxy.getURL(url);
    }

    var promise = loadJson(url);

    var that = this;
    var geocodeInProgress = this._geocodeInProgress = promise.then(function(solrQueryResponse) {
        if (geocodeInProgress.cancel) {
            return;
        }
        that.isSearching = false;


        if (defined(solrQueryResponse.response) && solrQueryResponse.response.numFound > 0) {
            var results = solrQueryResponse.response.docs.sort(
                function (a,b) { return sortResults(a,b,searchText); } );
            results.slice(0,10).forEach(function(result) {
                that.searchResults.push(new SearchResultViewModel({
                    name: result.name + (result.state_id !== 'N/A' ? ' (' + result.state_id + ')' : ''),
                    isImportant: !!result.feature_code.match('^(CNTY|CONT|DI|PRSH|STAT|LOCB|LOCU|SUB|URBN)$'),
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

function featureScore(a, searchText) {
    // could be further refined using http://www.ga.gov.au/image_cache/GA19367.pdf
    // feature_code is defined on p24
    // class_code (A-X) matches a row in the table on p23 (eg, 'C' is 'Bays & Gulfs')
    var featureTypes = ['CONT', 'STAT', 'URBN', 'LOCB', 'LOCU', 'SUB', 'DI', 'CNTY', 'DI'];
    featureTypes.push('HBR', 'CAPE','PEN','PT', 'BAY','PORT','GULF', 'BGHT','COVE','MT','HILL','PEAK','OCEN','SEA','RESV','LAKE','RES','STRM');
    featureTypes.push('PLN','REEF','VAL', 'PRSH');

    var aScore = 10000 - (featureTypes.indexOf(a.feature_code) + 1) *100;
    if (aScore === 10000) {
        aScore = 0;
    }

    if (a.name.toUpperCase() === searchText.toUpperCase()) {
        // Bonus for exact match
        // More testing required to choose this value. Should "Geelong" (parish in Queensland) outrank "North Geelong" (suburb in Vic)?
        aScore += 10 * 100;
    } else if (a.name.match(new RegExp('^' + searchText + '\\b', 'i'))) {
        // bonus for first word match ('Steve Bay' better than 'West Steve Bay')
        aScore += 8 * 100;
    } else if (a.name.match(new RegExp('\\b' + searchText + '\\b', 'i'))) {
        // bonus for word-boundary match ('Steve' better than 'Steveville')
        aScore += 4 * 100;
    } else if (a.name.match(new RegExp('^' + searchText, 'i'))) {
        // bonus for word-boundary match ('Steventon' better than 'Nosteve Town')
        aScore += 2 * 100;
    }
    if (a.state_id === 'N/A') {
        // seems to be an indicator of a low quality result
        aScore -= 10 * 100;
    }

    return aScore;
}

function sortResults(a, b, searchText) {
    return featureScore(b, searchText) - featureScore(a, searchText);
}

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
        var terria = viewModel.terria;
        terria.currentViewer.zoomTo(rectangle, viewModel.flightDurationSeconds);
    };
}

module.exports = GazetteerSearchProviderViewModel;

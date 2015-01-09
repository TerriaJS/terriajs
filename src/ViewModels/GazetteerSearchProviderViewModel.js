'use strict';

/*global require,ga,$*/
var corsProxy = require('../Core/corsProxy');
var inherit = require('../Core/inherit');
var SearchProviderViewModel = require('./SearchProviderViewModel');
var SearchResultViewModel = require('./SearchResultViewModel');

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var GazetteerSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.application = options.application;
    this._geocodeInProgress = undefined;

    this.name = 'Official Place Names';
    this.url = defaultValue(options.url, 'http://www.ga.gov.au/gazetteer-search/select/');
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

    var promise = loadXML(url);

    var that = this;
    var geocodeInProgress = this._geocodeInProgress = promise.then(function(solarQueryResponse) {
        if (geocodeInProgress.cancel) {
            return;
        }
        that.isSearching = false;

        var json = $.xml2json(solarQueryResponse);
        if (defined(json.result) && json.result.numFound > 0) {
            var results =parseSolrResults(that.searchResults, json.result.doc, ['name', 'location', 'state_id']);
            results.forEach(function(result) {
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

/**
 * Parses the xml2json result from a Solr query into an object with properties of interest
 *
 * Solr returns a very generic document making it ugly to parse.
 * valueTypes is defaulted as just containing 'str' as this is the default Solr schema.
 */
function parseSolrResults(docs, keysOfInterest, valueTypes) {
    var results = [];

    if(!defined(docs)) {
        return results;
    }

    valueTypes = valueTypes || ['str'];
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
        for (var valueTypesIndex = 0; valueTypesIndex < valueTypes.length; valueTypesIndex++) {
            var valueType = valueTypes[valueTypesIndex];
            if (!defined(valueType)) {
                continue;
            }
            var resultObj = {};
            var validResult = false;
            for (var k = 0; k < keysOfInterest.length; k++) {
                var key = keysOfInterest[k];
                for (var j = 0; j < doc[valueType].length > 0; j++) {
                    var singleResult = doc[valueType][j];
                    if (singleResult.name === key) {
                        validResult = true;
                        resultObj[key] = singleResult.text;
                    }
                }
            }
            if (validResult) {
                results.push(resultObj);
            }
        }
    }

    return results;
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
        var application = viewModel.application;
        application.currentViewer.zoomTo(rectangle, viewModel.flightDurationSeconds);
    };
}

module.exports = GazetteerSearchProviderViewModel;

'use strict';

/*global require*/
var L = require('leaflet');
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var EllipsoidGeodesic = require('terriajs-cesium/Source/Core/EllipsoidGeodesic');
var getTimestamp = require('terriajs-cesium/Source/Core/getTimestamp');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var DistanceLegendViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

     this.terria = options.terria;
    this._removeSubscription = undefined;
    this._lastLegendUpdate = undefined;

    this.distanceLabel = undefined;
    this.barWidth = undefined;

    knockout.track(this, ['distanceLabel', 'barWidth']);

     this.terria.beforeViewerChanged.addEventListener(function() {
        if (defined(this._removeSubscription)) {
            this._removeSubscription();
            this._removeSubscription = undefined;
        }
    }, this);

    var that = this;

    function addUpdateSubscription() {
        if (defined( that.terria.cesium)) {
            var scene =  that.terria.cesium.scene;
            that._removeSubscription = scene.postRender.addEventListener(function() {
                updateDistanceLegendCesium(this, scene);
            }, that);
        } else if (defined( that.terria.leaflet)) {
            var map =  that.terria.leaflet.map;

            var potentialChangeCallback = function potentialChangeCallback() {
                updateDistanceLegendLeaflet(that, map);
            };

            that._removeSubscription = function() {
                map.off('zoomend', potentialChangeCallback);
                map.off('moveend', potentialChangeCallback);
            };

            map.on('zoomend', potentialChangeCallback);
            map.on('moveend', potentialChangeCallback);

            updateDistanceLegendLeaflet(that, map);
        }
    }

    addUpdateSubscription();

     this.terria.afterViewerChanged.addEventListener(function() {
        addUpdateSubscription();
    }, this);
};

DistanceLegendViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/DistanceLegend.html', 'utf8'), container, this);
};

DistanceLegendViewModel.create = function(options) {
    var result = new DistanceLegendViewModel(options);
    result.show(options.container);
    return result;
};

var geodesic = new EllipsoidGeodesic();

var distances = [
    1, 2, 3, 5,
    10, 20, 30, 50,
    100, 200, 300, 500,
    1000, 2000, 3000, 5000,
    10000, 20000, 30000, 50000,
    100000, 200000, 300000, 500000,
    1000000, 2000000, 3000000, 5000000,
    10000000, 20000000, 30000000, 50000000];

function updateDistanceLegendCesium(viewModel, scene) {
    var now = getTimestamp();
    if (now < viewModel._lastLegendUpdate + 250) {
        return;
    }

    viewModel._lastLegendUpdate = now;

    // Find the distance between two pixels at the bottom center of the screen.
    var width = scene.canvas.clientWidth;
    var height = scene.canvas.clientHeight;

    var left = scene.camera.getPickRay(new Cartesian2((width / 2) | 0, height - 1));
    var right = scene.camera.getPickRay(new Cartesian2(1 + (width / 2) | 0, height - 1));

    var globe = scene.globe;
    var leftPosition = globe.pick(left, scene);
    var rightPosition = globe.pick(right, scene);

    if (!defined(leftPosition) || !defined(rightPosition)) {
        viewModel.barWidth = undefined;
        viewModel.distanceLabel = undefined;
        return;
    }

    var leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
    var rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);

    geodesic.setEndPoints(leftCartographic, rightCartographic);
    var pixelDistance = geodesic.surfaceDistance;

    // Find the first distance that makes the scale bar less than 100 pixels.
    var maxBarWidth = 100;
    var distance;
    for (var i = distances.length - 1; !defined(distance) && i >= 0; --i) {
        if (distances[i] / pixelDistance < maxBarWidth) {
            distance = distances[i];
        }
    }

    if (defined(distance)) {
        var label;
        if (distance >= 1000) {
            label = (distance / 1000).toString() + ' km';
        } else {
            label = distance.toString() + ' m';
        }

        viewModel.barWidth = (distance / pixelDistance) | 0;
        viewModel.distanceLabel = label;
    } else {
        viewModel.barWidth = undefined;
        viewModel.distanceLabel = undefined;
    }
}

function updateDistanceLegendLeaflet(viewModel, map) {
    var halfHeight = map.getSize().y / 2;
    var maxPixelWidth = 100;
    var maxMeters = map.containerPointToLatLng([0, halfHeight]).distanceTo(
        map.containerPointToLatLng([maxPixelWidth, halfHeight]));

    var meters = L.control.scale()._getRoundNum(maxMeters);
    var label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

    viewModel.barWidth = (meters / maxMeters) * maxPixelWidth;
    viewModel.distanceLabel = label;
}

module.exports = DistanceLegendViewModel;
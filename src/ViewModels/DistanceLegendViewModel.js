'use strict';

/*global require*/
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var EllipsoidGeodesic = require('../../third_party/cesium/Source/Core/EllipsoidGeodesic');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var DistanceLegendViewModel = function(application) {
    if (!defined(application)) {
        throw new DeveloperError('application is required.');
    }

    this.application = application;
    this.removeSubscription = undefined;

    this.distanceLabel = undefined;
    this.barWidth = undefined;

    knockout.track(this, ['distanceLabel', 'barWidth']);

    this.application.beforeViewerChanged.addEventListener(function() {
        if (defined(this.removeSubscription)) {
            this.removeSubscription();
            this.removeSubscription = undefined;
        }
    }, this);

    var that = this;

    function addUpdateSubscription() {
        if (defined(that.application.cesium)) {
            var scene = that.application.cesium.scene;
            that.removeSubscription = scene.postRender.addEventListener(function() {
                updateDistanceLegend(this, scene);
            }, that);
        }
    }

    addUpdateSubscription();

    this.application.afterViewerChanged.addEventListener(function() {
        addUpdateSubscription();
    }, this);
};

DistanceLegendViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/DistanceLegend.html', 'utf8'), container, this);
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

function updateDistanceLegend(viewModel, scene) {
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

module.exports = DistanceLegendViewModel;
'use strict';

/*global require*/
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var DistanceLegendViewModel = function(application) {
    if (!defined(application)) {
        throw new DeveloperError('application is required.');
    }

    this.application = application;
    this.removeSubscription = undefined;

    this.distance = undefined;
    this.barLength = undefined;

    knockout.track(this, ['distance', 'barLength']);

    this.application.beforeViewerChanged.addEventListener(function() {
        if (defined(this.removeSubscription)) {
            this.removeSubscription();
        }
    }, this);

    this.application.afterViewerChanged.addEventListener(function() {
        if (defined(this.application.cesium)) {
            var scene = this.application.cesium.scene;
            this.removeSubscription = scene.postRender.addEventListener(function() {
                updateDistanceLegend(this, scene);
            }, this);
        }
    }, this);
};

function updateDistanceLegend(viewModel, scene) {
    // Find the distance between two pixels at the bottom center of the screen.
    var scene = this.scene;
    var width = scene.canvas.clientWidth;
    var height = scene.canvas.clientHeight;

    var left = scene.camera.getPickRay(new Cartesian2((width / 2) | 0, height - 1));
    var right = scene.camera.getPickRay(new Cartesian2(1 + (width / 2) | 0, height - 1));

    var globe = scene.globe;
    var leftPosition = globe.pick(left, scene);
    var rightPosition = globe.pick(right, scene);

    if (!defined(leftPosition) || !defined(rightPosition)) {
        document.getElementById('ausglobe-title-scale').style.visibility = 'hidden';
        return;
    }

    var leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
    var rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);

    geodesic.setEndPoints(leftCartographic, rightCartographic);
    var pixelDistance = geodesic.surfaceDistance;

    // Find the first distance that makes the scale bar less than 150 pixels.
    var maxBarWidth = 150;
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

        var barWidth = (distance / pixelDistance) | 0;
        if (barWidth !== this._distanceLegendBarWidth || label !== this._distanceLegendLabel) {
            document.getElementById('ausglobe-title-scale').style.visibility = 'visible';
            document.getElementById('ausglobe-title-scale-label').textContent = label;
            document.getElementById('ausglobe-title-scale-bar').style.width = barWidth.toString() + 'px';

            this._distanceLegendBarWidth = barWidth;
            this._distanceLegendLabel = label;
        }
    } else {
        document.getElementById('ausglobe-title-scale').style.visibility = 'hidden';
    }
}

module.exports = DistanceLegendViewModel;
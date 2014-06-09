"use strict";

/*global require,Cesium*/

var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var createCommand = Cesium.createCommand;
var Ellipsoid = Cesium.Ellipsoid;
var getElement = Cesium.getElement;
var SceneMode = Cesium.SceneMode;
var Matrix4 = Cesium.Matrix4;
var CameraFlightPath = Cesium.CameraFlightPath;
var Ray = Cesium.Ray;
var IntersectionTests = Cesium.IntersectionTests;
var defined = Cesium.defined;
var Tween = Cesium.Tween;
var defaultValue = Cesium.defaultValue;
var defineProperties = Cesium.defineProperties;

var knockout = require('knockout');

var NavigationWidget = function(viewer, container) {
    container = getElement(container);

    this._viewer = viewer;
    this._showTilt = true;

    var element = document.createElement('div');
    element.className = 'navigation-controls';
    container.appendChild(element);

    this._element = element;

    element.innerHTML = '\
        <img src="images/plus.svg" class="navigation-control" data-bind="click: zoomIn" title="Zoom In"></div>\
        <img src="images/minus.svg" class="navigation-control" data-bind="click: zoomOut" title="Zoom Out"></div>\
        <img src="images/tilt_none.svg" class="navigation-control" data-bind="click: tilt, visible: showTilt && isTiltExtreme" title="Tilt"></div>\
        <img src="images/tilt_moderate.svg" class="navigation-control" data-bind="click: tilt, visible: showTilt && isTiltNone" title="Tilt"></div>\
        <img src="images/tilt_extreme.svg" class="navigation-control" data-bind="click: tilt, visible: showTilt && isTiltModerate" title="Tilt"></div>\
    ';

    var that = this;
    this._viewModel = {
        zoomIn : createCommand(function() {
            if (that._viewer.map) {
                // Leaflet
                that._viewer.map.zoomIn(1);
                return;
            } else {
                // Cesium
                var scene = that._viewer.scene
                var camera = scene.camera;
                var focus = getCameraFocus(scene);
                var direction = Cartesian3.subtract(focus, camera.position);
                var movementVector = Cartesian3.multiplyByScalar(direction, 2.0 / 3.0);
                var endPosition = Cartesian3.add(camera.position, movementVector);

                flyToPosition(scene, endPosition);
            }
        }),
        zoomOut : createCommand(function() {
            if (that._viewer.map) {
                // Leaflet
                that._viewer.map.zoomOut(1);
                return;
            } else {
                // Cesium
                var scene = that._viewer.scene
                var camera = scene.camera;
                var focus = getCameraFocus(scene);
                var direction = Cartesian3.subtract(focus, camera.position);
                var movementVector = Cartesian3.multiplyByScalar(direction, -2.0);
                var endPosition = Cartesian3.add(camera.position, movementVector);

                flyToPosition(scene, endPosition);
            }
        }),
        tilt : createCommand(function() {
            if (that._viewModel.isTiltNone) {
                that._viewModel.isTiltNone = false;
                that._viewModel.isTiltModerate = true;
                animateToTilt(that._viewer.scene, 40.0);
            } else if (that._viewModel.isTiltModerate) {
                that._viewModel.isTiltModerate = false;
                that._viewModel.isTiltExtreme = true;
                animateToTilt(that._viewer.scene, 10.0);
            } else if (that._viewModel.isTiltExtreme) {
                that._viewModel.isTiltExtreme = false;
                that._viewModel.isTiltNone = true;
                animateToTilt(that._viewer.scene, 90.0);
            }
        }),
        showTilt : true,
        isTiltNone : true,
        isTiltModerate : false,
        isTiltExtreme : false
    };

    knockout.track(this._viewModel, ['showTilt', 'isTiltNone', 'isTiltModerate', 'isTiltExtreme']);

    knockout.applyBindings(this._viewModel, element);
};

defineProperties(NavigationWidget.prototype, {
    showTilt : {
        get : function() {
            return this._viewModel.showTilt;
        },
        set : function(value) {
            this._viewModel.showTilt = value;
        }
    }
});

function animateToTilt(scene, targetTiltDegrees, durationMilliseconds) {
    durationMilliseconds = defaultValue(durationMilliseconds, 200);

    var startTilt = scene.camera.tilt;
    var endTilt = CesiumMath.toRadians(targetTiltDegrees);

    var controller = scene.screenSpaceCameraController;
    controller.enableInputs = false;

    scene.animations.add({
        duration : durationMilliseconds,
        easingFunction : Tween.Easing.Sinusoidal.InOut,
        startValue : {
            time: 0.0
        },
        stopValue : {
            time : 1.0
        },
        onUpdate : function(value) {
            if (scene.isDestroyed()) {
                return;
            }
            scene.camera.tilt = CesiumMath.lerp(startTilt, endTilt, value.time);
        },
        onComplete : function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        },
        onCancel: function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        }
    });
}

function getCameraFocus(scene) {
    var ray = new Ray(scene.camera.positionWC, scene.camera.directionWC);
    var intersections = IntersectionTests.rayEllipsoid(ray, Ellipsoid.WGS84);
    if (defined(intersections)) {
        return Ray.getPoint(ray, intersections.start);
    } else {
        // Camera direction is not pointing at the globe, so use the ellipsoid horizon point as
        // the focal point.
        return IntersectionTests.grazingAltitudeLocation(ray, Ellipsoid.WGS84);
    }
}

function flyToPosition(scene, position, durationMilliseconds) {
    var camera = scene.camera;
    var startPosition = camera.position;
    var endPosition = position;

    durationMilliseconds = defaultValue(durationMilliseconds, 200);

    var controller = scene.screenSpaceCameraController;
    controller.enableInputs = false;

    scene.animations.add({
        duration : durationMilliseconds,
        easingFunction : Tween.Easing.Sinusoidal.InOut,
        startValue : {
            time: 0.0
        },
        stopValue : {
            time : 1.0
        },
        onUpdate : function(value) {
            if (scene.isDestroyed()) {
                return;
            }
            scene.camera.position.x = CesiumMath.lerp(startPosition.x, endPosition.x, value.time);
            scene.camera.position.y = CesiumMath.lerp(startPosition.y, endPosition.y, value.time);
            scene.camera.position.z = CesiumMath.lerp(startPosition.z, endPosition.z, value.time);
        },
        onComplete : function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        },
        onCancel: function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        }
    });
}

module.exports = NavigationWidget;

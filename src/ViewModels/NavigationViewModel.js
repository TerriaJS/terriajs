'use strict';

/*global require,ga*/
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var IntersectionTests = require('../../third_party/cesium/Source/Core/IntersectionTests');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');
var Ray = require('../../third_party/cesium/Source/Core/Ray');
var Tween = require('../../third_party/cesium/Source/ThirdParty/Tween');

var loadView = require('../Core/loadView');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');

var svgZoomIn = require('../SvgPaths/svgZoomIn');
var svgZoomOut = require('../SvgPaths/svgZoomOut');
var svgReset = require('../SvgPaths/svgReset');
var svgTilt = require('../SvgPaths/svgTilt');
var svgCompassOuterRing = require('../SvgPaths/svgCompassOuterRing');
var svgCompassGyro = require('../SvgPaths/svgCompassGyro');
var svgCompassRotationMarker = require('../SvgPaths/svgCompassRotationMarker');

var NavigationViewModel = function(application) {
    this.application = application;

    this.svgZoomIn = svgZoomIn;
    this.svgZoomOut = svgZoomOut;
    this.svgReset = svgReset;
    this.svgTilt = svgTilt;
    this.svgCompassOuterRing = svgCompassOuterRing;
    this.svgCompassGyro = svgCompassGyro;
    this.svgCompassRotationMarker = svgCompassRotationMarker;

    this._tiltInProgress = false;
    this._nextTilt = undefined;

    this.showTilt = defined(this.application.cesium);
    this.currentTilt = 0;

    this.showCompass = defined(this.application.cesium);
    this.heading = this.application.cesium.scene.camera.heading;

    this.isOrbiting = false;
    this.isRotating = false;
    this.initialRotationAngle = undefined;
    this.mouseMoveFunction = undefined;
    this.mouseUpFunction = undefined;

    this._unsubcribeFromPostRender = undefined;

    knockout.track(this, ['showTilt', 'currentTilt', 'heading', 'isOrbiting', 'isRotating']);

    var that = this;

    function viewerChange() {
        if (defined(that.application.cesium)) {
            if (that._unsubcribeFromPostRender) {
                that._unsubcribeFromPostRender();
                that._unsubcribeFromPostRender = undefined;
            }

            that.showTilt = true;
            that.showCompass = true;

            that._unsubcribeFromPostRender = that.application.cesium.scene.postRender.addEventListener(function() {
                that.heading = that.application.cesium.scene.camera.heading;
            });
        } else {
            if (that._unsubcribeFromPostRender) {
                that._unsubcribeFromPostRender();
                that._unsubcribeFromPostRender = undefined;
            }
            that.showTilt = false;
            that.showCompass = false;
        }
    }

    application.afterViewerChanged.addEventListener(viewerChange);

    viewerChange();
};

NavigationViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/Navigation.html', 'utf8'), container, this);
};

var cartesian3Scratch = new Cartesian3();

NavigationViewModel.prototype.zoomIn = function() {
    ga('send', 'event', 'navigation', 'click', 'zoomIn');

    if (defined(this.application.leaflet)) {
        this.application.leaflet.map.zoomIn(1);
    }

    if (defined(this.application.cesium)) {
        var scene = this.application.cesium.scene;
        var camera = scene.camera;
        var focus = getCameraFocus(scene);
        var direction = Cartesian3.subtract(focus, camera.position, cartesian3Scratch);
        var movementVector = Cartesian3.multiplyByScalar(direction, 2.0 / 3.0, cartesian3Scratch);
        var endPosition = Cartesian3.add(camera.position, movementVector, cartesian3Scratch);

        flyToPosition(scene, endPosition);
    }

    this.application.currentViewer.notifyRepaintRequired();
};

NavigationViewModel.prototype.zoomOut = function() {
    ga('send', 'event', 'navigation', 'click', 'zoomOut');

    if (defined(this.application.leaflet)) {
        this.application.leaflet.map.zoomOut(1);
    }

    if (defined(this.application.cesium)) {
        var scene = this.application.cesium.scene;
        var camera = scene.camera;
        var focus = getCameraFocus(scene);
        var direction = Cartesian3.subtract(focus, camera.position, cartesian3Scratch);
        var movementVector = Cartesian3.multiplyByScalar(direction, -2.0, cartesian3Scratch);
        var endPosition = Cartesian3.add(camera.position, movementVector, cartesian3Scratch);

        flyToPosition(scene, endPosition);
    }

    this.application.currentViewer.notifyRepaintRequired();
};

NavigationViewModel.prototype.resetView = function() {
    ga('send', 'event', 'navigation', 'click', 'reset');

    var bbox = this.application.initialBoundingBox;

    if (defined(this.application.leaflet)) {
        this.application.leaflet.map.fitBounds(rectangleToLatLngBounds(bbox));
    }

    if (defined(this.application.cesium)) {
        var scene = this.application.cesium.scene;
        var camera = scene.camera;
        camera.flyToRectangle({
            destination: bbox,
            duration: 1.5
        });
    }

    this.application.currentViewer.notifyRepaintRequired();
};

var tilts = [0, 40, 80];

NavigationViewModel.prototype.tilt = function() {
    ga('send', 'event', 'navigation', 'click', 'tilt');

    if (defined(this.application.cesium)) {
        var scene = this.application.cesium.scene;

        var currentTilt = this.currentTilt;
        var index;
        for (index = 0; index < tilts.length && tilts[index] <= currentTilt; ++index) {
        }

        if (index >= tilts.length) {
            index = 0;
        }

        this.currentTilt = tilts[index];
        animateToTilt(this, scene, this.currentTilt);
    }

    this.application.currentViewer.notifyRepaintRequired();
};

var vectorScratch = new Cartesian2();

NavigationViewModel.prototype.handleMouseDown = function(viewModel, e) {
    var compassElement = e.currentTarget;
    var compassRectangle = e.currentTarget.getBoundingClientRect();
    var maxDistance = compassRectangle.width / 2.0;
    var center = new Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
    var clickLocation = new Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
    var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
    var distanceFromCenter = Cartesian2.magnitude(vector);

    var distanceFraction = distanceFromCenter / maxDistance;

    var nominalTotalRadius = 145;
    var norminalGyroRadius = 50;

    if (distanceFraction < norminalGyroRadius / nominalTotalRadius) {
        console.log('gyro');
    } else if (distanceFraction < 1.0) {
        console.log('start rotating!');

        document.removeEventListener('mousemove', this.mouseMoveFunction, false);
        document.removeEventListener('mouseup', this.mouseUpFunction, false);

        this.isRotating = true;
        this.initialRotationAngle = Math.atan2(-vector.y, vector.x);
        this.initialRotationHeading = this.application.cesium.scene.camera.heading;

        var that = this;
        this.mouseMoveFunction = function(e) {
            var compassRectangle = compassElement.getBoundingClientRect();
            var center = new Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
            var clickLocation = new Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
            var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
            var angle = Math.atan2(-vector.y, vector.x);

            if (angle < that.initialRotationAngle) {
                angle += CesiumMath.TWO_PI;
            }

            var angleDifference = angle - that.initialRotationAngle;
            var newHeading = CesiumMath.zeroToTwoPi(that.initialRotationHeading + angleDifference);

            var camera = that.application.cesium.scene.camera;

            console.log('new heading: ' + newHeading);

            camera.setView({
                heading : newHeading
            });

            that.application.cesium.notifyRepaintRequired();
        };

        this.mouseUpFunction = function(e) {
            console.log('done rotating');
            that.isRotating = false;
            document.removeEventListener('mousemove', that.mouseMoveFunction, false);
            document.removeEventListener('mouseup', that.mouseUpFunction, false);

            that.mouseMoveFunction = undefined;
            that.mouseUpFunction = undefined;
        };

        document.addEventListener('mousemove', this.mouseMoveFunction, false);
        document.addEventListener('mouseup', this.mouseUpFunction, false);
    } else {
        console.log('none');
        return true;
    }
};

NavigationViewModel.prototype.startRotate = function() {
    if (!defined(this.application.cesium)) {
        return;
    }

    ga('send', 'event', 'navigation', 'click', 'rotate');

    console.log('rotate');
};

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

    scene.tweens.add({
        duration : durationMilliseconds / 1000.0,
        easingFunction : Tween.Easing.Sinusoidal.InOut,
        startObject : {
            time: 0.0
        },
        stopObject : {
            time : 1.0
        },
        update : function(value) {
            if (scene.isDestroyed()) {
                return;
            }
            scene.camera.position.x = CesiumMath.lerp(startPosition.x, endPosition.x, value.time);
            scene.camera.position.y = CesiumMath.lerp(startPosition.y, endPosition.y, value.time);
            scene.camera.position.z = CesiumMath.lerp(startPosition.z, endPosition.z, value.time);
        },
        complete : function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        },
        cancel: function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        }
    });
}

function animateToTilt(viewModel, scene, targetTiltDegrees, durationMilliseconds) {
    if (viewModel._tiltInProgress) {
        viewModel._nextTilt = targetTiltDegrees;
        return;
    }

    durationMilliseconds = defaultValue(durationMilliseconds, 500);

    // Get focus and camera position
    var focus = getCameraFocus(scene);
    if (!defined(focus)) {
        return;
    }

    var campos = Cartesian3.subtract(scene.camera.position, focus, cartesian3Scratch);

    // Get tilt
    var startTilt = Cartesian3.angleBetween(campos, focus);
    var endTilt = CesiumMath.toRadians(targetTiltDegrees);
    var curTilt = 0;

    // Translate camera reference to focus
    var trans = Matrix4.fromTranslation(focus);
    var oldTrans = scene.camera.transform;
    scene.camera.transform = trans;

    Cartesian3.clone(campos, scene.camera.position);

    // Translate camera in reference to current pos
    var controller = scene.screenSpaceCameraController;
    controller.enableInputs = false;

    viewModel._tiltInProgress = true;

    scene.tweens.add({
        duration : durationMilliseconds / 1000.0,
        easingFunction : Tween.Easing.Sinusoidal.InOut,
        startObject : {
            time: 0.0
        },
        stopObject : {
            time : 1.0
        },
        update : function(value) {
            if (scene.isDestroyed()) {
                return;
            }
            var amount = CesiumMath.lerp(startTilt, endTilt, value.time) - (startTilt + curTilt);
            scene.camera.rotate(scene.camera.right, -amount);
            curTilt += amount;
       },
        complete : function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
            scene.camera.position = Cartesian3.add(scene.camera.position, focus, scene.camera.position);
            scene.camera.transform = oldTrans;
            viewModel._tiltInProgress = false;

            if (defined(viewModel._nextTilt)) {
                var nextTilt = viewModel._nextTilt;
                viewModel._nextTilt = undefined;
                animateToTilt(viewModel, scene, nextTilt, durationMilliseconds);
            }
        },
        cancel: function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
            scene.camera.position = Cartesian3.add(scene.camera.position, focus, scene.camera.position);
            scene.camera.transform = oldTrans;
            viewModel._tiltInProgress = false;
        }
    });
}

module.exports = NavigationViewModel;

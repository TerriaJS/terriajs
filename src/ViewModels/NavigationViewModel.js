'use strict';

/*global require,ga*/
var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var getTimestamp = require('../../third_party/cesium/Source/Core/getTimestamp');
var IntersectionTests = require('../../third_party/cesium/Source/Core/IntersectionTests');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');
var Ray = require('../../third_party/cesium/Source/Core/Ray');
var Transforms = require('../../third_party/cesium/Source/Core/Transforms');
var Tween = require('../../third_party/cesium/Source/ThirdParty/Tween');

var loadView = require('../Core/loadView');

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

    this.showCompass = defined(this.application.cesium);
    this.heading = this.showCompass ? this.application.cesium.scene.camera.heading : 0.0;

    this.isOrbiting = false;
    this.orbitCursorAngle = 0;
    this.orbitCursorOpacity = 0.0;
    this.orbitLastTimestamp = 0;
    this.orbitFrame = undefined;
    this.orbitIsLook = false;
    this.orbitMouseMoveFunction = undefined;
    this.orbitMouseUpFunction = undefined;

    this.isRotating = false;
    this.rotateInitialCursorAngle = undefined;
    this.rotateFrame = undefined;
    this.rotateIsLook = false;
    this.rotateMouseMoveFunction = undefined;
    this.rotateMouseUpFunction = undefined;

    this._unsubcribeFromPostRender = undefined;

    knockout.track(this, ['showCompass', 'heading', 'isOrbiting', 'orbitCursorAngle', 'isRotating']);

    var that = this;

    function viewerChange() {
        if (defined(that.application.cesium)) {
            if (that._unsubcribeFromPostRender) {
                that._unsubcribeFromPostRender();
                that._unsubcribeFromPostRender = undefined;
            }

            that.showCompass = true;

            that._unsubcribeFromPostRender = that.application.cesium.scene.postRender.addEventListener(function() {
                that.heading = that.application.cesium.scene.camera.heading;
            });
        } else {
            if (that._unsubcribeFromPostRender) {
                that._unsubcribeFromPostRender();
                that._unsubcribeFromPostRender = undefined;
            }
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

    this.application.currentViewer.zoomTo(this.application.homeView, 1.5);
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
        orbit(this, compassElement, vector);
    } else if (distanceFraction < 1.0) {
        rotate(this, compassElement, vector);
    } else {
        return true;
    }
};

var oldTransformScratch = new Matrix4();
var newTransformScratch = new Matrix4();
var centerScratch = new Cartesian3();
var windowPositionScratch = new Cartesian2();
var pickRayScratch = new Ray();

NavigationViewModel.prototype.handleDoubleClick = function(viewModel, e) {
    var scene = this.application.cesium.scene;
    var camera = scene.camera;

    var windowPosition = windowPositionScratch;
    windowPosition.x = scene.canvas.clientWidth / 2;
    windowPosition.y = scene.canvas.clientHeight / 2;
    var ray = camera.getPickRay(windowPosition, pickRayScratch);

    var center = scene.globe.pick(ray, scene, centerScratch);
    if (!defined(center)) {
        // Globe is barely visible, so reset to home view.
        this.resetView();
        return;
    }

    var rotateFrame = Transforms.eastNorthUpToFixedFrame(center, Ellipsoid.WGS84);

    var lookVector = Cartesian3.subtract(center, camera.position, new Cartesian3());

    var flight = CameraFlightPath.createTween(scene, {
        destination: Matrix4.multiplyByPoint(rotateFrame, new Cartesian3(0.0, 0.0, Cartesian3.magnitude(lookVector)), new Cartesian3()),
        direction: Matrix4.multiplyByPointAsVector(rotateFrame, new Cartesian3(0.0, 0.0, -1.0), new Cartesian3()),
        up: Matrix4.multiplyByPointAsVector(rotateFrame, new Cartesian3(0.0, 1.0, 0.0), new Cartesian3()),
        duration: 1.5
    });
    scene.tweens.add(flight);
};

function orbit(viewModel, compassElement, cursorVector) {
    // Remove existing event handlers, if any.
    document.removeEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
    document.removeEventListener('mouseup', viewModel.orbitMouseUpFunction, false);

    if (defined(viewModel.orbitTickFunction)) {
        viewModel.application.clock.onTick.removeEventListener(viewModel.orbitTickFunction);
    }

    viewModel.orbitMouseMoveFunction = undefined;
    viewModel.orbitMouseUpFunction = undefined;
    viewModel.orbitTickFunction = undefined;

    viewModel.isOrbiting = true;
    viewModel.orbitLastTimestamp = getTimestamp();

    var scene = viewModel.application.cesium.scene;
    var camera = scene.camera;

    var windowPosition = windowPositionScratch;
    windowPosition.x = scene.canvas.clientWidth / 2;
    windowPosition.y = scene.canvas.clientHeight / 2;
    var ray = camera.getPickRay(windowPosition, pickRayScratch);

    var center = scene.globe.pick(ray, scene, centerScratch);
    if (!defined(center)) {
        viewModel.orbitFrame = Transforms.eastNorthUpToFixedFrame(camera.positionWC, Ellipsoid.WGS84, newTransformScratch);
        viewModel.orbitIsLook = true;
    } else {
        viewModel.orbitFrame = Transforms.eastNorthUpToFixedFrame(center, Ellipsoid.WGS84, newTransformScratch);
        viewModel.orbitIsLook = false;
    }

    viewModel.orbitTickFunction = function(e) {
        var timestamp = getTimestamp();
        var deltaT = timestamp - viewModel.orbitLastTimestamp;
        var rate = (viewModel.orbitCursorOpacity - 0.5) * 2.5 / 1000;
        var distance = deltaT * rate;

        var angle = viewModel.orbitCursorAngle + CesiumMath.PI_OVER_TWO;
        var x = Math.cos(angle) * distance;
        var y = Math.sin(angle) * distance;

        var scene = viewModel.application.cesium.scene;
        var camera = scene.camera;

        var oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);

        camera.lookAtTransform(viewModel.orbitFrame);

        if (viewModel.orbitIsLook) {
            camera.look(Cartesian3.UNIT_Z, -x);
            camera.look(camera.right, -y);
        } else {
            camera.rotateLeft(x);
            camera.rotateUp(y);
        }

        camera.lookAtTransform(oldTransform);

        viewModel.application.cesium.notifyRepaintRequired();

        viewModel.orbitLastTimestamp = timestamp;
    };

    function updateAngleAndOpacity(vector, compassWidth) {
        var angle = Math.atan2(-vector.y, vector.x);
        viewModel.orbitCursorAngle = CesiumMath.zeroToTwoPi(angle - CesiumMath.PI_OVER_TWO);

        var distance = Cartesian2.magnitude(vector);
        var maxDistance = compassWidth / 2.0;
        var distanceFraction = Math.min(distance / maxDistance, 1.0);
        var easedOpacity = 0.5 * distanceFraction * distanceFraction + 0.5;
        viewModel.orbitCursorOpacity = easedOpacity;

        viewModel.application.cesium.notifyRepaintRequired();
    }

    viewModel.orbitMouseMoveFunction = function(e) {
        var compassRectangle = compassElement.getBoundingClientRect();
        var center = new Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
        var clickLocation = new Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
        var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
        updateAngleAndOpacity(vector, compassRectangle.width);
    };

    viewModel.orbitMouseUpFunction = function(e) {
        // TODO: if mouse didn't move, reset view to looking down, north is up?

        viewModel.isOrbiting = false;
        document.removeEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
        document.removeEventListener('mouseup', viewModel.orbitMouseUpFunction, false);

        if (defined(viewModel.orbitTickFunction)) {
            viewModel.application.clock.onTick.removeEventListener(viewModel.orbitTickFunction);
        }

        viewModel.orbitMouseMoveFunction = undefined;
        viewModel.orbitMouseUpFunction = undefined;
        viewModel.orbitTickFunction = undefined;
    };

    document.addEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
    document.addEventListener('mouseup', viewModel.orbitMouseUpFunction, false);
    viewModel.application.clock.onTick.addEventListener(viewModel.orbitTickFunction);

    updateAngleAndOpacity(cursorVector, compassElement.getBoundingClientRect().width);
}

function rotate(viewModel, compassElement, cursorVector) {
    // Remove existing event handlers, if any.
    document.removeEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
    document.removeEventListener('mouseup', viewModel.rotateMouseUpFunction, false);

    viewModel.rotateMouseMoveFunction = undefined;
    viewModel.rotateMouseUpFunction = undefined;

    viewModel.isRotating = true;
    viewModel.rotateInitialCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

    var scene = viewModel.application.cesium.scene;
    var camera = scene.camera;

    var windowPosition = windowPositionScratch;
    windowPosition.x = scene.canvas.clientWidth / 2;
    windowPosition.y = scene.canvas.clientHeight / 2;
    var ray = camera.getPickRay(windowPosition, pickRayScratch);

    var viewCenter = scene.globe.pick(ray, scene, centerScratch);
    if (!defined(viewCenter)) {
        viewModel.rotateFrame = Transforms.eastNorthUpToFixedFrame(camera.positionWC, Ellipsoid.WGS84, newTransformScratch);
        viewModel.rotateIsLook = true;
    } else {
        viewModel.rotateFrame = Transforms.eastNorthUpToFixedFrame(viewCenter, Ellipsoid.WGS84, newTransformScratch);
        viewModel.rotateIsLook = false;
    }

    var oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
    camera.lookAtTransform(viewModel.rotateFrame);
    viewModel.rotateInitialCameraAngle = Math.atan2(camera.position.y, camera.position.x);
    viewModel.rotateInitialCameraDistance = Cartesian3.magnitude(new Cartesian3(camera.position.x, camera.position.y, 0.0));
    camera.lookAtTransform(oldTransform);

    viewModel.rotateMouseMoveFunction = function(e) {
        var compassRectangle = compassElement.getBoundingClientRect();
        var center = new Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
        var clickLocation = new Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
        var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
        var angle = Math.atan2(-vector.y, vector.x);

        var angleDifference = angle - viewModel.rotateInitialCursorAngle;
        var newCameraAngle = CesiumMath.zeroToTwoPi(viewModel.rotateInitialCameraAngle - angleDifference);

        var camera = viewModel.application.cesium.scene.camera;

        var oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
        camera.lookAtTransform(viewModel.rotateFrame);
        var currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);
        camera.rotateRight(newCameraAngle - currentCameraAngle);
        camera.lookAtTransform(oldTransform);

        viewModel.application.cesium.notifyRepaintRequired();
    };

    viewModel.rotateMouseUpFunction = function(e) {
        viewModel.isRotating = false;
        document.removeEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
        document.removeEventListener('mouseup', viewModel.rotateMouseUpFunction, false);

        viewModel.rotateMouseMoveFunction = undefined;
        viewModel.rotateMouseUpFunction = undefined;
    };

    document.addEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
    document.addEventListener('mouseup', viewModel.rotateMouseUpFunction, false);
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

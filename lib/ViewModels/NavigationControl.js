'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var Ray = require('terriajs-cesium/Source/Core/Ray');
var IntersectionTests = require('terriajs-cesium/Source/Core/IntersectionTests');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Tween = require('terriajs-cesium/Source/ThirdParty/Tween');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');

var inherit = require('../Core/inherit');

var UserInterfaceControl = require('./UserInterfaceControl');

/**
 * The view-model for a control in the navigation control tool bar
 *
 * @alias NavigationControl
 * @constructor
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var NavigationControl = function(terria) {
    UserInterfaceControl.call(this, terria);
};

inherit(UserInterfaceControl, NavigationControl);

NavigationControl.prototype.flyToPosition = function (scene, position, durationMilliseconds) {
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
};

NavigationControl.prototype.getCameraFocus = function (scene) {
    var ray = new Ray(scene.camera.positionWC, scene.camera.directionWC);
    var intersections = IntersectionTests.rayEllipsoid(ray, Ellipsoid.WGS84);
    if (defined(intersections)) {
        return Ray.getPoint(ray, intersections.start);
    } else {
        // Camera direction is not pointing at the globe, so use the ellipsoid horizon point as
        // the focal point.
        return IntersectionTests.grazingAltitudeLocation(ray, Ellipsoid.WGS84);
    }
};

module.exports = NavigationControl;
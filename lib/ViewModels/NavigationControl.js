'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var Ray = require('terriajs-cesium/Source/Core/Ray');
var IntersectionTests = require('terriajs-cesium/Source/Core/IntersectionTests');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Tween = require('terriajs-cesium/Source/ThirdParty/Tween');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');

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
    if (!defined(terria)) {
        throw new DeveloperError('terria is required');
    }

    this._terria = terria;

    /**
     * Gets or sets the name of the control which is set as the control's title.
     * This property is observable.
     * @type {String}
     */
    this.name = 'Unnamed Control';

    /**
     * Gets or sets the text to be displayed in the nav control. Controls that
     * have text do not display the svgIcon.
     * This property is observable.
     * @type {String}
     */
    this.text = undefined;

    /**
     * Gets or sets the svg icon of the control.  This property is observable.
     * @type {Object}
     */
    this.svgIcon = undefined;

    /**
     * Gets or sets the height of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgHeight = undefined;

    /**
     * Gets or sets the width of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgWidth = undefined;

    /**
     * Gets or sets the CSS class of the control. This property is observable.
     * @type {String}
     */
    this.cssClass = undefined;

    /**
     * Gets or sets the property describing whether or not the control is in the active state.
     * This property is observable.
     * @type {Boolean}
     */
    this.isActive = false;

    knockout.track(this, ['name', 'svgIcon', 'svgHeight', 'svgWidth', 'cssClass', 'isActive']);
};

defineProperties(NavigationControl.prototype, {

    /**
     * Gets the Terria instance.
     * @memberOf NavigationControl.prototype
     * @type {Terria}
     */
    terria : {
        get : function() {
            return this._terria;
        }
    },

    /**
     * Gets a value indicating whether this button has text associated with it.
     * @type {Object}
     */
    hasText : {
        get : function() {
            return defined(this.text) && typeof this.text === 'string';
        }
    }

});

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control.
 * @abstract
 * @protected
 */
NavigationControl.prototype.activate = function() {
    throw new DeveloperError('activate must be implemented in the derived class.');
};

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
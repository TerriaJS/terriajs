'use strict';

/*global require*/
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Matrix3 = require('terriajs-cesium/Source/Core/Matrix3');
var Matrix4 = require('terriajs-cesium/Source/Core/Matrix4');
var Quaternion = require('terriajs-cesium/Source/Core/Quaternion');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var Transforms = require('terriajs-cesium/Source/Core/Transforms');

/**
 * Holds a camera view parameters, expressed as a rectangular extent and/or as a camera position, direction,
 * and up vector.
 *
 * @alias CameraView
 * @constructor
 */
var CameraView = function(rectangle, position, direction, up) {
    if (!defined(rectangle)) {
        throw new DeveloperError('rectangle is required.');
    }
    if (defined(position) || defined(direction) || defined(up)) {
        if (!defined(position) || !defined(direction) || !defined(up)) {
            throw new DeveloperError('If any of position, direction, or up are specified, all must be specified.');
        }
    }

    this._rectangle = rectangle;
    this._position = position;
    this._direction = direction;
    this._up = up;
};

defineProperties(CameraView.prototype, {
    /**
     * Gets the rectangular extent of the view.  If {@link CameraView#position}, {@link CameraView#direction},
     * and {@link CameraView#up} are specified, this property will be ignored for viewers that support those parameters
     * (e.g. Cesium).  This property must always be supplied, however, for the benefit of viewers that do not understand
     * these parameters (e.g. Leaflet).
     * @type {Rectangle}
     */
    rectangle: {
        get: function() {
            return this._rectangle;
        }
    },

    /**
     * Gets the position of the camera in the Earth-centered Fixed frame.
     * @type {Cartesian3}
     */
    position: {
        get: function() {
            return this._position;
        }
    },

    /**
     * Gets the look direction of the camera in the Earth-centered Fixed frame.
     * @type {Cartesian3}
     */
    direction: {
        get: function() {
            return this._direction;
        }
    },

    /**
     * Gets the up vector direction of the camera in the Earth-centered Fixed frame.
     * @type {Cartesian3}
     */
    up: {
        get: function() {
            return this._up;
        }
    }
});

var scratchPosition = new Cartesian3();
var scratchOffset = new Cartesian3();
var scratchDirection = new Cartesian3();
var scratchRight = new Cartesian3();
var scratchUp = new Cartesian3();
var scratchTarget = new Cartesian3();
var scratchMatrix4 = new Matrix4();

/**
 * Constructs a {@link CameraView} from a "look at" description.
 * @param {Cartographic} targetPosition The position to look at.
 * @param {HeadingPitchRange} headingPitchRange The offset of the camera from the target position.
 * @return {CameraView} The camera view.
 */
CameraView.fromLookAt = function(targetPosition, headingPitchRange) {
    var positionENU = offsetFromHeadingPitchRange(headingPitchRange.heading, -headingPitchRange.pitch, headingPitchRange.range, scratchPosition);
    var directionENU = Cartesian3.normalize(Cartesian3.negate(positionENU, scratchDirection), scratchDirection);
    var rightENU = Cartesian3.cross(directionENU, Cartesian3.UNIT_Z, scratchRight);

    if (Cartesian3.magnitudeSquared(rightENU) < CesiumMath.EPSILON10) {
        Cartesian3.clone(Cartesian3.UNIT_X, rightENU);
    }

    Cartesian3.normalize(rightENU, rightENU);
    var upENU = Cartesian3.cross(rightENU, directionENU, scratchUp);
    Cartesian3.normalize(upENU, upENU);

    var targetCartesian = Ellipsoid.WGS84.cartographicToCartesian(targetPosition, scratchTarget);
    var transform = Transforms.eastNorthUpToFixedFrame(targetCartesian, Ellipsoid.WGS84, scratchMatrix4);

    var offsetECF = Matrix4.multiplyByPointAsVector(transform, positionENU, scratchOffset);
    var position = Cartesian3.add(targetCartesian, offsetECF, new Cartesian3());
    var direction = Cartesian3.normalize(Cartesian3.negate(offsetECF, new Cartesian3()), new Cartesian3());
    var up = Matrix4.multiplyByPointAsVector(transform, upENU, new Cartesian3());

    // Estimate a rectangle for this view.
    var fieldOfViewHalfAngle = CesiumMath.toRadians(30);
    var groundDistance = Math.tan(fieldOfViewHalfAngle) * headingPitchRange.range;
    var angle = groundDistance / Ellipsoid.WGS84.minimumRadius;
    var extent = new Rectangle(targetPosition.longitude - angle, targetPosition.latitude - angle, targetPosition.longitude + angle, targetPosition.latitude + angle);

    return new CameraView(extent, position, direction, up);
};

var scratchLookAtHeadingPitchRangeQuaternion1 = new Quaternion();
var scratchLookAtHeadingPitchRangeQuaternion2 = new Quaternion();
var scratchHeadingPitchRangeMatrix3 = new Matrix3();

function offsetFromHeadingPitchRange(heading, pitch, range, result) {
    pitch = CesiumMath.clamp(pitch, -CesiumMath.PI_OVER_TWO, CesiumMath.PI_OVER_TWO);
    heading = CesiumMath.zeroToTwoPi(heading) - CesiumMath.PI_OVER_TWO;

    var pitchQuat = Quaternion.fromAxisAngle(Cartesian3.UNIT_Y, -pitch, scratchLookAtHeadingPitchRangeQuaternion1);
    var headingQuat = Quaternion.fromAxisAngle(Cartesian3.UNIT_Z, -heading, scratchLookAtHeadingPitchRangeQuaternion2);
    var rotQuat = Quaternion.multiply(headingQuat, pitchQuat, headingQuat);
    var rotMatrix = Matrix3.fromQuaternion(rotQuat, scratchHeadingPitchRangeMatrix3);

    var offset = Cartesian3.clone(Cartesian3.UNIT_X, result);
    Matrix3.multiplyByVector(rotMatrix, offset, offset);
    Cartesian3.negate(offset, offset);
    Cartesian3.multiplyByScalar(offset, range, offset);
    return offset;
}

module.exports = CameraView;
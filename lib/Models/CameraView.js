"use strict";

/*global require*/
var Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var HeadingPitchRange = require("terriajs-cesium/Source/Core/HeadingPitchRange")
  .default;
var HeadingPitchRoll = require("terriajs-cesium/Source/Core/HeadingPitchRoll")
  .default;
var Matrix3 = require("terriajs-cesium/Source/Core/Matrix3").default;
var Matrix4 = require("terriajs-cesium/Source/Core/Matrix4").default;
var Quaternion = require("terriajs-cesium/Source/Core/Quaternion").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var Transforms = require("terriajs-cesium/Source/Core/Transforms").default;

/**
 * Holds a camera view parameters, expressed as a rectangular extent and/or as a camera position, direction,
 * and up vector.
 *
 * @alias CameraView
 * @constructor
 */
var CameraView = function(rectangle, position, direction, up) {
  if (!defined(rectangle)) {
    throw new DeveloperError("rectangle is required.");
  }
  if (defined(position) || defined(direction) || defined(up)) {
    if (!defined(position) || !defined(direction) || !defined(up)) {
      throw new DeveloperError(
        "If any of position, direction, or up are specified, all must be specified."
      );
    }
  }

  this._rectangle = rectangle;
  this._position = position;
  this._direction = direction;
  this._up = up;
};

Object.defineProperties(CameraView.prototype, {
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

/**
 * Constructs a {@link CameraView} from json. All angles must be specified in degrees.
 * If neither json.lookAt nor json.positionHeadingPitchRoll is present, then json should have the keys position, direction, up, west, south, east, north.
 * @param  {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 * @param  {Object} [json.lookAt] If present, must include keys targetLongitude, targetLatitude, targetHeight, heading, pitch, range.
 * @param  {Object} [json.positionHeadingPitchRoll] If present, must include keys cameraLongitude, cameraLatitude, cameraHeight, heading, pitch, roll.
 * @return {CameraView} The camera view.
 */
CameraView.fromJson = function(json) {
  if (defined(json.lookAt)) {
    var targetPosition = Cartographic.fromDegrees(
      json.lookAt.targetLongitude,
      json.lookAt.targetLatitude,
      json.lookAt.targetHeight
    );
    var headingPitchRange = new HeadingPitchRange(
      CesiumMath.toRadians(json.lookAt.heading),
      CesiumMath.toRadians(json.lookAt.pitch),
      json.lookAt.range
    );
    return CameraView.fromLookAt(targetPosition, headingPitchRange);
  } else if (defined(json.positionHeadingPitchRoll)) {
    var cameraPosition = Cartographic.fromDegrees(
      json.positionHeadingPitchRoll.cameraLongitude,
      json.positionHeadingPitchRoll.cameraLatitude,
      json.positionHeadingPitchRoll.cameraHeight
    );
    return CameraView.fromPositionHeadingPitchRoll(
      cameraPosition,
      CesiumMath.toRadians(json.positionHeadingPitchRoll.heading),
      CesiumMath.toRadians(json.positionHeadingPitchRoll.pitch),
      CesiumMath.toRadians(json.positionHeadingPitchRoll.roll)
    );
  } else if (
    defined(json.position) &&
    defined(json.direction) &&
    defined(json.up)
  ) {
    return new CameraView(
      Rectangle.fromDegrees(json.west, json.south, json.east, json.north),
      new Cartesian3(json.position.x, json.position.y, json.position.z),
      new Cartesian3(json.direction.x, json.direction.y, json.direction.z),
      new Cartesian3(json.up.x, json.up.y, json.up.z)
    );
  } else {
    return new CameraView(
      Rectangle.fromDegrees(json.west, json.south, json.east, json.north)
    );
  }
};

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
  if (!defined(targetPosition)) {
    throw new DeveloperError("targetPosition is required.");
  }
  if (!defined(headingPitchRange)) {
    throw new DeveloperError("headingPitchRange is required.");
  }

  var positionENU = offsetFromHeadingPitchRange(
    headingPitchRange.heading,
    -headingPitchRange.pitch,
    headingPitchRange.range,
    scratchPosition
  );
  var directionENU = Cartesian3.normalize(
    Cartesian3.negate(positionENU, scratchDirection),
    scratchDirection
  );
  var rightENU = Cartesian3.cross(
    directionENU,
    Cartesian3.UNIT_Z,
    scratchRight
  );

  if (Cartesian3.magnitudeSquared(rightENU) < CesiumMath.EPSILON10) {
    Cartesian3.clone(Cartesian3.UNIT_X, rightENU);
  }

  Cartesian3.normalize(rightENU, rightENU);
  var upENU = Cartesian3.cross(rightENU, directionENU, scratchUp);
  Cartesian3.normalize(upENU, upENU);

  var targetCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    targetPosition,
    scratchTarget
  );
  var transform = Transforms.eastNorthUpToFixedFrame(
    targetCartesian,
    Ellipsoid.WGS84,
    scratchMatrix4
  );

  var offsetECF = Matrix4.multiplyByPointAsVector(
    transform,
    positionENU,
    scratchOffset
  );
  var position = Cartesian3.add(targetCartesian, offsetECF, new Cartesian3());
  var direction = Cartesian3.normalize(
    Cartesian3.negate(offsetECF, new Cartesian3()),
    new Cartesian3()
  );
  var up = Matrix4.multiplyByPointAsVector(transform, upENU, new Cartesian3());

  // Estimate a rectangle for this view.
  var fieldOfViewHalfAngle = CesiumMath.toRadians(30);
  var groundDistance =
    Math.tan(fieldOfViewHalfAngle) *
    (headingPitchRange.range + targetPosition.height);
  var angle = groundDistance / Ellipsoid.WGS84.minimumRadius;
  var extent = new Rectangle(
    targetPosition.longitude - angle,
    targetPosition.latitude - angle,
    targetPosition.longitude + angle,
    targetPosition.latitude + angle
  );

  return new CameraView(extent, position, direction, up);
};

var scratchQuaternion = new Quaternion();
var scratchMatrix3 = new Matrix3();

/**
 * Constructs a {@link CameraView} from a camera position and heading, pitch, and roll angles for the camera.
 * @param {Cartographic} cameraPosition The position of the camera.
 * @param {Number} heading The heading of the camera in radians measured from North toward East.
 * @param {Number} pitch The pitch of the camera in radians measured from the local horizontal.  Positive angles look up, negative angles look down.
 * @param {Number} roll The roll of the camera in radians counterclockwise.
 */
CameraView.fromPositionHeadingPitchRoll = function(
  cameraPosition,
  heading,
  pitch,
  roll
) {
  if (!defined(cameraPosition)) {
    throw new DeveloperError("cameraPosition is required.");
  }
  if (!defined(heading)) {
    throw new DeveloperError("heading is required.");
  }
  if (!defined(pitch)) {
    throw new DeveloperError("pitch is required.");
  }
  if (!defined(roll)) {
    throw new DeveloperError("roll is required.");
  }

  var hpr = new HeadingPitchRoll(heading - CesiumMath.PI_OVER_TWO, pitch, roll);
  var rotQuat = Quaternion.fromHeadingPitchRoll(hpr, scratchQuaternion);
  var rotMat = Matrix3.fromQuaternion(rotQuat, scratchMatrix3);

  var directionENU = Matrix3.getColumn(rotMat, 0, scratchDirection);
  var upENU = Matrix3.getColumn(rotMat, 2, scratchUp);

  var positionECF = Ellipsoid.WGS84.cartographicToCartesian(
    cameraPosition,
    scratchTarget
  );
  var transform = Transforms.eastNorthUpToFixedFrame(
    positionECF,
    Ellipsoid.WGS84,
    scratchMatrix4
  );

  var directionECF = Matrix4.multiplyByPointAsVector(
    transform,
    directionENU,
    new Cartesian3()
  );
  var upECF = Matrix4.multiplyByPointAsVector(
    transform,
    upENU,
    new Cartesian3()
  );

  // Estimate a rectangle for this view.
  var fieldOfViewHalfAngle = CesiumMath.toRadians(30);
  var groundDistance = Math.tan(fieldOfViewHalfAngle) * cameraPosition.height;
  var angle = groundDistance / Ellipsoid.WGS84.minimumRadius;
  var extent = new Rectangle(
    cameraPosition.longitude - angle,
    cameraPosition.latitude - angle,
    cameraPosition.longitude + angle,
    cameraPosition.latitude + angle
  );

  return new CameraView(extent, positionECF, directionECF, upECF);
};

var scratchLookAtHeadingPitchRangeQuaternion1 = new Quaternion();
var scratchLookAtHeadingPitchRangeQuaternion2 = new Quaternion();
var scratchHeadingPitchRangeMatrix3 = new Matrix3();

function offsetFromHeadingPitchRange(heading, pitch, range, result) {
  pitch = CesiumMath.clamp(
    pitch,
    -CesiumMath.PI_OVER_TWO,
    CesiumMath.PI_OVER_TWO
  );
  heading = CesiumMath.zeroToTwoPi(heading) - CesiumMath.PI_OVER_TWO;

  var pitchQuat = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Y,
    -pitch,
    scratchLookAtHeadingPitchRangeQuaternion1
  );
  var headingQuat = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Z,
    -heading,
    scratchLookAtHeadingPitchRangeQuaternion2
  );
  var rotQuat = Quaternion.multiply(headingQuat, pitchQuat, headingQuat);
  var rotMatrix = Matrix3.fromQuaternion(
    rotQuat,
    scratchHeadingPitchRangeMatrix3
  );

  var offset = Cartesian3.clone(Cartesian3.UNIT_X, result);
  Matrix3.multiplyByVector(rotMatrix, offset, offset);
  Cartesian3.negate(offset, offset);
  Cartesian3.multiplyByScalar(offset, range, offset);
  return offset;
}

module.exports = CameraView;

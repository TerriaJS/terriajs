import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import HeadingPitchRange from "terriajs-cesium/Source/Core/HeadingPitchRange";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import JsonValue, {
  isJsonNumber,
  isJsonObject,
  JsonObject
} from "../Core/Json";
import TerriaError from "../Core/TerriaError";

/**
 * Holds a camera's view parameters, expressed as a rectangular extent and/or as a camera position, direction,
 * and up vector.
 */
export default class CameraView {
  /**
   * Gets the rectangular extent of the view.  If {@link CameraView#position}, {@link CameraView#direction},
   * and {@link CameraView#up} are specified, this property will be ignored for viewers that support those parameters
   * (e.g. Cesium).  This property must always be supplied, however, for the benefit of viewers that do not understand
   * these parameters (e.g. Leaflet).
   */
  readonly rectangle: Readonly<Rectangle>;

  /**
   * Gets the position of the camera in the Earth-centered Fixed frame.
   */
  readonly position: Readonly<Cartesian3> | undefined;

  /**
   * Gets the look direction of the camera in the Earth-centered Fixed frame.
   */
  readonly direction: Readonly<Cartesian3> | undefined;

  /**
   * Gets the up vector direction of the camera in the Earth-centered Fixed frame.
   */
  readonly up: Readonly<Cartesian3> | undefined;

  constructor(
    rectangle: Rectangle,
    position?: Cartesian3,
    direction?: Cartesian3,
    up?: Cartesian3
  ) {
    this.rectangle = Rectangle.clone(rectangle);

    if (position !== undefined || direction !== undefined || up !== undefined) {
      if (
        position === undefined ||
        direction === undefined ||
        up === undefined
      ) {
        throw new DeveloperError(
          "If any of position, direction, or up are specified, all must be specified."
        );
      }

      this.position = Cartesian3.clone(position);
      this.direction = Cartesian3.clone(direction);
      this.up = Cartesian3.clone(up);
    }
  }

  toJson(): JsonObject {
    const result: JsonObject = {
      west: CesiumMath.toDegrees(this.rectangle.west),
      south: CesiumMath.toDegrees(this.rectangle.south),
      east: CesiumMath.toDegrees(this.rectangle.east),
      north: CesiumMath.toDegrees(this.rectangle.north)
    };

    if (this.position && this.direction && this.up) {
      function vectorToJson(vector: Readonly<Cartesian3>) {
        return {
          x: vector.x,
          y: vector.y,
          z: vector.z
        };
      }

      result.position = vectorToJson(this.position);
      result.direction = vectorToJson(this.direction);
      result.up = vectorToJson(this.up);
    }

    return result;
  }

  /**
   * Constructs a {@link CameraView} from json. All angles must be specified in degrees.
   * If neither json.lookAt nor json.positionHeadingPitchRoll is present, then json should have the keys position, direction, up, west, south, east, north.
   * @param  {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
   * @param  {Object} [json.lookAt] If present, must include keys targetLongitude, targetLatitude, targetHeight, heading, pitch, range.
   * @param  {Object} [json.positionHeadingPitchRoll] If present, must include keys cameraLongitude, cameraLatitude, cameraHeight, heading, pitch, roll.
   * @return {CameraView} The camera view.
   */
  static fromJson(json: JsonObject) {
    const lookAt = json.lookAt;
    const positionHeadingPitchRoll = json.positionHeadingPitchRoll;

    if (isJsonObject(lookAt)) {
      if (
        !isJsonNumber(lookAt.targetLongitude) ||
        !isJsonNumber(lookAt.targetLatitude) ||
        !isJsonNumber(lookAt.targetHeight) ||
        !isJsonNumber(lookAt.heading) ||
        !isJsonNumber(lookAt.pitch) ||
        !isJsonNumber(lookAt.range)
      ) {
        throw new TerriaError({
          sender: CameraView,
          title: "Invalid CameraView",
          message:
            "`lookAt` must have `targetLongitude`, `targetLatitude`, " +
            "`targetHeight`, `heading`, `pitch`, and `range` properties, " +
            "and all must be numbers."
        });
      }

      const targetPosition = Cartographic.fromDegrees(
        lookAt.targetLongitude,
        lookAt.targetLatitude,
        lookAt.targetHeight
      );
      const headingPitchRange = new HeadingPitchRange(
        CesiumMath.toRadians(lookAt.heading),
        CesiumMath.toRadians(lookAt.pitch),
        lookAt.range
      );

      return CameraView.fromLookAt(targetPosition, headingPitchRange);
    } else if (isJsonObject(positionHeadingPitchRoll)) {
      if (
        !isJsonNumber(positionHeadingPitchRoll.cameraLongitude) ||
        !isJsonNumber(positionHeadingPitchRoll.cameraLatitude) ||
        !isJsonNumber(positionHeadingPitchRoll.cameraHeight) ||
        !isJsonNumber(positionHeadingPitchRoll.heading) ||
        !isJsonNumber(positionHeadingPitchRoll.pitch) ||
        !isJsonNumber(positionHeadingPitchRoll.roll)
      ) {
        throw new TerriaError({
          sender: CameraView,
          title: "Invalid CameraView",
          message:
            "`positionHeadingPitchRoll` must have `cameraLongitude`, " +
            "`cameraLatitude`, `cameraHeight`, `heading`, `pitch`, and " +
            "`roll` properties, and all must be numbers."
        });
      }

      const cameraPosition = Cartographic.fromDegrees(
        positionHeadingPitchRoll.cameraLongitude,
        positionHeadingPitchRoll.cameraLatitude,
        positionHeadingPitchRoll.cameraHeight
      );

      return CameraView.fromPositionHeadingPitchRoll(
        cameraPosition,
        CesiumMath.toRadians(positionHeadingPitchRoll.heading),
        CesiumMath.toRadians(positionHeadingPitchRoll.pitch),
        CesiumMath.toRadians(positionHeadingPitchRoll.roll)
      );
    } else {
      if (
        !isJsonNumber(json.west) ||
        !isJsonNumber(json.south) ||
        !isJsonNumber(json.east) ||
        !isJsonNumber(json.north)
      ) {
        throw new TerriaError({
          sender: CameraView,
          title: "Invalid CameraView",
          message:
            "The `west`, `south`, `east`, and `north` properties are " +
            "required and must be numbers, specified in degrees."
        });
      }

      const rectangle = Rectangle.fromDegrees(
        json.west,
        json.south,
        json.east,
        json.north
      );

      if (
        isVector(json.position) &&
        isVector(json.direction) &&
        isVector(json.up)
      ) {
        return new CameraView(
          rectangle,
          new Cartesian3(json.position.x, json.position.y, json.position.z),
          new Cartesian3(json.direction.x, json.direction.y, json.direction.z),
          new Cartesian3(json.up.x, json.up.y, json.up.z)
        );
      } else {
        return new CameraView(rectangle);
      }
    }
  }

  /**
   * Constructs a {@link CameraView} from a "look at" description.
   * @param targetPosition The position to look at.
   * @param headingPitchRange The offset of the camera from the target position.
   * @return The camera view.
   */
  static fromLookAt = function (
    targetPosition: Readonly<Cartographic>,
    headingPitchRange: Readonly<HeadingPitchRange>
  ): CameraView {
    const positionENU = offsetFromHeadingPitchRange(
      headingPitchRange.heading,
      -headingPitchRange.pitch,
      headingPitchRange.range,
      scratchPosition
    );
    const directionENU = Cartesian3.normalize(
      Cartesian3.negate(positionENU, scratchDirection),
      scratchDirection
    );
    const rightENU = Cartesian3.cross(
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

    const targetCartesian = Ellipsoid.WGS84.cartographicToCartesian(
      targetPosition,
      scratchTarget
    );
    const transform = Transforms.eastNorthUpToFixedFrame(
      targetCartesian,
      Ellipsoid.WGS84,
      scratchMatrix4
    );

    const offsetECF = Matrix4.multiplyByPointAsVector(
      transform,
      positionENU,
      scratchOffset
    );
    const position = Cartesian3.add(
      targetCartesian,
      offsetECF,
      new Cartesian3()
    );
    const direction = Cartesian3.normalize(
      Cartesian3.negate(offsetECF, new Cartesian3()),
      new Cartesian3()
    );
    const up = Matrix4.multiplyByPointAsVector(
      transform,
      upENU,
      new Cartesian3()
    );

    // Estimate a rectangle for this view.
    const fieldOfViewHalfAngle = CesiumMath.toRadians(30);
    const groundDistance =
      Math.tan(fieldOfViewHalfAngle) *
      (headingPitchRange.range + targetPosition.height);
    const angle = groundDistance / Ellipsoid.WGS84.minimumRadius;
    const extent = new Rectangle(
      targetPosition.longitude - angle,
      targetPosition.latitude - angle,
      targetPosition.longitude + angle,
      targetPosition.latitude + angle
    );

    return new CameraView(extent, position, direction, up);
  };

  /**
   * Constructs a {@link CameraView} from a camera position and heading, pitch, and roll angles for the camera.
   * @param cameraPosition The position of the camera.
   * @param heading The heading of the camera in radians measured from North toward East.
   * @param pitch The pitch of the camera in radians measured from the local horizontal.  Positive angles look up, negative angles look down.
   * @param roll The roll of the camera in radians counterclockwise.
   */
  static fromPositionHeadingPitchRoll(
    cameraPosition: Readonly<Cartographic>,
    heading: number,
    pitch: number,
    roll: number
  ): CameraView {
    const hpr = new HeadingPitchRoll(
      heading - CesiumMath.PI_OVER_TWO,
      pitch,
      roll
    );
    const rotQuat = Quaternion.fromHeadingPitchRoll(hpr, scratchQuaternion);
    const rotMat = Matrix3.fromQuaternion(rotQuat, scratchMatrix3);

    const directionENU = Matrix3.getColumn(rotMat, 0, scratchDirection);
    const upENU = Matrix3.getColumn(rotMat, 2, scratchUp);

    const positionECF = Ellipsoid.WGS84.cartographicToCartesian(
      cameraPosition,
      scratchTarget
    );
    const transform = Transforms.eastNorthUpToFixedFrame(
      positionECF,
      Ellipsoid.WGS84,
      scratchMatrix4
    );

    const directionECF = Matrix4.multiplyByPointAsVector(
      transform,
      directionENU,
      new Cartesian3()
    );
    const upECF = Matrix4.multiplyByPointAsVector(
      transform,
      upENU,
      new Cartesian3()
    );

    // Estimate a rectangle for this view.
    const fieldOfViewHalfAngle = CesiumMath.toRadians(30);
    const groundDistance =
      Math.tan(fieldOfViewHalfAngle) * cameraPosition.height;
    const angle = groundDistance / Ellipsoid.WGS84.minimumRadius;
    const extent = new Rectangle(
      cameraPosition.longitude - angle,
      cameraPosition.latitude - angle,
      cameraPosition.longitude + angle,
      cameraPosition.latitude + angle
    );

    return new CameraView(extent, positionECF, directionECF, upECF);
  }
}

function isVector(
  value: JsonValue
): value is { x: number; y: number; z: number } {
  return (
    isJsonObject(value) &&
    isJsonNumber(value.x) &&
    isJsonNumber(value.y) &&
    isJsonNumber(value.z)
  );
}

const scratchPosition = new Cartesian3();
const scratchOffset = new Cartesian3();
const scratchDirection = new Cartesian3();
const scratchRight = new Cartesian3();
const scratchUp = new Cartesian3();
const scratchTarget = new Cartesian3();
const scratchMatrix4 = new Matrix4();

const scratchQuaternion = new Quaternion();
const scratchMatrix3 = new Matrix3();

const scratchLookAtHeadingPitchRangeQuaternion1 = new Quaternion();
const scratchLookAtHeadingPitchRangeQuaternion2 = new Quaternion();
const scratchHeadingPitchRangeMatrix3 = new Matrix3();

function offsetFromHeadingPitchRange(
  heading: number,
  pitch: number,
  range: number,
  result?: Cartesian3
): Cartesian3 {
  pitch = CesiumMath.clamp(
    pitch,
    -CesiumMath.PI_OVER_TWO,
    CesiumMath.PI_OVER_TWO
  );
  heading = CesiumMath.zeroToTwoPi(heading) - CesiumMath.PI_OVER_TWO;

  const pitchQuat = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Y,
    -pitch,
    scratchLookAtHeadingPitchRangeQuaternion1
  );
  const headingQuat = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Z,
    -heading,
    scratchLookAtHeadingPitchRangeQuaternion2
  );
  const rotQuat = Quaternion.multiply(headingQuat, pitchQuat, headingQuat);
  const rotMatrix = Matrix3.fromQuaternion(
    rotQuat,
    scratchHeadingPitchRangeMatrix3
  );

  const offset = Cartesian3.clone(Cartesian3.UNIT_X, result);
  Matrix3.multiplyByVector(rotMatrix, offset, offset);
  Cartesian3.negate(offset, offset);
  Cartesian3.multiplyByScalar(offset, range, offset);
  return offset;
}

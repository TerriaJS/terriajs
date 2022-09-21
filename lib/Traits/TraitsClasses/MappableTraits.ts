import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import AttributionTraits from "./AttributionTraits";
import { FeatureInfoTemplateTraits } from "./FeatureInfoTraits";

export class RectangleTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "West",
    description: "The westernmost longitude in degrees."
  })
  west?: number;

  @primitiveTrait({
    type: "number",
    name: "South",
    description: "The southernmost longitude in degrees."
  })
  south?: number;

  @primitiveTrait({
    type: "number",
    name: "East",
    description: "The easternmost longitude in degrees."
  })
  east?: number;

  @primitiveTrait({
    type: "number",
    name: "North",
    description: "The northernmost longitude in degrees."
  })
  north?: number;
}

export class LookAtTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Target longitude",
    description: "Target longitude on the WGS84 ellipsoid in degrees"
  })
  targetLongitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Target latitude",
    description: "Target latitude on the WGS84 ellipsoid in degrees"
  })
  targetLatitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Target height",
    description:
      "Target height in meters. Treat it as camera height. A positive value is above the WGS84 ellipsoid. Default to 100 meters."
  })
  targetHeight?: number = 100;

  @primitiveTrait({
    type: "number",
    name: "Heading",
    description:
      "Heading in degrees. Treat it as camera bearing. North is 0. A positive value rotates clockwise, negative anti-clockwise. Default to 0."
  })
  heading?: number = 0;

  @primitiveTrait({
    type: "number",
    name: "Pitch",
    description:
      "Pitch in degrees. Treat it as camera pitch. A positive value is to look down, negative up. Default to 45."
  })
  pitch?: number = 45;

  @primitiveTrait({
    type: "number",
    name: "Range",
    description:
      "The range in meters. It is the distance between the target position and camera position projected onto the local plane. Not negative and default to 500."
  })
  range?: number = 500;
}
export class VectorTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "x",
    description: "X component of vector in the Earth-centered Fixed frame."
  })
  x?: number;

  @primitiveTrait({
    type: "number",
    name: "y",
    description: "Y component of vector in the Earth-centered Fixed frame."
  })
  y?: number;

  @primitiveTrait({
    type: "number",
    name: "z",
    description: "Z component of vector in the Earth-centered Fixed frame."
  })
  z?: number;
}
export class CameraTraits extends RectangleTraits {
  @objectTrait({
    type: VectorTraits,
    name: "position",
    description:
      "Position of the camera in the Earth-centered Fixed frame in meters."
  })
  position?: VectorTraits;

  @objectTrait({
    type: VectorTraits,
    name: "direction",
    description:
      "The look direction of the camera in the Earth-centered Fixed frame."
  })
  direction?: VectorTraits;

  @objectTrait({
    type: VectorTraits,
    name: "up",
    description:
      "The up vector direction of the camera in the Earth-centered Fixed frame."
  })
  up?: VectorTraits;
}

export class IdealZoomTraits extends ModelTraits {
  @objectTrait({
    type: LookAtTraits,
    name: "Look at",
    description: "Parameters for camera to look at a target."
  })
  lookAt?: LookAtTraits;

  @objectTrait({
    type: CameraTraits,
    name: "Camera",
    description:
      "Use camera position, direction and up if fully defined. Otherwise use rectangle if fully defined."
  })
  camera?: CameraTraits;
}
export class InitialMessageTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Title",
    description: "The title of the message."
  })
  title?: string;

  @primitiveTrait({
    type: "string",
    name: "Content",
    description: "The content of the message."
  })
  content?: string;

  @primitiveTrait({
    type: "string",
    name: "Key",
    description:
      "Identifier. If multiple messages with the same key are triggered, only the first will be displayed."
  })
  key?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Confirmation",
    description: "Whether the message requires confirmation."
  })
  confirmation?: boolean;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description:
      "If `confirmation` is true, the text to put on the confirmation button."
  })
  confirmText?: string;

  @primitiveTrait({
    type: "number",
    name: "Width",
    description: "Width of the message."
  })
  width?: number;

  @primitiveTrait({
    type: "number",
    name: "height",
    description: "Height of the message."
  })
  height?: number;
}

export default class MappableTraits extends mixTraits(AttributionTraits) {
  @objectTrait({
    type: RectangleTraits,
    name: "Rectangle",
    description:
      "The bounding box rectangle that contains all the data in this catalog item."
  })
  rectangle?: RectangleTraits;

  @objectTrait({
    type: IdealZoomTraits,
    name: "Ideal zoom",
    description: "Override default ideal zoom if the given values are valid."
  })
  idealZoom?: IdealZoomTraits;

  @primitiveTrait({
    type: "boolean",
    name: "Disable Preview",
    description:
      "Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load."
  })
  disablePreview: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Disable zoom to",
    description:
      "Disables the zoom to (aka 'Ideal Zoom') button in the workbench."
  })
  disableZoomTo: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Zoom on enable",
    description:
      "Zoom to dataset when added to workbench. Doesn't work if `disableZoomTo` is true."
  })
  zoomOnAddToWorkbench: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Show",
    description:
      "Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel."
  })
  show: boolean = true;

  @objectTrait({
    name: "Initial message",
    type: InitialMessageTraits,
    description:
      "A message to show when the user adds the catalog item to the workbench. Useful for showing disclaimers."
  })
  initialMessage?: InitialMessageTraits;

  @objectTrait({
    type: FeatureInfoTemplateTraits,
    name: "Feature info template",
    description:
      "A template object for formatting content in feature info panel"
  })
  featureInfoTemplate?: FeatureInfoTemplateTraits;

  @primitiveTrait({
    type: "string",
    name: "Show string if (feature info) property value is null",
    description:
      "If the value of a property is null or undefined, show the specified string as the value of the property. Otherwise, the property name will not be listed at all."
  })
  showStringIfPropertyValueIsNull?: string;

  @primitiveTrait({
    type: "number",
    name: "Maximum shown feature infos",
    description:
      'The maximum number of "feature infos" that can be displayed in feature info panel.'
  })
  maximumShownFeatureInfos?: number;
}

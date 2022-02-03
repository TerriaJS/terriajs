import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import AttributionTraits from "./AttributionTraits";

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

export class IdealZoomTraits extends ModelTraits {
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
}

import primitiveTrait from "./Decorators/primitiveTrait";
import objectTrait from "./Decorators/objectTrait";
import ModelTraits from "./ModelTraits";
import LatLonHeightTraits from "./TraitsClasses/LatLonHeightTraits";
import HeadingPitchRollTraits from "./TraitsClasses/HeadingPitchRollTraits";

export class CornerPointsStyleTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Pixel size",
    description: "Pixel size of the corner point"
  })
  pixelSize?: number;

  @primitiveTrait({
    type: "string",
    name: "Color",
    description: "Corner point color. Can be any valid CSS color string."
  })
  color?: string;
}

export class BoxSizeTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Length",
    description: "Length of the box"
  })
  length?: number;

  @primitiveTrait({
    type: "string",
    name: "Length",
    description: "Length of the box"
  })
  width?: number;

  @primitiveTrait({
    type: "string",
    name: "Length",
    description: "Length of the box"
  })
  height?: number;
}

export default class BoxDrawingTraits extends ModelTraits {
  @objectTrait({
    type: LatLonHeightTraits,
    name: "Box position",
    description: "Latitude, longitude and height of the box in degrees"
  })
  position?: LatLonHeightTraits;

  @objectTrait({
    type: BoxSizeTraits,
    name: "Box dimension",
    description: "Length, width and height of the box"
  })
  size?: BoxSizeTraits;

  @objectTrait({
    type: HeadingPitchRollTraits,
    name: "Rotation",
    description: "Rotation specified as heading, pitch and roll in degrees."
  })
  rotation?: HeadingPitchRollTraits;

  @objectTrait({
    type: CornerPointsStyleTraits,
    name: "Corner points styling",
    description: "Corner points styling"
  })
  cornerPointsStyle?: CornerPointsStyleTraits;
}

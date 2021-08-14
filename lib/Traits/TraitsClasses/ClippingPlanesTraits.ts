import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";

export class ClippingPlaneDefinitionTraits extends ModelTraits {
  @primitiveTrait({
    name: "Distance",
    type: "number",
    description:
      " The shortest distance from the origin to the plane. The sign of distance determines which side of the plane the origin is on. If distance is positive, the origin is in the half-space in the direction of the normal; if negative, the origin is in the half-space opposite to the normal; if zero, the plane passes through the origin."
  })
  distance: number = 0;

  @primitiveArrayTrait({
    name: "Normal Cartesian3",
    type: "number",
    description: "The plane's normal (normalized)."
  })
  normal: number[] = [];
}

export class ClippingPlaneCollectionTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Enabled Clipping Plane",
    description: "Determines whether the clipping planes are active."
  })
  enabled: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "UnionClippingRegions",
    description:
      "If true, a region will be clipped if it is on the outside of any plane in the collection. Otherwise, a region will only be clipped if it is on the outside of every plane."
  })
  unionClippingRegions: boolean = false;

  @primitiveTrait({
    type: "number",
    name: "Edge Width",
    description:
      "The width, in pixels, of the highlight applied to the edge along which an object is clipped."
  })
  edgeWidth?: number;

  @primitiveTrait({
    type: "string",
    name: "Edge Color",
    description:
      "The color applied to highlight the edge along which an object is clipped."
  })
  edgeColor?: string;

  @objectArrayTrait({
    type: ClippingPlaneDefinitionTraits,
    name: "Clipping Plane Array",
    description:
      "An array of ClippingPlane objects used to selectively disable rendering on the outside of each plane.",
    idProperty: "index"
  })
  planes?: ClippingPlaneDefinitionTraits[];

  @primitiveArrayTrait({
    name: "Model Matrix",
    type: "number",
    description:
      "The 4x4 transformation matrix specifying an additional transform relative to the clipping planes original coordinate system."
  })
  modelMatrix?: number[];
}

export default class ClippingPlanesTraits extends ModelTraits {
  @objectTrait({
    type: ClippingPlaneCollectionTraits,
    name: "ClippingPlanes",
    description:
      "The ClippingPlaneCollection used to selectively disable rendering the tileset."
  })
  clippingPlanes?: ClippingPlaneCollectionTraits;
}

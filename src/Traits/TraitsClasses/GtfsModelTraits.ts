import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import GltfTraits from "./GltfTraits";
import UrlTraits from "./UrlTraits";

export class ColorGroupTraits extends ModelTraits {
  @primitiveTrait({
    name: "Color",
    description: "CSS color string",
    type: "string"
  })
  color?: string;

  @primitiveTrait({
    name: "Regular Expression",
    description: "Regular expression to match on the specified property",
    type: "string"
  })
  regExp?: string;
}

export class ColorModelsByPropertyTraits extends ModelTraits {
  @primitiveTrait({
    name: "Property",
    description: "Path to the property used to choose the color",
    type: "string"
  })
  property?: string;

  @objectArrayTrait({
    type: ColorGroupTraits,
    name: "Color Groups",
    description: "",
    idProperty: "index"
  })
  colorGroups?: ColorGroupTraits[];
}

export default class GtfsModelTraits extends mixTraits(GltfTraits, UrlTraits) {
  @primitiveTrait({
    name: "Maximum draw distance",
    description:
      "The farthest distance from the camera that the model will still be drawn",
    type: "number"
  })
  maximumDistance?: number;

  @primitiveTrait({
    name: "Maximum scale",
    description:
      "The maximum scale size of a model. This property is used as an upper limit for scaling due to `minimumPixelSize`",
    type: "number"
  })
  maximumScale?: number;

  @primitiveTrait({
    name: "Minimum pixel size",
    description:
      "The minimum pixel size of the model regardless of zoom. This can be used to ensure that a model is visible even when the viewer zooms out. When 0.0, no minimum size is enforced",
    type: "number"
  })
  minimumPixelSize?: number;

  @objectTrait({
    name: "Color models by property",
    description:
      "Color entity models by reguler expression match of a property of an entity",
    type: ColorModelsByPropertyTraits
  })
  colorModelsByProperty?: ColorModelsByPropertyTraits;
}

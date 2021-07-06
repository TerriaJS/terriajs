import GltfTraits from "./GltfTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";

export default class GtfsModelTraits extends mixTraits(GltfTraits, UrlTraits) {
  @primitiveTrait({
    name: "Bearing direction property",
    description: "Path to the bearing direction",
    type: "string"
  })
  bearingDirectionProperty?: string;

  @primitiveTrait({
    name: "Compass direction property",
    description: "Path to the compass direction",
    type: "string"
  })
  compassDirectionProperty?: string;

  @primitiveTrait({
    name: "Maximum draw distance",
    description:
      "The farthest distance from the camera that the model will still be drawn",
    type: "number"
  })
  maximumDistance?: number;
}

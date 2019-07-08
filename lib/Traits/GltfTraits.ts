import objectTrait from "./objectTrait";
import LatLonHeightTraits from "./LatLonHeightTraits";
import primitiveTrait from "./primitiveTrait";
import ModelTraits from "./ModelTraits";

export default class GltfTraits extends ModelTraits {
  @objectTrait({
    type: LatLonHeightTraits,
    name: "Origin",
    description:
      "The origin of the model, expressed as a longitude and latitude in degrees and a height in meters. If this property is specified, the model's axes will have X pointing East, Y pointing North, and Z pointing Up. If not specified, the model is located in the Earth-Centered Earth-Fixed frame."
  })
  origin?: LatLonHeightTraits;

  @primitiveTrait({
    type: "string",
    name: "Up axis",
    description:
      "The model's up-axis. By default models are y-up according to the glTF spec, however geo-referenced models will typically be z-up. Valid values are 'X', 'Y', or 'Z'."
  })
  upAxis?: string;

  @primitiveTrait({
    type: "string",
    name: "Forward axis",
    description:
      "The model's forward axis. By default, glTF 2.0 models are Z-forward according to the glTF spec, however older glTF (1.0, 0.8) models used X-forward. Valid values are 'X' or 'Z'."
  })
  forwardAxis?: string;

  @primitiveTrait({
    type: "number",
    name: "Scale",
    description: "The scale factor to apply to the model"
  })
  scale?: number;

  @primitiveTrait({
    type: "string",
    name: "Shadows",
    description:
      'Indicates whether this tileset casts and receives shadows. Valid values are "NONE", "BOTH", "CAST", and "RECEIVE".'
  })
  shadows?: string = "NONE";
}

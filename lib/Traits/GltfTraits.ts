import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";
import TransformationTraits from "./TransformationTraits";

export default class GltfTraits extends mixTraits(TransformationTraits) {
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
    type: "string",
    name: "Shadows",
    description:
      'Indicates whether this tileset casts and receives shadows. Valid values are "NONE", "BOTH", "CAST", and "RECEIVE".'
  })
  shadows?: string = "NONE";
}

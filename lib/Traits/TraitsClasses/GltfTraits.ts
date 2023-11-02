import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import ShadowTraits from "./ShadowTraits";
import TransformationTraits from "./TransformationTraits";

export default class GltfTraits extends mixTraits(
  MappableTraits,
  TransformationTraits,
  ShadowTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
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
    name: "Height reference",
    description:
      "Position relative to the ground. Accepted values are NONE, CLAMP_TO_GROUND & RELATIVE_TO_GROUND as described in the cesium doc - https://cesium.com/docs/cesiumjs-ref-doc/global.html#HeightReference"
  })
  heightReference = "NONE";
}

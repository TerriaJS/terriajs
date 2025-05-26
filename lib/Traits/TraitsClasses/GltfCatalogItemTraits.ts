import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CesiumIonTraits from "./CesiumIonTraits";
import GltfTraits from "./GltfTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates one catalog item from url that points to a gltf file.`,
  example: {
    name: "gltf example",
    type: "gltf",
    url: "https://tiles.terria.io/terriajs-examples/czml/geelong_mini_demo_bin_linux_v1.0-draft_x64.gltf",
    origin: {
      longitude: 144.3569,
      latitude: -38.14688,
      height: -16
    },
    heightReference: "CLAMP_TO_TERRAIN",
    id: "some unique id"
  }
})
export default class GltfCatalogItemTraits extends mixTraits(
  UrlTraits,
  AutoRefreshingTraits,
  PlaceEditorTraits,
  GltfTraits,
  CesiumIonTraits
) {}

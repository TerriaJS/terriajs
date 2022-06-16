import mixTraits from "../mixTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import GltfTraits from "./GltfTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";

export default class GltfCatalogItemTraits extends mixTraits(
  AutoRefreshingTraits,
  PlaceEditorTraits,
  GltfTraits
) {}

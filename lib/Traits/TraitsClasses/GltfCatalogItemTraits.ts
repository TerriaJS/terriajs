import mixTraits from "../mixTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import GltfTraits from "./GltfTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";
import UrlTraits from "./UrlTraits";

export default class GltfCatalogItemTraits extends mixTraits(
  UrlTraits,
  AutoRefreshingTraits,
  PlaceEditorTraits,
  GltfTraits
) {}

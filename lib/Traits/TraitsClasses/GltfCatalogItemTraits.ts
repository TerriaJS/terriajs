import CatalogMemberTraits from "./CatalogMemberTraits";
import GltfTraits from "./GltfTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export default class GltfCatalogItemTraits extends mixTraits(
  AutoRefreshingTraits,
  PlaceEditorTraits,
  GltfTraits
) {}

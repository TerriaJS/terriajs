import CatalogMemberTraits from "./CatalogMemberTraits";
import GltfTraits from "./GltfTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";

export default class GltfCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  AutoRefreshingTraits,
  CatalogMemberTraits,
  PlaceEditorTraits,
  GltfTraits
) {}

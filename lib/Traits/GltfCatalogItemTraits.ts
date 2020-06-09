import CatalogMemberTraits from "./CatalogMemberTraits";
import GltfTraits from "./GltfTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";

export default class GltfCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  PlaceEditorTraits,
  GltfTraits
) {}

import CatalogMemberTraits from "./CatalogMemberTraits";
import GltfTraits from "./GltfTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";

export default class GltfCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  GltfTraits
) {}

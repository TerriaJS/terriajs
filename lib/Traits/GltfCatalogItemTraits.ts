import mixTraits from "./mixTraits";

import UrlTraits from "./UrlTraits";

import MappableTraits from "./MappableTraits";

import CatalogMemberTraits from "./CatalogMemberTraits";

import GltfTraits from "./GltfTraits";

export default class GltfCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  GltfTraits
) {}

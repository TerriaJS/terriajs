import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";

export default class ArcGisTerrainCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {}

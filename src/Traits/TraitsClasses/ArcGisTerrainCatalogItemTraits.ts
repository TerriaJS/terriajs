import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import UrlTraits from "./UrlTraits";

export default class ArcGisTerrainCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}

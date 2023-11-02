import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import UrlTraits from "./UrlTraits";

export default class ArcGisFeatureServerCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}

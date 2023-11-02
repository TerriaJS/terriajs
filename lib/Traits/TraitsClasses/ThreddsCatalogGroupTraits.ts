import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export default class ThreddsCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}

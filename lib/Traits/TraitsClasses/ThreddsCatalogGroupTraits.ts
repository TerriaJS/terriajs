import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";

export default class ThreddsCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits
) {}

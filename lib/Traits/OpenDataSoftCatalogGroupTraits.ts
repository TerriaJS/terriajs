import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";

export default class OpenDataSoftCatalogGroupTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  GroupTraits
) {}

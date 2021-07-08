import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import UrlTraits from "./UrlTraits";

export default class SocrataCatalogGroupTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  GroupTraits
) {}

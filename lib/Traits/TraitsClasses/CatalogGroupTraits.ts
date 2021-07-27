import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";

export default class CatalogGroupTraits extends mixTraits(
  GroupTraits,
  CatalogMemberTraits
) {}

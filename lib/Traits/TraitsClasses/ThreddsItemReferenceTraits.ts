import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";

export default class ThreddsItemReferenceTraits extends mixTraits(
  UrlTraits,
  CatalogMemberReferenceTraits
) {}

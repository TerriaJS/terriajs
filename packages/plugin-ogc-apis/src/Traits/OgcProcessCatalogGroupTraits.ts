import { CatalogMemberTraits, mixTraits } from "terriajs-plugin-api";
import GroupTraits from "terriajs/lib/Traits/TraitsClasses/GroupTraits";
import UrlTraits from "terriajs/lib/Traits/TraitsClasses/UrlTraits";

export default class OgcProcessCatalogGroupTraits extends mixTraits(
  CatalogMemberTraits,
  GroupTraits,
  UrlTraits
) {}

import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import SdmxCommonTraits from "./SdmxCommonTraits";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export default class SdmxCatalogGroupTraits extends mixTraits(
  SdmxCommonTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  GroupTraits
) {}

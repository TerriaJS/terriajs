import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import objectArrayTrait from "./objectArrayTrait";

export class RegionType extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Dimension ID"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Region type to use for a given dimension ID."
  })
  regionType?: string;
}

export class SdmxCommonTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits
) {
  @objectArrayTrait({
    type: RegionType,
    idProperty: "id",
    name: "Region dimension mapping",
    description: "Manual region type overrides for dimensions"
  })
  regionTypeMap?: RegionType[];
}

export default class SdmxCatalogGroupTraits extends mixTraits(
  GroupTraits,
  SdmxCommonTraits
) {}

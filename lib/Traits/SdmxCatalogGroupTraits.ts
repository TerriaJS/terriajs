import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import objectArrayTrait from "./objectArrayTrait";
import primitiveArrayTrait from "./primitiveArrayTrait";

export class RegionTypeMap extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Resource ID"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Region type to use for a given concepts ID."
  })
  regionType?: string;
}

export class SdmxCommonTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits
) {
  @primitiveArrayTrait({
    type: "string",
    name: "Concepts used to find regions",
    description: "Concepts used to find regions"
  })
  regionConcepts?: string[];

  @objectArrayTrait({
    type: RegionTypeMap,
    idProperty: "index",
    name: "Region concepts mapping",
    description: "Manual region type overrides for concepts"
  })
  regionConceptRegionTypeMap?: RegionTypeMap[];

  @primitiveArrayTrait({
    type: "string",
    name: "Concepts used to find region types",
    description: "Concepts used to find region types"
  })
  regionTypeConcepts?: string[];

  @primitiveArrayTrait({
    type: "string",
    name: "Concepts used to find region types",
    description: "Concepts used to find region types"
  })
  allowUndefinedConcepts?: string[];
}

export default class SdmxCatalogGroupTraits extends mixTraits(
  GroupTraits,
  SdmxCommonTraits
) {}

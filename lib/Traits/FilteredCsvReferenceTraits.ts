import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";
import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export class FilterTraits extends ModelTraits {
  @primitiveTrait({
    name: "Column",
    description: "Which column to filter by",
    type: "string"
  })
  column?: string;

  @primitiveTrait({
    name: "Value",
    description:
      "The value that must be present in the named column for a row to not be filtered out",
    type: "string"
  })
  value?: string;
}

export default class FilteredCsvReferenceTraits extends mixTraits(
  CatalogMemberReferenceTraits,
  UrlTraits
) {
  @anyTrait({
    name: "Override",
    description: "The properties to apply to the csv item"
  })
  csvItemConfig?: JsonObject;

  @objectArrayTrait({
    name: "Filter",
    description: "Filter to apply to csv data",
    type: FilterTraits,
    idProperty: "column"
  })
  filters?: FilterTraits[];
}

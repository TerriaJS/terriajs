import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import MagdaDistributionFormatTraits from "./MagdaDistributionFormatTraits";
import mixTraits from "./mixTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class MagdaCatalogItemTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    name: "Dataset ID",
    description:
      "The ID of the MAGDA dataset referred to by this catalog item. Either this property " +
      "or `Distribution ID` must be specified. If `Dataset ID` is specified too, and this " +
      "distribution is not found, _any_ supported distribution may be used instead, " +
      "depending on the value of `Allow Any Distribution if Distribution ID Not Found`.",
    type: "string"
  })
  datasetId?: string;

  @primitiveTrait({
    name: "Distribution ID",
    description:
      "The ID of the MAGDA distribution referred to by this catalog item. Either this property " +
      "or `Dataset ID` must be specified. The first distribution of a supported type " +
      "in this dataset will be used.",
    type: "string"
  })
  distributionId?: string;

  @objectArrayTrait({
    name: "Distribution Formats",
    description:
      "The supported distribution formats and their mapping to Terria types. These are listed in order of preference.",
    type: MagdaDistributionFormatTraits,
    idProperty: "id"
  })
  distributionFormats?: MagdaDistributionFormatTraits[];

  @anyTrait({
    name: "Definition",
    description:
      "The catalog member definition to use for _all_ catalog items, regardless of type. The format-specified definition will be layered on top of this one."
  })
  definition?: JsonObject;
}

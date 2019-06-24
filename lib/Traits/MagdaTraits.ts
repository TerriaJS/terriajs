import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import MagdaDistributionFormatTraits from "./MagdaDistributionFormatTraits";
import mixTraits from "./mixTraits";
import objectArrayTrait from "./objectArrayTrait";
import UrlTraits from "./UrlTraits";

export default class MagdaTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits
) {
  @objectArrayTrait({
    name: "Distribution Formats",
    description:
      "The supported distribution formats and their mapping to Terria types. " +
      "These are listed in order of preference.",
    type: MagdaDistributionFormatTraits,
    idProperty: "id"
  })
  distributionFormats?: MagdaDistributionFormatTraits[];

  @anyTrait({
    name: "Definition",
    description:
      "The catalog member definition to use for _all_ catalog items in this " +
      "group, regardless of type. The format-specified definition will be " +
      "layered on top of this one."
  })
  definition?: JsonObject;
}

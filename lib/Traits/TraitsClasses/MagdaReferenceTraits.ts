import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import MagdaDistributionFormatTraits from "./MagdaDistributionFormatTraits";
import mixTraits from "../mixTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class MagdaReferenceTraits extends mixTraits(
  CatalogMemberReferenceTraits,
  UrlTraits
) {
  @primitiveTrait({
    name: "Record ID",
    description: "The ID of the Magda record referred to by this reference.",
    type: "string"
  })
  recordId?: string;

  @anyTrait({
    name: "Magda Record Data",
    description:
      "The available representation of the Magda record as returned by " +
      "the Magda registry API. This representation may not include all " +
      "aspects and it may not be dereferenced."
  })
  magdaRecord?: JsonObject;

  @anyTrait({
    name: "Override",
    description:
      "The properties to apply to the dereferenced item, overriding properties that " +
      "come from Magda itself."
  })
  override?: JsonObject;

  @objectArrayTrait({
    name: "Distribution Formats",
    description:
      "The supported distribution formats and their mapping to Terria types. " +
      "These are listed in order of preference.",
    type: MagdaDistributionFormatTraits,
    idProperty: "id"
  })
  distributionFormats?: MagdaDistributionFormatTraits[];
}

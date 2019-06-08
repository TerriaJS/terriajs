import MagdaTraits from "./MagdaTraits";
import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";

export default class MagdaCatalogItemTraits extends mixTraits(MagdaTraits) {
  @primitiveTrait({
    name: "Dataset ID",
    description:
      "The ID of the Magda dataset referred to by this catalog item.",
    type: "string"
  })
  datasetId?: string;

  @primitiveTrait({
    name: "Distribution ID",
    description:
      "The ID of the preferred Magda distribution to use. If this property " +
      "is not specified, the distribution that matches the earliest format " +
      "in the `Distribution Formats` list will be used.",
    type: "string"
  })
  distributionId?: string;
}

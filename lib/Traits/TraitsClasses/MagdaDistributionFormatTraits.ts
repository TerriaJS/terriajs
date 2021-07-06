import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class MagdaDistributionFormatTraits extends ModelTraits {
  @primitiveTrait({
    name: "ID",
    description: "The ID of this distribution format.",
    type: "string"
  })
  id?: string;

  @primitiveTrait({
    name: "Format Regular Expression",
    description:
      "A regular expression that is matched against the distribution's format.",
    type: "string"
  })
  formatRegex?: string;

  @primitiveTrait({
    name: "URL Regular Expression",
    description:
      "A regular expression that is matched against the distribution's URL.",
    type: "string"
  })
  urlRegex?: string;

  @anyTrait({
    name: "Definition",
    description:
      "The catalog member definition to use when the URL and Format regular expressions match. The `URL` property will also be set."
  })
  definition?: JsonObject | null;

  static isRemoval(format: MagdaDistributionFormatTraits) {
    return format.definition === null;
  }
}

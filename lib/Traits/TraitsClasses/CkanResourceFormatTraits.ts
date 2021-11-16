import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class CkanResourceFormatTraits extends ModelTraits {
  @primitiveTrait({
    name: "ID",
    description: "The ID of this distribution format.",
    type: "string"
  })
  id?: string;

  @primitiveTrait({
    name: "Format Regular Expression",
    description:
      "A regular expression that is matched against the distribution's format. This must be defined for this format to be used",
    type: "string"
  })
  formatRegex?: string;

  @primitiveTrait({
    name: "URL Regular Expression",
    description:
      "A regular expression that is matched against the url, this will only be used if `formatRegex` matches.",
    type: "string"
  })
  urlRegex?: string;

  @anyTrait({
    name: "Definition",
    description:
      "The catalog member definition to use when the URL and Format regular expressions match. The `URL` property will also be set."
  })
  definition?: JsonObject | null;

  static isRemoval(format: CkanResourceFormatTraits) {
    return format.definition === null;
  }
}

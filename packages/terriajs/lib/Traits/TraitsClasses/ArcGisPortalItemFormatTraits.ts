import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class ArcGisPortalItemFormatTraits extends ModelTraits {
  @primitiveTrait({
    name: "ID",
    description: "The ID of this items format.",
    type: "string"
  })
  id?: string;

  @anyTrait({
    name: "Url Regular Expression",
    description: "A regular expression that is matched against the items url."
  })
  urlRegex?: string | RegExp;

  @primitiveTrait({
    name: "Format Regular Expression",
    description:
      "A regular expression that is matched against the item format.",
    type: "string"
  })
  formatRegex?: string;

  @anyTrait({
    name: "Definition",
    description:
      "The catalog member definition to use when the URL and Format regular expressions match. The `URL` property will also be set."
  })
  definition?: JsonObject | null;
}

import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class UrlTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "URL",
    description: "The base URL of the file or service."
  })
  url?: string;
}

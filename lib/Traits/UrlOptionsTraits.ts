import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class UrlOptionsTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Proxy URL",
    description: "A proxy service that must be used."
  })
  proxyUrl?: string;
}

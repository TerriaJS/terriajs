import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class ProxyUrlTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Proxy URL",
    description: "The proxy URL of a file or service."
  })
  proxyUrl?: string;
}

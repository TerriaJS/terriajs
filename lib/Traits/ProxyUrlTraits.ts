import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class ProxyUrlTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Proxy URL",
    description:
      "An alternative proxy URL of a file or service. If present, it will override the default proxy URL (terriajs-server)."
  })
  proxyUrl?: string;
}

import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

interface UrlTraits {
  url?: string;
  cacheDuration?: string;
}

class UrlTraits extends ModelTraits implements UrlTraits {
  @primitiveTrait({
    type: "string",
    name: "URL",
    description: "The base URL of the file or service."
  })
  url?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Force proxy",
    description: "Force the default proxy to be used for all network requests."
  })
  forceProxy = false;

  @primitiveTrait({
    type: "string",
    name: "Cache Duration",
    description:
      "The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds)."
  })
  cacheDuration?: string;
}

export default UrlTraits;

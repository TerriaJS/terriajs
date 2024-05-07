import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

class UrlTraits extends ModelTraits {
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
  forceProxy?: boolean;

  @primitiveTrait({
    type: "string",
    name: "Cache Duration",
    description:
      "The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds)."
  })
  cacheDuration?: string;
}

interface UrlTraits {
  // Add traits here that you want to override from some Mixin or Model class
  // without generating TS2611 type error.
  url?: UrlTraits["url"];
  cacheDuration?: UrlTraits["cacheDuration"];
  forceProxy?: UrlTraits["forceProxy"];
}

export default UrlTraits;

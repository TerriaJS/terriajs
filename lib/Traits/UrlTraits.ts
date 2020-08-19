import objectTrait from "./objectTrait";
import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import UrlOptionsTraits from "./UrlOptionsTraits";

export default class UrlTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "URL",
    description: "The base URL of the file or service."
  })
  url?: string;

  @objectTrait({
    type: UrlOptionsTraits,
    name: "URL options",
    description: "URL options to be used. E.g. may include proxyUrl."
  })
  urlOptions?: UrlOptionsTraits;

  @primitiveTrait({
    type: "boolean",
    name: "Force proxy",
    description:
      "Force the default proxy to be used for all network requests. This rule is overridden by urlOptions.proxyUrl."
  })
  forceProxy = false;

  @primitiveTrait({
    type: "string",
    name: "Cache Duration",
    description:
      "The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). Ignored if urlOptions.proxyUrl exists."
  })
  cacheDuration?: string;
}

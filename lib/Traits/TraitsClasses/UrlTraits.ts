import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

/* eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging */
class UrlTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "URL",
    description: "The base URL of the file or service."
  })
  get url(): string | undefined {
    return;
  }

  @primitiveTrait({
    type: "boolean",
    name: "Force proxy",
    description: "Force the default proxy to be used for all network requests."
  })
  get forceProxy(): boolean | undefined {
    return;
  }

  @primitiveTrait({
    type: "string",
    name: "Cache Duration",
    description:
      "The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds)."
  })
  get cacheDuration(): string | undefined {
    return;
  }
}

/* eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging */
interface UrlTraits {
  // Add traits here that you want to override from some Mixin or Model class
  // without generating TS2611 type error.
  url: UrlTraits["url"];
  cacheDuration: UrlTraits["cacheDuration"];
  forceProxy: UrlTraits["forceProxy"];
}

export default UrlTraits;

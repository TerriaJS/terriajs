"use strict";

import UrlMixin from "../../ModelMixins/UrlMixin";
import { BaseModel } from "../Definition/Model";
import UrlReference from "./CatalogReferences/UrlReference";
import isDefined from "../../Core/isDefined";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";

/**
 * The terriajs-server is the default server that proxies a URL associated with a catalog item, if necessary.
 * @param {CatalogItem} [catalogItem] The catalog item.
 * @param {string} url The URL to be proxied.
 * @param {string} [cacheDuration] The cache duration to override catalogItem.cacheDuration.
 * @returns {string} The URL, now cached if necessary.
 */
export default function proxyCatalogItemUrl(
  catalogItem: BaseModel | UrlReference | undefined,
  url: string,
  cacheDuration?: string
) {
  const corsProxy = catalogItem?.terria?.corsProxy;

  if (
    isDefined(corsProxy) &&
    (corsProxy.shouldUseProxy(url) ||
      (UrlMixin.isMixedInto(catalogItem) && catalogItem.forceProxy))
  ) {
    return corsProxy.getURL(
      url,
      defaultValue(
        UrlMixin.isMixedInto(catalogItem) && catalogItem.cacheDuration,
        cacheDuration
      )
    );
  } else {
    return url;
  }
}

/**
 * Similar to {@link proxyCatalogItemUrl}, but only returns proxy base url, not full URL (for example `proxy/`, instead of `proxy/some/other/resource`)
 */
export function proxyCatalogItemBaseUrl(
  catalogItem: BaseModel | UrlReference | undefined,
  url: string,
  cacheDuration?: string
) {
  const corsProxy = catalogItem?.terria?.corsProxy;

  if (
    isDefined(corsProxy) &&
    (corsProxy.shouldUseProxy(url) ||
      (UrlMixin.isMixedInto(catalogItem) && catalogItem.forceProxy))
  ) {
    return corsProxy.getProxyBaseURL(
      defaultValue(
        UrlMixin.isMixedInto(catalogItem) && catalogItem.cacheDuration,
        cacheDuration
      )
    );
  }
}

import mixTraits from "./mixTraits";
import CatalogFunctionTraits from "./CatalogFunctionTraits";
import UrlTraits from "./UrlTraits";

export default class YDYRCatalogItemTraits extends mixTraits(
  UrlTraits,
  CatalogFunctionTraits
) {}

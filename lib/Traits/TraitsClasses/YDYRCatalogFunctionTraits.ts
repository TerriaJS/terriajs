import mixTraits from "../mixTraits";
import CatalogFunctionTraits from "./CatalogFunctionTraits";
import UrlTraits from "./UrlTraits";

export default class YDYRCatalogFunctionTraits extends mixTraits(
  UrlTraits,
  CatalogFunctionTraits
) {}

import DiffableTraits from "./DiffableTraits";
import mixTraits from "./mixTraits";
import WebMapServiceCatalogItemTraits from "./WebMapServiceCatalogItemTraits";

export default class DiffableWebMapServiceCatalogItemTraits extends mixTraits(
  WebMapServiceCatalogItemTraits,
  DiffableTraits
) {}

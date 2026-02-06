import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import CesiumIonTraits from "./CesiumIonTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import SearchableCatalogItemTraits from "./SearchableCatalogItemTraits";
import TableTraits from "./Table/TableTraits";
import UrlTraits from "./UrlTraits";

export default class KmlCatalogItemTraits extends mixTraits(
  SearchableCatalogItemTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  CesiumIonTraits,
  TableTraits
) {
  @primitiveTrait({
    type: "string",
    name: "kmlString",
    description: "A kml string"
  })
  kmlString?: string;
}

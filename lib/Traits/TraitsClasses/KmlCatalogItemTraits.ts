import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import CesiumIonTraits from "./CesiumIonTraits";
import ExportableTraits from "./ExportableTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import SearchableCatalogItemTraits from "./SearchableCatalogItemTraits";
import UrlTraits from "./UrlTraits";

export default class KmlCatalogItemTraits extends mixTraits(
  SearchableCatalogItemTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  CesiumIonTraits,
  ExportableTraits
) {
  @primitiveTrait({
    type: "string",
    name: "kmlString",
    description: "A kml string"
  })
  kmlString?: string;
}

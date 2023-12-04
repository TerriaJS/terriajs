import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import UrlTraits from "./UrlTraits";

export default class KmlCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    type: "string",
    name: "KML data source URI.",
    description:
      "Overrides the url to use for resolving relative links and other KML network features."
  })
  dataSourceUri?: string;

  @primitiveTrait({
    type: "string",
    name: "kmlString",
    description: "A kml string"
  })
  kmlString?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Clamp to Ground",
    description:
      "true if we want the geometry features (Polygons, LineStrings and LinearRings) clamped to the ground"
  })
  clampToGround: boolean = true;
}

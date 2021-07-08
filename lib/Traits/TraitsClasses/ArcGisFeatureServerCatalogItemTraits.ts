import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class ArcGisFeatureServerCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Clamp to Ground",
    description:
      "Whether the features in this service should be clamped to the terrain surface."
  })
  clampToGround: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Use style information from service",
    description:
      "Whether to symbolise the data using the drawingInfo object available in the service endpoint."
  })
  useStyleInformationFromService: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "layerDef",
    description:
      "The 'layerDef' string to pass to the server when requesting geometry."
  })
  layerDef: string = "1=1";
}

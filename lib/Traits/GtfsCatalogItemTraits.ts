import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import TableTraits from "./TableTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import TimeVaryingTraits from "./TimeVaryingTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import primitiveTrait from "./primitiveTrait";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import GltfTraits from "./GltfTraits";
import objectTrait from "./objectTrait";
import GltfCatalogItemTraits from "./GltfCatalogItemTraits";
import GtfsModelTraits from "./GtfsModelTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import FeatureInfoTemplateTraits from "./FeatureInfoTraits";

export default class GtfsCatalogItemTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  MappableTraits,
  RasterLayerTraits,
  LayerOrderingTraits,
  AutoRefreshingTraits,
  FeatureInfoTraits
) {
  @primitiveTrait({
    name: "GTFS API key",
    description:
      "The key that should be used when querying the GTFS API service",
    type: "string"
  })
  apiKey?: string;

  @primitiveTrait({
    name: "Image url",
    description:
      "Url for the image to use to represent a vehicle. Recommended size 32x32 pixels.",
    type: "string"
  })
  image?: string;

  @objectTrait({
    name: "Model",
    description: "3D model to use to represent a vehicle.",
    type: GtfsModelTraits
  })
  model?: GtfsModelTraits;
}

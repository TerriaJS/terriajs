import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import GtfsModelTraits from "./GtfsModelTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import ScaleByDistanceTraits from "./ScaleByDistanceTraits";
import UrlTraits from "./UrlTraits";

export default class GtfsCatalogItemTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
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
    name: "Scale Image by Distance",
    description:
      "Describes how marker images are scaled by distance from the viewer.",
    type: ScaleByDistanceTraits
  })
  scaleImageByDistance?: ScaleByDistanceTraits;

  @objectTrait({
    name: "Model",
    description: "3D model to use to represent a vehicle.",
    type: GtfsModelTraits
  })
  model?: GtfsModelTraits;
}

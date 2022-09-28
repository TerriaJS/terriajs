import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GtfsModelTraits from "./GtfsModelTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import OpacityTraits from "./OpacityTraits";
import ScaleByDistanceTraits from "./ScaleByDistanceTraits";
import UrlTraits from "./UrlTraits";

export class HeadersTraits extends ModelTraits {
  @primitiveTrait({
    name: "Name",
    description: "The header name",
    type: "string"
  })
  name?: string;

  @primitiveTrait({
    name: "Value",
    description: "The header value",
    type: "string"
  })
  value?: string;
}

export default class GtfsCatalogItemTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  MappableTraits,
  OpacityTraits,
  LayerOrderingTraits,
  AutoRefreshingTraits
) {
  @objectArrayTrait({
    name: "Headers",
    description: "Extra headers to attach to queries to the GTFS endpoint",
    type: HeadersTraits,
    idProperty: "name"
  })
  headers?: HeadersTraits[];

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

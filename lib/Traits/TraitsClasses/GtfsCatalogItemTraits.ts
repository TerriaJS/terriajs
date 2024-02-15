import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import { traitClass } from "../Trait";
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

@traitClass({
  description: `Creates one catalog item from url that points to a gtfs service.
  
  <strong>Note:</strong> 
  <li>You need to obtain a valid api key for the NSW transport api.</li>
  <li>When the camera is less than <code>maximumDistance</code> (500m) away, bus 3d models (scene.gltf) will be rendered.</li>`,
  example: {
    type: "gtfs",
    url: "https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/buses",
    image: "https://tiles.terria.io/terriajs-examples/gtfs/TfNSW_B.png",
    name: "NSW Live Transport - Buses",
    headers: [
      {
        name: "Authorization",
        value: "apikey put-a-real-api-key-here"
      }
    ],
    refreshInterval: 60,
    featureInfoTemplate: {
      name: "{{vehicle_trip_bus_number}}",
      template:
        "<b>Bus:</b> {{route_short_name}}<br><b>Occupancy:</b> {{occupancy_status_str}}<br><b>Speed:</b> {{speed_km}} km/h<br><b style='padding-right: 5px'>Direction:</b> <span style='transform: rotate({{bearing}}deg); width: 10px; display: inline-block' aria-label='{{bearing}} degrees' role='img' title='{{bearing}} degrees'>&#x2B06;</div>"
    },
    model: {
      url: "https://tiles.terria.io/terriajs-examples/gtfs/lowpoly_bus/scene.gltf",
      scale: 0.3048,
      maximumDistance: 500.0
    },
    id: "some unique id"
  }
})
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

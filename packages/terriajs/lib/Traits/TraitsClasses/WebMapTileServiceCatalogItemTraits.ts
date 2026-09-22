import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import { traitClass } from "../Trait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import LegendTraits from "./LegendTraits";
import MappableTraits from "./MappableTraits";
import UrlTraits from "./UrlTraits";

export class WebMapTileServiceAvailableStyleTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Style Identifier",
    description: "The identifier of the style."
  })
  identifier?: string;

  @primitiveTrait({
    type: "string",
    name: "Title",
    description: "The title of the style."
  })
  title?: string;

  @primitiveTrait({
    type: "string",
    name: "Abstract",
    description: "The abstract describing the style."
  })
  abstract?: string;

  @objectTrait({
    type: LegendTraits,
    name: "Style Name",
    description: "The name of the style."
  })
  legend?: LegendTraits;

  @primitiveTrait({
    type: "string",
    name: "Is Default",
    description: "True if this Style is default; otherwise, false."
  })
  isDefault: boolean = false;
}

export class WebMapTileServiceAvailableLayerStylesTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Layer Name",
    description: "The name of the layer for which styles are available."
  })
  layerName?: string;

  @objectArrayTrait({
    type: WebMapTileServiceAvailableStyleTraits,
    name: "Styles",
    description: "The styles available for this layer.",
    idProperty: "identifier"
  })
  styles?: WebMapTileServiceAvailableStyleTraits[];
}

@traitClass({
  description: `Creates a single item in the catalog from a url that points to a wmts service.`,
  example: {
    type: "wmts",
    id: "a unique id for wmts example",
    name: "wmts example",
    url: "https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/WMTS/1.0.0/WMTSCapabilities.xml",
    layer: "Reference_World_Boundaries_and_Places",
    opacity: 1
  }
})
export default class WebMapTileServiceCatalogItemTraits extends mixTraits(
  LayerOrderingTraits,
  GetCapabilitiesTraits,
  ImageryProviderTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  DiscretelyTimeVaryingTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Is GeoServer",
    description: "True if this WMS is a GeoServer; otherwise, false."
  })
  isGeoServer: boolean = false;

  @primitiveTrait({
    type: "string",
    name: "Layer",
    description: "The layer to display."
  })
  layer?: string;

  @primitiveTrait({
    type: "string",
    name: "Style",
    description: "The style to use with `Layer`."
  })
  style?: string;

  @objectArrayTrait({
    type: WebMapTileServiceAvailableLayerStylesTraits,
    name: "Available Styles",
    description: "The available styles.",
    idProperty: "layerName"
  })
  availableStyles?: WebMapTileServiceAvailableLayerStylesTraits[];

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass to the MapServer when requesting images."
  })
  parameters?: JsonObject;

  @primitiveTrait({
    type: "string",
    name: "Encoding",
    description:
      "The encoding of the tile images. We will try to load the tile images with this encoding, if not available we will fallback to KVP. Supported values are KVP and Restful"
  })
  requestEncoding = "RESTful";

  @primitiveTrait({
    type: "string",
    name: "GetFeatureInfo URL",
    description:
      "URL or RESTful template (with `{i}`/`{j}` pixel placeholders) for `GetFeatureInfo` requests. Defaults to the `FeatureInfo` ResourceURL advertised by GetCapabilities, or to `url` for KVP services."
  })
  getFeatureInfoUrl?: string;

  @primitiveTrait({
    type: "number",
    name: "Maximum Refresh Intervals",
    description:
      "The maximum number of discrete times that can be created by a single " +
      "date range, when specified in the format time/time/periodicity. E.g. " +
      "`2015-04-27T16:15:00/2015-04-27T18:45:00/PT15M` has 11 times."
  })
  maxRefreshIntervals: number = 10000;

  @primitiveArrayTrait({
    type: "string",
    name: "Time Values",
    description:
      "Available times as ISO 8601 timestamps or intervals such as " +
      "`2024-01-01/2024-12-31/P1D`. A nonempty list overrides the times " +
      "advertised by GetCapabilities. Intervals are expanded up to " +
      "`maxRefreshIntervals`. Use `currentTime` to select a time."
  })
  timeValues?: string[];
}

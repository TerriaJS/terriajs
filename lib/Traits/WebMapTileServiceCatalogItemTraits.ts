import { JsonObject } from "../Core/Json";
import anyTrait from "./decorators/anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendTraits from "./LegendTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./decorators/objectArrayTrait";
import objectTrait from "./decorators/objectTrait";
import primitiveTrait from "./decorators/primitiveTrait";
import RasterLayerTraits from "./RasterLayerTraits";
import SplitterTraits from "./SplitterTraits";
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

export default class WebMapServiceCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  LayerOrderingTraits,
  SplitterTraits,
  GetCapabilitiesTraits,
  RasterLayerTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @anyTrait({
    name: "server",
    description: "Which server serves data in this WMTS."
  })
  server?: "geoserver";

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
}

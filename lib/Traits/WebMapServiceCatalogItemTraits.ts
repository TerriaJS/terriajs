import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import RasterLayerTraits from "./RasterLayerTraits";
import UrlTraits from "./UrlTraits";
import MappableTraits from "./MappableTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import SplitterTraits from "./SplitterTraits";

export class LegendTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "URL",
    description: "The URL of the legend image."
  })
  url?: string;

  @primitiveTrait({
    type: "string",
    name: "MIME Type",
    description: "The MIME type of the legend image."
  })
  mimeType?: string;
}

export class WebMapServiceAvailableStyleTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Style Name",
    description: "The name of the style."
  })
  name?: string;

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
  legendUrl?: LegendTraits;
}

export class WebMapServiceAvailableLayerStylesTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Layer Name",
    description: "The name of the layer for which styles are available."
  })
  layerName?: string;

  @objectArrayTrait({
    type: WebMapServiceAvailableStyleTraits,
    name: "Styles",
    description: "The styles available for this layer.",
    idProperty: "name"
  })
  styles?: WebMapServiceAvailableStyleTraits[];
}

export default class WebMapServiceCatalogItemTraits extends mixTraits(
  SplitterTraits,
  DiscretelyTimeVaryingTraits,
  GetCapabilitiesTraits,
  RasterLayerTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Is GeoServer",
    description: "True if this WMS is a GeoServer; otherwise, false."
  })
  isGeoServer: boolean = false;

  @primitiveTrait({
    type: "string",
    name: "Layer(s)",
    description: "The layer or layers to display."
  })
  layers?: string;

  @primitiveTrait({
    type: "string",
    name: "Style(s)",
    description: "The styles to use with each of the `Layer(s)`."
  })
  styles?: string;

  @objectArrayTrait({
    type: WebMapServiceAvailableLayerStylesTraits,
    name: "Available Styles",
    description: "The available styles.",
    idProperty: "layerName"
  })
  availableStyles?: WebMapServiceAvailableLayerStylesTraits[];

  @objectArrayTrait({
    name: "Legend URLs",
    description: "The legends to display on the workbench.",
    type: LegendTraits,
    idProperty: "url"
  })
  legendUrls?: LegendTraits[];

  @primitiveTrait({
    type: "number",
    name: "Minimum Scale Denominator",
    description:
      "The denominator of the largest scale (smallest denominator) for which tiles should be requested. " +
      "For example, if this value is 1000, then tiles representing a scale larger than 1:1000 (i.e. " +
      "numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of " +
      "the largest-available scale, as specified by this property, will be used and will simply get " +
      "blurier as the user zooms in closer."
  })
  minScaleDenominator?: number;

  @primitiveTrait({
    type: "boolean",
    name: "Hide Layer After Minimum Scale Denominator",
    description:
      "True to hide tiles when the `Minimum Scale Denominator` is exceeded. If false, we can zoom in arbitrarily close to the (increasingly blurry) layer."
  })
  hideLayerAfterMinScaleDenominator: boolean = false;
}

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

/**
 * Explicit time-dimension override.
 *
 * Used when a WMTS server does not advertise a `<Dimension>` element in its
 * GetCapabilities response (e.g., GeoServer's GeoWebCache, which strips
 * Dimensions even when the underlying layer has time metadata configured).
 * Lets catalog JSON declare the discrete time set, an ISO range, and/or a
 * default selection without round-tripping through GetCapabilities.
 *
 * Resolution order in `TimeOverrideStratum`:
 *   1. `values` (explicit list) — sorted ascending and used as-is.
 *   2. `start` + `stop` + `period` — expanded via
 *      `createDiscreteTimesFromIsoSegments` (honours `maxRefreshIntervals`).
 *   3. Both absent — stratum returns `undefined` for `discreteTimes` and
 *      falls through to `GetCapabilitiesStratum`, preserving prior behaviour.
 *
 * `defaultValue` selects the initial `currentTime`; absent it, the most
 * recent discrete instant is selected (matches the GetCapabilities path).
 */
export class WebMapTileServiceTimeTraits extends ModelTraits {
  @primitiveArrayTrait({
    type: "string",
    name: "Values",
    description:
      "Explicit list of ISO 8601 timestamps. Used directly as the discrete time set when present."
  })
  values?: string[];

  @primitiveTrait({
    type: "string",
    name: "Start",
    description:
      "ISO 8601 range start. Use together with `stop` and `period` to declare a regular interval that will be expanded via `createDiscreteTimesFromIsoSegments`."
  })
  start?: string;

  @primitiveTrait({
    type: "string",
    name: "Stop",
    description: "ISO 8601 range stop. Use together with `start` and `period`."
  })
  stop?: string;

  @primitiveTrait({
    type: "string",
    name: "Period",
    description:
      "ISO 8601 period (e.g., `P1D`, `PT1H`). Use together with `start` and `stop`."
  })
  period?: string;

  @primitiveTrait({
    type: "string",
    name: "Default Value",
    description:
      "ISO 8601 timestamp to select initially. Falls back to the most recent discrete time when omitted."
  })
  defaultValue?: string;
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
    type: "number",
    name: "Maximum Refresh Intervals",
    description:
      "The maximum number of discrete times that can be created by a single " +
      "date range, when specified in the format time/time/periodicity. E.g. " +
      "`2015-04-27T16:15:00/2015-04-27T18:45:00/PT15M` has 11 times."
  })
  maxRefreshIntervals: number = 10000;

  @objectTrait({
    type: WebMapTileServiceTimeTraits,
    name: "Time",
    description:
      "Explicit time-dimension configuration. Used when the WMTS server does not advertise `<Dimension>` in GetCapabilities (e.g., GeoServer GeoWebCache). When set, this overrides any time dimension parsed from GetCapabilities. When unset, time handling falls through to GetCapabilities (existing behaviour)."
  })
  time?: WebMapTileServiceTimeTraits;
}

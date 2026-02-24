import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { MinMaxLevelTraits } from "./MinMaxLevelTraits";
import UrlTraits from "./UrlTraits";

export class ArcGisImageServerRenderingRule extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "The name of the raster function."
  })
  rasterFunction?: string;

  @primitiveTrait({
    type: "string",
    name: "Description",
    description:
      'optional for well known functions, default is "Raster" for raster function templates.'
  })
  variableName?: string;

  @anyTrait({
    name: "Arguments",
    description:
      "Overwrite the raster function default configuration by specifying argument parameters (argument names and value types are defined by the author of each raster function template and are not discoverable through ArcGis REST API)."
  })
  rasterFunctionArguments?: JsonObject;
}

export class ArcGisImageServerAvailableRasterFunctionTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "The name of the raster function."
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Description",
    description: "The description of the raster function."
  })
  description?: string;

  @primitiveTrait({
    type: "string",
    name: "Unit",
    description: "Help text for the raster function"
  })
  help?: string;
}

@traitClass({
  example: {
    url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/CharlotteLAS/ImageServer",
    type: "esri-imageServer",
    name: "CharlotteLAS"
  }
})
export default class ArcGisImageServerCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  DiscretelyTimeVaryingTraits,
  MinMaxLevelTraits
) {
  @primitiveTrait({
    type: "number",
    name: "Maximum scale",
    description:
      "Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property, will be used and will simply get blurier as the user zooms in closer. Note: maximumLevel overrides this property."
  })
  maximumScale?: number;

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass to the ImageServer when requesting images."
  })
  parameters?: JsonObject;

  @primitiveTrait({
    name: "Token URL",
    description:
      "URL to use for fetching request tokens. Note this will override the token trait if both are set.",
    type: "string"
  })
  tokenUrl?: string;

  @primitiveTrait({
    name: "Token",
    description:
      "Token to use for ArcGiS REST API requests (if not using tokenUrl)",
    type: "string"
  })
  token?: string;

  @primitiveTrait({
    type: "number",
    name: "Maximum Refresh Intervals",
    description:
      "The maximum number of discrete times that can be created by a single " +
      "date range when layer in time-enabled."
  })
  maxRefreshIntervals: number = 10000;

  @primitiveTrait({
    type: "number",
    name: "WKID",
    description:
      "The well-known ID of the spatial reference of the image server. Only Web Mercator (102100 or 102113 or 3857) and WGS84 (4326) are supported."
  })
  wkid?: number = 102100;

  @primitiveTrait({
    name: "Use Pre-Cached Tiles",
    description:
      "If true, the server's pre-cached tiles are used. If false, then the ImageServer exportImage endpoint will be used. This will default to false if parameters (including time) have been specified, otherwise it will default to true if a server supports pre-cached tiles.",
    type: "boolean"
  })
  usePreCachedTiles?: boolean;

  @primitiveArrayTrait({
    name: "Band IDs",
    description: "The band IDs to use when requesting images.",
    type: "number"
  })
  bandIds?: number[];

  @objectTrait({
    name: "Rendering Rule",
    description:
      'The rendering rule to apply to the image service. This must be a JSON object - for example `{"rasterFunction": "RFTAspectColor"}`. Note `allowRasterFunction` must be true for this to be applied.',
    type: ArcGisImageServerRenderingRule
  })
  renderingRule?: ArcGisImageServerRenderingRule;

  @primitiveTrait({
    name: "Allow Raster Function",
    description:
      "If true, then the renderingRule will be applied to the image service. If false, the renderingRule will be ignored. This will default to true if an image service supports raster functions.",
    type: "boolean"
  })
  allowRasterFunction?: boolean;

  @objectArrayTrait({
    type: ArcGisImageServerAvailableRasterFunctionTraits,
    name: "Available raster functions",
    description:
      "The available raster functions for the ImageServer. Defaults to all raster functions in the service if the server supports raster functions. Note: `allowRasterFunction` must be true. To set the default raster function, use the `renderingRule` property.",
    idProperty: "name"
  })
  availableRasterFunctions?: ArcGisImageServerAvailableRasterFunctionTraits[];

  @primitiveTrait({
    name: "Disable raster functions selectors",
    description:
      "When true, disables the dimension selectors in the workbench. This will default to true if the server does not support raster functions.",
    type: "boolean"
  })
  disableRasterFunctionSelectors?: boolean;
}

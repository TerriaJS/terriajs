import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import RasterLayerTraits from "./RasterLayerTraits";
import UrlTraits from "./UrlTraits";

export default class MapboxVectorTileCatalogItemTraits extends mixTraits(
  LayerOrderingTraits,
  FeatureInfoTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  RasterLayerTraits
) {
  @primitiveTrait({
    type: "string",
    name: "lineColor",
    description:
      "The outline color of the features, specified as a CSS color string."
  })
  lineColor = "#000000";

  @primitiveTrait({
    type: "string",
    name: "fillColor",
    description:
      "The fill color of the features, specified as a CSS color string."
  })
  fillColor = "rgba(0,0,0,0)";

  @primitiveTrait({
    type: "string",
    name: "layer",
    description: "The name of the layer to use the Mapbox vector tiles."
  })
  layer?: string;

  @primitiveTrait({
    type: "string",
    name: "idProperty",
    description: "The name of the property that is a unique ID for features."
  })
  idProperty = "FID";

  @primitiveTrait({
    type: "string",
    name: "nameProperty",
    description:
      "The name of the property from which to obtain the name of features."
  })
  nameProperty?: string;

  @primitiveTrait({
    type: "number",
    name: "maximumNativeZoom",
    description: "The maximum zoom level for which tile files exist."
  })
  maximumNativeZoom = 12;

  @primitiveTrait({
    type: "number",
    name: "maximumZoom",
    description:
      "The maximum zoom level that can be displayed by using the data in the  MapboxVectorTileCatalogItem#maximumNativeZoom tiles."
  })
  maximumZoom = 28;

  @primitiveTrait({
    type: "number",
    name: "minimumZoom",
    description: "The minimum zoom level for which tile files exist."
  })
  minimumZoom = 0;
}

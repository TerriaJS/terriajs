import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates a catalog item from a GeoPackage (.gpkg) file. GeoPackage files can contain multiple vector layers. If the file contains multiple layers and no layerName is specified, all layers will be loaded.`,
  example: {
    type: "gpkg",
    name: "GeoPackage example",
    url: "https://example.com/data.gpkg",
    layerName: "places"
  }
})
export default class GeoPackageCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Layer name",
    description:
      "The name of the specific layer/table to load from the GeoPackage. If not specified and the GeoPackage contains multiple layers, all layers will be loaded as separate catalog items in a group."
  })
  layerName?: string;
}

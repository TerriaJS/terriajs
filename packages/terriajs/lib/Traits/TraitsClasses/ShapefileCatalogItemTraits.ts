import { GeoJsonTraits } from "./GeoJsonTraits";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates one catalog item from url that points to a zipped shapefile.`,
  example: {
    type: "shp",
    name: "shp (shapefile) example",
    url: "https://tiles.terria.io/terriajs-examples/shp/airports.zip",
    id: "some unique id"
  }
})
export default class ShapefileCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  CatalogMemberTraits
) {}

import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates one catalog item for a Tile Map Service (TMS) imagery tileset.`,
  example: {
    type: "tms",
    name: "Natural Earth II (TMS)",
    url: "https://storage.googleapis.com/terria-datasets-public/basemaps/natural-earth-tiles"
  }
})
export default class TileMapServiceCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}

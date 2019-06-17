import mixTraits from "./mixTraits";

import LayerOrderingTraits from "./LayerOrderingTraits";

import CatalogMemberTraits from "./CatalogMemberTraits";

import MappableTraits from "./MappableTraits";

import RasterLayerTraits from "./RasterLayerTraits";

export default class BillboardTraits extends mixTraits(
    LayerOrderingTraits,
    CatalogMemberTraits,
    MappableTraits,
    RasterLayerTraits
  ) {
      
  }
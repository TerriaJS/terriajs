import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";

import UrlMixin from "../ModelMixins/UrlMixin";

import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";

import CreateModel from "./CreateModel";

import GtfsCatalogItemTraits from "../Traits/GtfsCatalogItemTraits";
import Terria from "./Terria";
import BillboardsMixin from "./BillboardsMixin";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";

export default class GtfsCatalogItem extends AsyncMappableMixin(
  UrlMixin(
    BillboardsMixin(CatalogMemberMixin(CreateModel(GtfsCatalogItemTraits)))
  )
) {
  static get type() {
    return "gtfs";
  }

  get type() {
    return GtfsCatalogItem.type;
  }

  constructor(id: string, terria: Terria) {
    super(id, terria);
  }

  protected get loadMapItemsPromise(): Promise<void> {
    return new Promise(() => {
      // TODO: Load actual data
      const b: BillboardGraphics = new BillboardGraphics({
        image: new ConstantProperty(
          "public/img/glyphicons_242_google_maps.png"
        ),
        heightReference: new ConstantProperty(
          HeightReference.RELATIVE_TO_GROUND
        )
      });

      this.billboardDataList = [];
      this.billboardDataList.push({
        billboard: b,
        position: Cartesian3.fromDegrees(151.2099, -33.865143, 0) // Sydney
      });
    });
  }

  protected get loadMetadataPromise(): Promise<void> {
    return Promise.resolve();
  }
}

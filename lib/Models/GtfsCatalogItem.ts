import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";

import UrlMixin from "../ModelMixins/UrlMixin";

import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";

import CreateModel from "./CreateModel";

import GtfsCatalogItemTraits from "../Traits/GtfsCatalogItemTraits";
import Terria from "./Terria";
import BillboardData from "./BillboardData";
import createBillboardDataSource from './createBillboardDataSource';
import loadBlob from "../Core/loadBlob";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";


import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import DataSource from 'terriajs-cesium/Source/DataSources/CustomDataSource';

import { computed } from "mobx";
export default class GtfsCatalogItem extends AsyncMappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(GtfsCatalogItemTraits))
  )
) {
  private billboardDataList: BillboardData[] = [];
  
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

      this.retrieveData();

      // TODO: Load actual data
      const b: BillboardGraphics = new BillboardGraphics({
        image: "public/img/glyphicons_242_google_maps.png",
        heightReference: HeightReference.RELATIVE_TO_GROUND
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

  @computed
  get mapItems(): DataSource[] {
    return [createBillboardDataSource("gtfs_billboards", this.billboardDataList)];
  }

  retrieveData() {
    const headers = {
        'Authorization': 'apikey l4VnvZi4uQLSvD7lwN2ac7vIDJUJ3epYva4l',
        'Content-Type': 'application/x-google-protobuf;charset=UTF-8'
      
    }

    loadBlob(proxyCatalogItemUrl(this, 'https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/buses'), headers).then( (blob) =>
      console.log(blob.size)
    );

  }
}

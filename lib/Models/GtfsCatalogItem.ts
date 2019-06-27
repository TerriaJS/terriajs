import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import GtfsCatalogItemTraits from "../Traits/GtfsCatalogItemTraits";
import Terria from "./Terria";
import BillboardData from "./BillboardData";
import createBillboardDataSource from "./createBillboardDataSource";
import loadArrayBuffer from "../Core/loadArrayBuffer";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import TerriaError from "../Core/TerriaError";
import {
  FeedMessage,
  FeedMessageReader,
  FeedEntity
} from "./GtfsRealtimeProtoBufReaders";

import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import DataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import NearFarScalar from "terriajs-cesium/Source/Core/NearFarScalar";

import { computed, observable } from "mobx";
import Pbf from "pbf";

export default class GtfsCatalogItem extends AsyncMappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(GtfsCatalogItemTraits)))
) {
  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @observable
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
    const promise: Promise<void> = this.retrieveData()
      .then((data: FeedMessage) => {
        if (data.entity === null || data.entity === undefined) {
          return;
        }
        this.billboardDataList = data.entity
          .map((entity: FeedEntity) =>
            this.convertFeedEntityToBillboardData(entity)
          )
          .filter(
            (item: BillboardData) =>
              item.billboard !== null &&
              item.billboard !== undefined &&
              item.position !== null &&
              item.position !== undefined
          );
      })
      .catch((e: Error) => {
        throw new TerriaError({
          title: `Could not load ${this.nameInCatalog}.`,
          sender: this,
          message: `There was an error loading the data for ${
            this.nameInCatalog
          }.`
        });
      });

    console.log("ping");

    if (
      this.refreshInterval !== null &&
      this.refreshInterval !== undefined &&
      this.refreshInterval > 0
    ) {
      setTimeout(() => {
        this.loadMapItemsPromise;
      }, this.refreshInterval * 1000);
    }

    return promise;
  }

  @computed
  get mapItems(): DataSource[] {
    return [
      createBillboardDataSource("gtfs_billboards", this.billboardDataList)
    ];
  }

  retrieveData(): Promise<FeedMessage> {
    // These headers work for the Transport for NSW APIs. Presumably, other services will require different headers.
    const headers = {
      Authorization: `apikey ${this.apiKey}`,
      "Content-Type": "application/x-google-protobuf;charset=UTF-8"
    };

    if (this.url !== null && this.url !== undefined) {
      return loadArrayBuffer(proxyCatalogItemUrl(this, this.url), headers).then(
        (arr: ArrayBuffer) => {
          const pbfBuffer = new Pbf(new Uint8Array(arr));
          return new FeedMessageReader().read(pbfBuffer);
        }
      );
    } else {
      return Promise.reject();
    }
  }

  convertFeedEntityToBillboardData(entity: FeedEntity): BillboardData {
    if (this.terria.mainViewer.viewerMode === "cesium") {
    }

    const billboard: BillboardGraphics = new BillboardGraphics({
      image: this.terria.baseUrl + this.image,
      heightReference: HeightReference.RELATIVE_TO_GROUND,
      // near and far distances are arbitrary, these ones look nice
      scaleByDistance: new NearFarScalar(0.1, 1.0, 100000, 0.1)
    });

    let position = undefined;
    if (
      entity.vehicle !== null &&
      entity.vehicle !== undefined &&
      entity.vehicle.position !== null &&
      entity.vehicle.position !== undefined &&
      entity.vehicle.position.latitude !== null &&
      entity.vehicle.position.latitude !== undefined &&
      entity.vehicle.position.longitude !== null &&
      entity.vehicle.position.longitude !== undefined
    ) {
      position = Cartesian3.fromDegrees(
        entity.vehicle.position.longitude,
        entity.vehicle.position.latitude
      );
    }

    return {
      billboard: billboard,
      position: position
    };
  }
}

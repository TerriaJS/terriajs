import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import GtfsCatalogItemTraits from "../Traits/GtfsCatalogItemTraits";
import Terria from "./Terria";
import BillboardData from "./BillboardData";
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
import Color from "terriajs-cesium/Source/Core/Color";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import Axis from "terriajs-cesium/Source/Scene/Axis";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import ModelGraphics from "terriajs-cesium/Source/DataSources/ModelGraphics";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";

import {
  computed,
  observable,
  reaction,
  runInAction,
  IReactionDisposer,
  onBecomeObserved,
  onBecomeUnobserved
} from "mobx";
import { now } from "mobx-utils";

import Pbf from "pbf";

/**
 * For displaying realtime transport data. See [here](https://developers.google.com/transit/gtfs-realtime/reference/)
 * for the spec.
 */
export default class GtfsCatalogItem extends AsyncMappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(GtfsCatalogItemTraits)))
) {
  disposer: IReactionDisposer | undefined;

  /**
   * Always use the getter to read this. This is a cache for a computed property.
   */
  protected _dataSource: DataSource = new DataSource("billboard");

  static get type() {
    return "gtfs";
  }

  get type() {
    return GtfsCatalogItem.type;
  }

  @observable
  protected billboardDataList: BillboardData[] = [];

  @computed
  protected get _pollingTimer(): number | undefined {
    if (this.refreshInterval !== null && this.refreshInterval !== undefined) {
      return now(this.refreshInterval * 1000);
    }
  }

  @computed
  protected get dataSource(): DataSource {
    this._dataSource.entities.suspendEvents();

    for (let data of this.billboardDataList) {
      if (data.sourceId === undefined) {
        continue;
      }
      const entity: Entity = this._dataSource.entities.getOrCreateEntity(
        data.sourceId
      );

      if (!entity.model && this._model) {
        entity.model = this._model;
        if (data.orientation) {
          entity.orientation = new ConstantProperty(data.orientation);
        }
      }

      if (data.position !== undefined && entity.position !== data.position) {
        entity.position = data.position;
      }

      if (
        entity.billboard == undefined ||
        this.needToUpdateBillboard(
          entity.billboard,
          data.billboardGraphicsOptions
        )
      ) {
        entity.billboard = new BillboardGraphics(data.billboardGraphicsOptions);
      }
    }

    // remove entities that no longer exist
    if (
      this._dataSource.entities.values.length > this.billboardDataList.length
    ) {
      const idSet = new Set(this.billboardDataList.map(val => val.sourceId));

      this._dataSource.entities.values
        .filter(entity => !idSet.has(entity.id))
        .forEach(entity => this._dataSource.entities.remove(entity));
    }

    this._dataSource.entities.resumeEvents();
    this.terria.currentViewer.notifyRepaintRequired();

    return this._dataSource;
  }

  @computed
  get nextScheduledUpdateTime(): Date | undefined {
    if (
      this._pollingTimer !== null &&
      this._pollingTimer !== undefined &&
      this.refreshInterval !== undefined &&
      this.refreshInterval !== null
    ) {
      return new Date(this._pollingTimer + this.refreshInterval * 1000);
    } else {
      return undefined;
    }
  }

  @computed
  get isPolling() {
    return this._pollingTimer !== null && this._pollingTimer !== undefined;
  }

  @computed
  get mapItems(): DataSource[] {
    return [this.dataSource];
  }

  @computed
  private get _cesiumUpAxis() {
    if (this.model.upAxis === undefined) {
      return Axis.Z;
    }
    return Axis.fromName(this.model.upAxis);
  }

  @computed
  private get _cesiumForwardAxis() {
    if (this.model.forwardAxis === undefined) {
      return Axis.X;
    }
    return Axis.fromName(this.model.forwardAxis);
  }

  @computed
  private get _model() {
    if (this.model.url === undefined) {
      return undefined;
    }

    const options = {
      uri: this.model.url,
      upAxis: this._cesiumUpAxis,
      forwardAxis: this._cesiumForwardAxis,
      scale: this.model.scale !== undefined ? this.model.scale : 1,
      heightReference: new ConstantProperty(HeightReference.RELATIVE_TO_GROUND),
      distanceDisplayCondition: new ConstantProperty({
        near: 0.0,
        far: this.model.maximumDistance
      })
    };

    return new ModelGraphics(options);
  }

  constructor(id: string, terria: Terria) {
    super(id, terria);
    // We should only poll when our map items have consumers
    onBecomeObserved(this, "mapItems", () => {
      this.disposer = reaction(
        () => this._pollingTimer,
        () => {
          console.log("ping");
          this.loadMapItemsPromise;
          // console.log(getObserverTree(this, "mapItems"));
        }
      );
    });
    onBecomeUnobserved(this, "mapItems", () => {
      if (this.disposer !== undefined && this.disposer !== null) {
        this.disposer();
      }
    });
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  protected get loadMapItemsPromise(): Promise<void> {
    const promise: Promise<void> = this.retrieveData()
      .then((data: FeedMessage) => {
        if (data.entity === null || data.entity === undefined) {
          return [];
        }

        return data.entity
          .map((entity: FeedEntity) =>
            this.convertFeedEntityToBillboardData(entity)
          )
          .filter(
            (item: BillboardData) =>
              item.position !== null && item.position !== undefined
          );
      })
      .then(data => {
        runInAction(() => (this.billboardDataList = data));
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

    return promise;
  }

  // See this.dataSource
  protected needToUpdateBillboard(
    entityBillboard: BillboardGraphics,
    billboardGraphicsOptions: any
  ) {
    billboardGraphicsOptions.color.alpha = this.opacity;
    return !entityBillboard.color.equals(billboardGraphicsOptions.color);
  }

  protected retrieveData(): Promise<FeedMessage> {
    // These headers work for the Transport for NSW APIs. Presumably, other services will require different headers.
    const headers = {
      Authorization: `apikey ${this.apiKey}`,
      "Content-Type": "application/x-google-protobuf;charset=UTF-8",
      "Cache-Control": "no-cache"
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

  protected convertFeedEntityToBillboardData(
    entity: FeedEntity
  ): BillboardData {
    if (entity.id == undefined) {
      return {};
    }

    let position = undefined;
    let orientation = undefined;
    if (
      entity.vehicle !== null &&
      entity.vehicle !== undefined &&
      entity.vehicle.position !== null &&
      entity.vehicle.position !== undefined &&
      entity.vehicle.position.latitude !== null &&
      entity.vehicle.position.latitude !== undefined &&
      entity.vehicle.position.longitude !== null &&
      entity.vehicle.position.longitude !== undefined &&
      entity.vehicle.position.bearing !== null &&
      entity.vehicle.position.bearing !== undefined
    ) {
      position = Cartesian3.fromDegrees(
        entity.vehicle.position.longitude,
        entity.vehicle.position.latitude
      );
      orientation = Transforms.headingPitchRollQuaternion(
        position,
        HeadingPitchRoll.fromDegrees(
          entity.vehicle.position.bearing - 90.0,
          0.0,
          0.0
        )
      );
    }

    return {
      sourceId: entity.id,
      position: position,
      orientation: orientation,
      billboardGraphicsOptions: {
        image: this.terria.baseUrl + this.image,
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        // near and far distances are arbitrary, these ones look nice
        scaleByDistance: new NearFarScalar(0.1, 1.0, 100000, 0.1),
        color: new Color(1.0, 1.0, 1.0, this.opacity)
      }
    };
  }
}

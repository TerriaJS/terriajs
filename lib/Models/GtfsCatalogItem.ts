import {
  computed,
  IReactionDisposer,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
  runInAction
} from "mobx";
import { createTransformer, ITransformer, now } from "mobx-utils";
import Pbf from "pbf";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import NearFarScalar from "terriajs-cesium/Source/Core/NearFarScalar";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import DataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ModelGraphics from "terriajs-cesium/Source/DataSources/ModelGraphics";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import Axis from "terriajs-cesium/Source/Scene/Axis";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import loadArrayBuffer from "../Core/loadArrayBuffer";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import GtfsCatalogItemTraits from "../Traits/GtfsCatalogItemTraits";
import CreateModel from "./CreateModel";
import {
  FeedEntity,
  FeedMessage,
  FeedMessageReader
} from "./GtfsRealtimeProtoBufReaders";
import prettyPrintGtfsEntityField from "./prettyPrintGtfsEntityField";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import raiseErrorOnRejectedPromise from "./raiseErrorOnRejectedPromise";
import Terria from "./Terria";
import VehicleData from "./VehicleData";

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
   *
   * We cache it because recreating it reactively is computationally expensive, so we modify it reactively instead.
   */
  protected _dataSource: DataSource = new DataSource("billboard");

  protected static readonly FEATURE_INFO_TEMPLATE_FIELDS: string[] = [
    "route_short_name",
    "occupancy_status#str",
    "speed#km",
    "speed",
    "bearing"
  ];

  static get type() {
    return "gtfs";
  }

  get type() {
    return GtfsCatalogItem.type;
  }

  @observable
  protected gtfsFeedEntities: FeedEntity[] = [];

  @computed
  protected get _pollingTimer(): number | undefined {
    if (this.refreshInterval !== null && this.refreshInterval !== undefined) {
      return now(this.refreshInterval * 1000);
    }
  }

  protected convertManyFeedEntitiesToBillboardData: ITransformer<
    FeedEntity[],
    VehicleData[]
  > = createTransformer((feedEntity: FeedEntity[]) => {
    return this.gtfsFeedEntities
      .map((entity: FeedEntity) =>
        this.convertFeedEntityToBillboardData(entity)
      )
      .filter(
        (item: VehicleData) =>
          item.position !== null && item.position !== undefined
      );
  });

  @computed
  protected get dataSource(): DataSource {
    this._dataSource.entities.suspendEvents();

    // Convert the GTFS protobuf into a more useful shape
    const vehicleData: VehicleData[] = this.convertManyFeedEntitiesToBillboardData(
      this.gtfsFeedEntities
    );

    for (let data of vehicleData) {
      if (data.sourceId === undefined) {
        continue;
      }

      const entity: Entity = this._dataSource.entities.getOrCreateEntity(
        data.sourceId
      );

      if (!entity.model && this._model) {
        entity.model = this._model;
      }

      if (
        this.model !== undefined &&
        this.model !== null &&
        data.orientation !== undefined &&
        data.orientation !== null
      ) {
        entity.orientation = new ConstantProperty(data.orientation);
      }

      if (data.position !== undefined && entity.position !== data.position) {
        entity.position = data.position;
      }

      // If we're using a billboard
      if (data.billboard !== null && data.billboard !== undefined) {
        if (entity.billboard === null || entity.billboard === undefined) {
          entity.billboard = data.billboard;
        }

        data.billboard.color.getValue(new JulianDate()).alpha = this.opacity;
        if (!entity.billboard.color.equals(data.billboard.color)) {
          entity.billboard.color = data.billboard.color;
        }
      }

      // If we're using a point
      if (data.point !== null && data.point !== undefined) {
        if (entity.point === null || entity.point === undefined) {
          entity.point = data.point;
        }

        data.point.color.getValue(new JulianDate()).alpha = this.opacity;
        if (!entity.point.color.equals(data.point.color)) {
          entity.point.color = data.point.color;
        }
      }

      if (data.featureInfo !== undefined && data.featureInfo !== null) {
        entity.properties = new PropertyBag();

        for (let key of data.featureInfo.keys()) {
          entity.properties.addProperty(key, data.featureInfo.get(key));
        }
      }
    }

    // remove entities that no longer exist
    if (this._dataSource.entities.values.length > vehicleData.length) {
      const idSet = new Set(vehicleData.map(val => val.sourceId));

      this._dataSource.entities.values
        .filter(entity => !idSet.has(entity.id))
        .forEach(entity => this._dataSource.entities.remove(entity));
    }

    this._dataSource.entities.resumeEvents();

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
      return Axis.Y;
    }
    return Axis.fromName(this.model.upAxis);
  }

  @computed
  private get _cesiumForwardAxis() {
    if (this.model.forwardAxis === undefined) {
      return Axis.Z;
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

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);
    // We should only poll when our map items have consumers
    onBecomeObserved(this, "mapItems", () => {
      this.disposer = reaction(
        () => this._pollingTimer,
        () => {
          console.log("ping");
          raiseErrorOnRejectedPromise(this.forceLoadMapItems());
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

  protected forceLoadMapItems(): Promise<void> {
    const promise: Promise<void> = this.retrieveData()
      .then((data: FeedMessage) => {
        runInAction(() => {
          if (data.entity !== undefined && data.entity !== null) {
            this.gtfsFeedEntities = data.entity;
            this.terria.currentViewer.notifyRepaintRequired();
          }
        });
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

  protected retrieveData(): Promise<FeedMessage> {
    // These headers work for the Transport for NSW APIs. Presumably, other services will require different headers.
    const headers: any = {
      "Content-Type": "application/x-google-protobuf;charset=UTF-8",
      "Cache-Control": "no-cache"
    };

    if (this.apiKey !== undefined) {
      headers.Authorization = `apikey ${this.apiKey}`;
    }

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

  protected convertFeedEntityToBillboardData(entity: FeedEntity): VehicleData {
    if (entity.id == undefined) {
      return {};
    }

    let position = undefined;
    let orientation = undefined;
    let featureInfo: Map<string, any> = new Map();
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

    // Add the values that the feature info template gets populated with
    for (let field of GtfsCatalogItem.FEATURE_INFO_TEMPLATE_FIELDS) {
      featureInfo.set(field, prettyPrintGtfsEntityField(field, entity));
    }
    let billboard;
    let point;

    if (this.image !== undefined && this.image !== null) {
      billboard = new BillboardGraphics({
        image: this.terria.baseUrl + this.image,
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        // near and far distances are arbitrary, these ones look nice
        scaleByDistance: new NearFarScalar(0.1, 1.0, 100000, 0.1),
        color: new Color(1.0, 1.0, 1.0, this.opacity)
      });
    } else {
      point = new PointGraphics({
        color: Color.CYAN,
        pixelSize: 32,
        outlineWidth: 1,
        outlineColor: Color.WHITE,
        scaleByDistance: new ConstantProperty(
          new NearFarScalar(0.1, 1.0, 100000, 0.1)
        )
      });
    }

    return {
      sourceId: entity.id,
      position: position,
      orientation: orientation,
      featureInfo: featureInfo,
      billboard: billboard,
      point: point
    };
  }
}

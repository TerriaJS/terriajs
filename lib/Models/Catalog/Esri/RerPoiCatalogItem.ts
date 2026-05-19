import { featureCollection } from "@turf/helpers";
import { Geometry, GeometryCollection, Properties } from "@turf/helpers";
import {
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
  runInAction
} from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import { networkRequestError } from "../../../Core/TerriaError";
import featureDataToGeoJson from "../../../Map/PickedFeatures/featureDataToGeoJson";
import { FeatureCollectionWithCrs } from "../../../ModelMixins/GeojsonMixin";
import CommonStrata from "../../Definition/CommonStrata";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import ArcGisFeatureServerCatalogItem from "./ArcGisFeatureServerCatalogItem";
import {
  applyRerPoiEntityStyles,
  RER_POI_CATALOG_ITEM_TYPE,
  normalizeRerPoiUrl
} from "../../../ModelMixins/RerPoiHelpers";
import RerPoiCatalogItemTraits, {
  defaultRerPoiCatalogItemTraits
} from "../../../Traits/TraitsClasses/RerPoiCatalogItemTraits";

interface EsriJsonQueryOptions {
  resultOffset?: number;
  bbox?: Rectangle;
  minLevelId?: number;
  maxLevelId?: number;
}

interface DynamicViewportQuery {
  filterKey: string;
  queryRectangle: Rectangle;
  requestOptions: EsriJsonQueryOptions;
}

interface EsriJsonFeatureServerResponse {
  features?: any[];
  exceededTransferLimit?: boolean;
}

export default class RerPoiCatalogItem extends ArcGisFeatureServerCatalogItem {
  static readonly type = RER_POI_CATALOG_ITEM_TYPE;
  static readonly TraitsClass = RerPoiCatalogItemTraits;
  static readonly traits = RerPoiCatalogItemTraits.traits;

  readonly TraitsClass = RerPoiCatalogItemTraits;
  readonly traits = RerPoiCatalogItemTraits.traits;

  private removeCesiumCameraChangedListener: (() => void) | undefined;
  private removeViewerChangedListener: (() => void) | undefined;
  private removeShowReaction: (() => void) | undefined;

  private dynamicReloadTimer: ReturnType<typeof setTimeout> | undefined;
  private pendingDynamicQuery: DynamicViewportQuery | undefined;
  private activeDynamicQuery: DynamicViewportQuery | undefined;
  private dynamicReloadQueued = false;
  private dynamicReloadInProgress = false;

  private managedDataSource: GeoJsonDataSource | undefined;
  private liveEntityByObjectId = new Map<string, any>();
  private isFirstDynamicLoad = true;

  private readonly onDynamicViewportChanged = () => {
    if (this.isCameraPastTiltLimit()) return;
    this.queueDynamicReload();
  };

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    this.setTrait(CommonStrata.definition, "forceCesiumPrimitives", true);
    this.setTrait(CommonStrata.definition, "clustering", {
      enabled: true,
      pixelRange: 35,
      minimumClusterSize: 5,
      pinSize: 60,
      pinBackgroundColor: "gray"
    });

    onBecomeObserved(this, "mapItems", () =>
      this.startDynamicViewportRequests()
    );
    onBecomeUnobserved(this, "mapItems", () =>
      this.stopDynamicViewportRequests()
    );
  }

  get type(): string {
    return RER_POI_CATALOG_ITEM_TYPE;
  }

  get objectIdField(): string {
    const stratum = this.strata.get("featureServer") as any;
    return stratum?._featureServer?.objectIdField ?? "OBJECTID";
  }

  private getRerPoiTrait<T extends keyof RerPoiCatalogItemTraits>(
    traitName: T
  ): RerPoiCatalogItemTraits[T] {
    const trait = RerPoiCatalogItemTraits.traits[traitName as string];
    const value = trait?.getValue(this as unknown as BaseModel);
    return value === undefined
      ? defaultRerPoiCatalogItemTraits[traitName]
      : (value as RerPoiCatalogItemTraits[T]);
  }

  private startDynamicViewportRequests() {
    if (!this.removeViewerChangedListener) {
      this.removeViewerChangedListener =
        this.terria.mainViewer.afterViewerChanged.addEventListener(() => {
          this.attachCurrentViewerListener();
          this.queueDynamicReload(true);
        });
    }

    this.removeShowReaction ??= reaction(
      () => this.show,
      (show) => {
        if (show) this.queueDynamicReload(true);
      }
    );

    this.attachCurrentViewerListener();
    this.queueDynamicReload(true);
  }

  private stopDynamicViewportRequests() {
    this.detachCurrentViewerListener();
    this.removeShowReaction?.();
    this.removeShowReaction = undefined;
    this.removeViewerChangedListener?.();
    this.removeViewerChangedListener = undefined;

    if (this.dynamicReloadTimer) {
      clearTimeout(this.dynamicReloadTimer);
      this.dynamicReloadTimer = undefined;
    }

    this.dynamicReloadQueued = false;
    this.dynamicReloadInProgress = false;
    this.managedDataSource = undefined;
    this.liveEntityByObjectId.clear();
    this.isFirstDynamicLoad = true;
  }

  private attachCurrentViewerListener() {
    this.detachCurrentViewerListener();
    const cesium = this.terria.cesium;
    if (cesium) {
      this.removeCesiumCameraChangedListener =
        cesium.scene.camera.changed.addEventListener(
          this.onDynamicViewportChanged
        );
    }
  }

  private detachCurrentViewerListener() {
    this.removeCesiumCameraChangedListener?.();
    this.removeCesiumCameraChangedListener = undefined;
  }

  private isCameraPastTiltLimit(): boolean {
    const cameraTiltLimitRadians = CesiumMath.clamp(
      CesiumMath.toRadians(this.getRerPoiTrait("cameraTiltLimitDegrees")),
      0,
      CesiumMath.PI_OVER_TWO
    );
    const currentView = this.terria.currentViewer.getCurrentCameraView();
    const pitch =
      (currentView as { pitch?: number }).pitch ??
      this.terria.cesium?.scene.camera.pitch;
    if (!isDefined(pitch)) return false;
    const tiltThresholdPitch = -CesiumMath.PI_OVER_TWO + cameraTiltLimitRadians;
    return pitch > tiltThresholdPitch;
  }

  private queueDynamicReload(immediate = false) {
    if (this.dynamicReloadTimer) {
      clearTimeout(this.dynamicReloadTimer);
      this.dynamicReloadTimer = undefined;
    }
    const debounceMs = this.getRerPoiTrait("dynamicRequestDebounceMs");
    this.dynamicReloadTimer = setTimeout(
      () => {
        this.dynamicReloadTimer = undefined;
        void this.reloadDynamicViewportData();
      },
      immediate ? 0 : debounceMs
    );
  }

  private async reloadDynamicViewportData() {
    if (!this.show || this.isCameraPastTiltLimit()) return;

    const nextQuery = this.getDynamicViewportQuery();
    if (!nextQuery) return;

    if (
      this.activeDynamicQuery?.filterKey === nextQuery.filterKey &&
      rectangleContains(
        this.activeDynamicQuery.queryRectangle,
        nextQuery.queryRectangle
      )
    ) {
      return;
    }

    if (this.dynamicReloadInProgress || this.isLoadingMapItems) {
      this.dynamicReloadQueued = true;
      return;
    }

    this.dynamicReloadInProgress = true;
    try {
      if (this.isFirstDynamicLoad || !this.managedDataSource) {
        this.pendingDynamicQuery = nextQuery;
        (await this.loadMapItems(true)).logError(
          "Failed to reload RerPoi dynamic viewport data"
        );
        this.pendingDynamicQuery = undefined;

        const ds = this.findGeoJsonDataSource();
        if (ds) {
          this.managedDataSource = ds;
          this.buildLiveEntityMap(ds);
          this.activeDynamicQuery = nextQuery;
          this.isFirstDynamicLoad = false;
          this.syncCachedEntityVisibility(nextQuery);
        }
      } else {
        await this.applyIncrementalUpdate(nextQuery);
      }
    } finally {
      this.dynamicReloadInProgress = false;
      if (this.dynamicReloadQueued) {
        const shouldRetry = !this.isCameraPastTiltLimit();
        this.dynamicReloadQueued = false;
        if (shouldRetry) this.queueDynamicReload(true);
      }
    }
  }

  private findGeoJsonDataSource(): GeoJsonDataSource | undefined {
    for (const item of this.mapItems) {
      if (item instanceof GeoJsonDataSource) return item;
    }
    return undefined;
  }

  private buildLiveEntityMap(ds: GeoJsonDataSource) {
    const now = JulianDate.now();
    this.liveEntityByObjectId.clear();
    for (const entity of ds.entities.values) {
      const id = this.readObjectIdFromEntity(entity, now);
      if (id) this.liveEntityByObjectId.set(id, entity);
    }
  }

  private syncCachedEntityVisibility(query = this.getDynamicViewportQuery()) {
    if (!query || !this.managedDataSource) return;
    const now = JulianDate.now();
    const { minLevelId, maxLevelId } = query.requestOptions;
    let visiblePoiCount = 0;
    for (const entity of this.liveEntityByObjectId.values()) {
      const inRectangle = isEntityInRectangle(entity, query.queryRectangle);
      const inLevelRange = this.isEntityInLevelRange(
        entity,
        now,
        minLevelId,
        maxLevelId
      );
      const isVisible = inRectangle && inLevelRange;
      entity.show = isVisible;
      if (isVisible) visiblePoiCount += 1;
    }

    console.log("[RerPoiCatalogItem] POI debug", {
      cachedPoiCount: this.liveEntityByObjectId.size,
      visiblePoiCount,
      cameraHeight: this.getCurrentCameraHeight(),
      minLevelId,
      maxLevelId
    });
  }

  private isEntityInLevelRange(
    entity: any,
    now: JulianDate,
    minLevelId: number | undefined,
    maxLevelId: number | undefined
  ): boolean {
    const levelIdField = this.getRerPoiTrait("levelIdField");
    if (!levelIdField) return true;
    if (!isDefined(minLevelId) && !isDefined(maxLevelId)) return true;

    const raw = entity.properties?.[levelIdField]?.getValue(now);
    if (!isDefined(raw)) return false;

    const levelId = Number(raw);
    if (!Number.isFinite(levelId)) return false;
    if (isDefined(minLevelId) && levelId < minLevelId) return false;
    if (isDefined(maxLevelId) && levelId > maxLevelId) return false;
    return true;
  }

  private readObjectIdFromEntity(
    entity: any,
    now: JulianDate
  ): string | undefined {
    const props = entity.properties;
    if (!props) return undefined;
    const raw =
      props[this.objectIdField]?.getValue(now) ??
      props["OBJECTID"]?.getValue(now) ??
      props["objectid"]?.getValue(now);
    return raw !== undefined && raw !== null ? String(raw) : undefined;
  }

  private getFeatureObjectId(feature: any): string | undefined {
    const props = feature.properties as Record<string, unknown> | null;
    if (!props) return undefined;
    const raw =
      props[this.objectIdField] ?? props["OBJECTID"] ?? props["objectid"];
    return raw !== undefined && raw !== null ? String(raw) : undefined;
  }

  private async applyIncrementalUpdate(nextQuery: DynamicViewportQuery) {
    const ds = this.managedDataSource!;

    let geoJson: FeatureCollectionWithCrs<
      Geometry | GeometryCollection,
      Properties
    >;
    try {
      geoJson = await this.loadGeoJsonFromServer(nextQuery.requestOptions);
    } catch {
      return;
    }

    const newFeatures = (geoJson.features ?? []) as any[];
    if (newFeatures.length === 0) return;

    const pruneRect = rectangleWithPadding(nextQuery.queryRectangle, 0.5);
    const idsToRemove: string[] = [];
    for (const [id, entity] of this.liveEntityByObjectId) {
      if (!isEntityInRectangle(entity, pruneRect)) idsToRemove.push(id);
    }

    const featuresToAdd = newFeatures.filter((f) => {
      const id = this.getFeatureObjectId(f);
      return id ? !this.liveEntityByObjectId.has(id) : false;
    });

    if (idsToRemove.length > 0) {
      ds.entities.suspendEvents();
      for (const id of idsToRemove) {
        const entity = this.liveEntityByObjectId.get(id);
        if (entity) ds.entities.remove(entity);
        this.liveEntityByObjectId.delete(id);
      }
      ds.entities.resumeEvents();
    }

    if (featuresToAdd.length > 0) {
      const idsBefore = new Set<string>(
        ds.entities.values.map((e: any) => e.id as string)
      );
      await ds.process(featureCollection(featuresToAdd));

      const now = JulianDate.now();
      const newEntities = ds.entities.values.filter(
        (e: any) => !idsBefore.has(e.id as string)
      );
      applyRerPoiEntityStyles(ds, {
        defaultMarkerColor: this.getRerPoiTrait("defaultMarkerColor"),
        markerSize: this.getRerPoiTrait("markerSize"),
        iconStrokeWidth: this.getRerPoiTrait("iconStrokeWidth"),
        iconStrokeColor: this.getRerPoiTrait("iconStrokeColor"),
        poiDomainStyleGroups: this.getRerPoiTrait("poiDomainStyleGroups"),
        scaleField: this.getRerPoiTrait("scaleField"),
        domainIdField: this.getRerPoiTrait("domainIdField")
      });
      for (const entity of newEntities) {
        const id = this.readObjectIdFromEntity(entity, now);
        if (id) this.liveEntityByObjectId.set(id, entity);
      }
    }

    this.activeDynamicQuery = nextQuery;
    this.syncCachedEntityVisibility(nextQuery);
  }

  protected async forceLoadGeojsonData(): Promise<
    FeatureCollectionWithCrs<Geometry | GeometryCollection, Properties>
  > {
    if (this.isCameraPastTiltLimit()) {
      return featureCollection([]) as any;
    }

    const dynamicQuery =
      this.pendingDynamicQuery ?? this.getDynamicViewportQuery();

    if (!dynamicQuery) {
      return featureCollection([]) as any;
    }

    try {
      const geoJson = await this.loadGeoJsonFromServer(
        dynamicQuery.requestOptions
      );
      const featureCount = geoJson.features?.length ?? 0;

      if (featureCount > 0 && featureCount <= this.maxFeatures) {
        return geoJson;
      }
      return featureCollection([]) as any;
    } catch {
      return featureCollection([]) as any;
    }
  }

  protected async loadGeoJsonDataSource(
    geoJson: FeatureCollectionWithCrs<Geometry | GeometryCollection, Properties>
  ): Promise<GeoJsonDataSource> {
    const dataSource = await super.loadGeoJsonDataSource(geoJson as any);
    applyRerPoiEntityStyles(dataSource, {
      defaultMarkerColor: this.getRerPoiTrait("defaultMarkerColor"),
      markerSize: this.getRerPoiTrait("markerSize"),
      iconStrokeWidth: this.getRerPoiTrait("iconStrokeWidth"),
      iconStrokeColor: this.getRerPoiTrait("iconStrokeColor"),
      poiDomainStyleGroups: this.getRerPoiTrait("poiDomainStyleGroups"),
      scaleField: this.getRerPoiTrait("scaleField"),
      domainIdField: this.getRerPoiTrait("domainIdField")
    });
    return dataSource;
  }

  protected async loadGeoJsonFromServer(
    queryOptions?: EsriJsonQueryOptions
  ): Promise<
    FeatureCollectionWithCrs<Geometry | GeometryCollection, Properties>
  > {
    const supportsPagination = this.supportsPagination;
    const featuresPerRequest = this.featuresPerRequest;
    const maxFeatures = this.maxFeatures;
    const objectIdField = this.objectIdField;

    const fetchPage = async (
      resultOffset?: number
    ): Promise<EsriJsonFeatureServerResponse> => {
      const urlString = runInAction(() =>
        this.buildEsriJsonUrl({ ...queryOptions, resultOffset })
      );
      return loadJson(urlString);
    };

    const getObjectId = (feature: any): string | undefined =>
      feature.attributes?.[objectIdField] ??
      feature.attributes?.OBJECTID ??
      feature.attributes?.objectid;

    const extractIds = (features: any[]): string[] =>
      features.map(getObjectId).filter((id): id is string => isDefined(id));

    if (!supportsPagination) {
      const page = await fetchPage();
      const count = page.features?.length ?? 0;

      if (count === 0) throw new Error("RerPoi query returned no features");
      if (count > maxFeatures)
        throw new Error("RerPoi query exceeded the maximum feature limit");
      if (page.exceededTransferLimit === true)
        throw new Error("RerPoi query exceeded transfer limit");

      return (featureDataToGeoJson(page) ?? {
        type: "FeatureCollection",
        features: []
      }) as any;
    }

    const combined = await fetchPage(0);
    combined.features ??= [];

    if (combined.features.length === 0)
      throw new Error("RerPoi query returned no features");
    if (combined.features.length > maxFeatures)
      throw new Error("RerPoi query exceeded the maximum feature limit");

    const seenIDs = new Set<string>(extractIds(combined.features));
    let currentOffset = 0;
    let exceededTransferLimit = combined.exceededTransferLimit === true;

    while (exceededTransferLimit) {
      currentOffset += featuresPerRequest;
      const page = await fetchPage(currentOffset);
      const pageFeatures = page.features ?? [];
      if (!pageFeatures.length) break;

      const newIds = extractIds(pageFeatures);
      if (newIds.length > 0 && newIds.every((id) => seenIDs.has(id))) break;

      if (combined.features.length + pageFeatures.length > maxFeatures)
        throw new Error("RerPoi query exceeded the maximum feature limit");

      newIds.forEach((id) => seenIDs.add(id));
      combined.features = combined.features.concat(pageFeatures);
      exceededTransferLimit = page.exceededTransferLimit === true;
    }

    if (combined.features.length === 0)
      throw new Error("RerPoi query returned no features");
    if (combined.features.length > maxFeatures)
      throw new Error("RerPoi query exceeded the maximum feature limit");

    return (featureDataToGeoJson(combined) ?? {
      type: "FeatureCollection",
      features: []
    }) as any;
  }

  buildEsriJsonUrl(options?: number | EsriJsonQueryOptions): string {
    const queryOptions =
      typeof options === "number" ? { resultOffset: options } : options;

    const url = normalizeRerPoiUrl(this.url || "0d");

    if (!/^(.*(?:FeatureServer|MapServer))\/(\d+)/.test(url)) {
      throw networkRequestError({
        title: "Invalid RerPoi URL",
        message: `URL must point to a layer on an ArcGIS FeatureServer or MapServer. Received: ${url}`
      });
    }

    const combinedWhere = [
      this.where,
      this.buildLevelFilterClause(
        queryOptions?.minLevelId,
        queryOptions?.maxLevelId
      )
    ]
      .filter(
        (clause): clause is string => isDefined(clause) && clause.length > 0
      )
      .map((clause) => `(${clause})`)
      .join(" AND ");

    const uri = new URI(url)
      .segment("query")
      .addQuery("f", "json")
      .addQuery("where", combinedWhere || "1=1")
      .addQuery("outFields", "*")
      .addQuery("outSR", "4326");

    if (queryOptions?.bbox) {
      uri
        .addQuery("geometry", rectangleToBounds(queryOptions.bbox))
        .addQuery("geometryType", "esriGeometryEnvelope")
        .addQuery("inSR", "4326")
        .addQuery("spatialRel", "esriSpatialRelIntersects")
        .addQuery("returnGeometry", "true");
    }

    if (queryOptions?.resultOffset !== undefined) {
      uri
        .addQuery("resultRecordCount", this.featuresPerRequest)
        .addQuery("resultOffset", queryOptions.resultOffset);
    }

    return proxyCatalogItemUrl(this, uri.toString());
  }

  private buildLevelFilterClause(
    minLevelId: number | undefined,
    maxLevelId: number | undefined
  ): string | undefined {
    const field = this.getRerPoiTrait("levelIdField");
    if (!field) return undefined;
    if (isDefined(minLevelId) && isDefined(maxLevelId)) {
      return minLevelId === maxLevelId
        ? `${field} = ${minLevelId}`
        : `${field} >= ${minLevelId} AND ${field} <= ${maxLevelId}`;
    }
    if (isDefined(minLevelId)) return `${field} >= ${minLevelId}`;
    if (isDefined(maxLevelId)) return `${field} <= ${maxLevelId}`;
    return undefined;
  }

  private getDynamicViewportQuery(): DynamicViewportQuery | undefined {
    if (
      this.terria.currentViewer.type === "none" ||
      this.isCameraPastTiltLimit()
    ) {
      return undefined;
    }

    const currentView = this.terria.currentViewer.getCurrentCameraView();
    const pitch =
      (currentView as { pitch?: number }).pitch ??
      this.terria.cesium?.scene.camera.pitch;

    const paddingRatio = this.getRerPoiTrait("queryBboxPaddingRatio");
    const queryRectangle = rectangleWithPadding(
      currentView.rectangle,
      paddingRatio,
      getPaddingMultiplierForPitch(pitch, 1.5, 6)
    );

    if (rectangleArea(queryRectangle) <= 0) return undefined;

    const levelFilter = this.getLevelFilterForViewport();
    return {
      filterKey: levelFilter.filterKey,
      queryRectangle,
      requestOptions: {
        bbox: queryRectangle,
        minLevelId: levelFilter.minLevelId,
        maxLevelId: levelFilter.maxLevelId
      }
    };
  }

  private getLevelFilterForViewport(): {
    minLevelId: number;
    maxLevelId: number;
    filterKey: string;
  } {
    const minLevelId = this.getRerPoiTrait("minLevelId");
    let maxLevelId = this.getRerPoiTrait("maxLevelId");
    const cameraHeight = this.getCurrentCameraHeight();
    const farHeight = this.getRerPoiTrait("progressiveFarCameraHeight");

    if (cameraHeight !== undefined) {
      if (cameraHeight >= farHeight) {
        maxLevelId = minLevelId;
      } else if (maxLevelId > minLevelId) {
        maxLevelId = this.getProgressiveLevelIdFromHeight(
          cameraHeight,
          minLevelId,
          maxLevelId
        );
      }
    }

    const levelIdField = this.getRerPoiTrait("levelIdField");
    return {
      minLevelId,
      maxLevelId,
      filterKey: [this.where, levelIdField, minLevelId, maxLevelId].join("|")
    };
  }

  private getProgressiveLevelIdFromHeight(
    cameraHeight: number,
    minimumLevelId: number,
    maximumLevelId: number
  ): number {
    const nearHeight = this.getRerPoiTrait("progressiveNearCameraHeight");
    const farHeight = this.getRerPoiTrait("progressiveFarCameraHeight");
    const levelStep = this.getRerPoiTrait("progressiveLevelStep");

    const clampedHeight = CesiumMath.clamp(cameraHeight, nearHeight, farHeight);
    const zoomRatio =
      1 - (clampedHeight - nearHeight) / (farHeight - nearHeight);
    const continuousLevel =
      minimumLevelId + zoomRatio * (maximumLevelId - minimumLevelId);
    const steppedLevel =
      minimumLevelId +
      Math.floor((continuousLevel - minimumLevelId) / levelStep) * levelStep;

    return CesiumMath.clamp(steppedLevel, minimumLevelId, maximumLevelId);
  }

  private getCurrentCameraHeight(): number | undefined {
    const position = this.terria.currentViewer.getCurrentCameraView().position;
    if (!position) return undefined;
    return Cartographic.fromCartesian(position)?.height;
  }
}

function rectangleWithPadding(
  rectangle: Rectangle,
  paddingRatio: number,
  verticalPaddingMultiplier = 1
): Rectangle {
  const width = Rectangle.computeWidth(rectangle);
  const height = Rectangle.computeHeight(rectangle);
  const safePadding = Math.max(0, paddingRatio);
  const southMult = CesiumMath.clamp(verticalPaddingMultiplier, 1, 3);
  const northMult = CesiumMath.clamp(verticalPaddingMultiplier, 1, 6);
  const lonPad = width * safePadding;
  const latPad = height * safePadding;

  return new Rectangle(
    CesiumMath.clamp(rectangle.west - lonPad, -Math.PI, Math.PI),
    CesiumMath.clamp(
      rectangle.south - latPad * southMult,
      -CesiumMath.PI_OVER_TWO,
      CesiumMath.PI_OVER_TWO
    ),
    CesiumMath.clamp(rectangle.east + lonPad, -Math.PI, Math.PI),
    CesiumMath.clamp(
      rectangle.north + latPad * northMult,
      -CesiumMath.PI_OVER_TWO,
      CesiumMath.PI_OVER_TWO
    )
  );
}

function getPaddingMultiplierForPitch(
  pitch: number | undefined,
  minMultiplier: number,
  maxMultiplier: number
): number {
  if (!isDefined(pitch)) return minMultiplier;
  const safeMin = Math.max(1, minMultiplier);
  const safeMax = Math.max(safeMin, maxMultiplier);
  const pitchRatio =
    (CesiumMath.clamp(pitch, -CesiumMath.PI_OVER_TWO, 0) +
      CesiumMath.PI_OVER_TWO) /
    CesiumMath.PI_OVER_TWO;
  return safeMin + pitchRatio * (safeMax - safeMin);
}

function rectangleArea(rectangle: Rectangle): number {
  return Rectangle.computeWidth(rectangle) * Rectangle.computeHeight(rectangle);
}

function rectangleContains(container: Rectangle, value: Rectangle): boolean {
  return (
    container.west <= value.west &&
    container.south <= value.south &&
    container.east >= value.east &&
    container.north >= value.north
  );
}

function rectangleToBounds(rectangle: Rectangle): string {
  return [
    CesiumMath.toDegrees(rectangle.west),
    CesiumMath.toDegrees(rectangle.south),
    CesiumMath.toDegrees(rectangle.east),
    CesiumMath.toDegrees(rectangle.north)
  ].join(",");
}

function isEntityInRectangle(entity: any, rect: Rectangle): boolean {
  const pos = entity.position?.getValue(JulianDate.now());
  if (!pos) return true;
  const carto = Cartographic.fromCartesian(pos);
  if (!carto) return true;
  return (
    carto.longitude >= rect.west &&
    carto.longitude <= rect.east &&
    carto.latitude >= rect.south &&
    carto.latitude <= rect.north
  );
}

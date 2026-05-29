import { featureCollection } from "@turf/helpers";
import { Geometry, GeometryCollection, Properties } from "@turf/helpers";
import {
  override,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
  runInAction,
  observable,
  makeObservable
} from "mobx";
import { keepAlive } from "mobx-utils";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import SceneMode from "terriajs-cesium/Source/Scene/SceneMode";
import URI from "urijs";
import i18next from "i18next";
import ViewerMode from "../../ViewerMode";
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
  defaultRerPoiCatalogItemTraits,
  LevelIdCameraHeightMapping
} from "../../../Traits/TraitsClasses/RerPoiCatalogItemTraits";
import Color from "terriajs-cesium/Source/Core/Color";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";

const geodesic = new EllipsoidGeodesic();

interface EsriJsonQueryOptions {
  resultOffset?: number;
  bbox?: Rectangle;
  minLevelId?: number;
  maxLevelId?: number;
  outFields?: string;
  orderByFields?: string;
  returnDistinctValues?: boolean;
  returnGeometry?: boolean;
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

interface RerPoiTraitSnapshot {
  cameraTiltLimitDegrees: number;
  defaultMarkerColor: string;
  domainIdField: string;
  dynamicRequestDebounceMs: number;
  iconStrokeColor: string;
  iconStrokeWidth: number;
  labelFontSize: number;
  labelOutlineColor: string;
  labelOutlineWidth: number;
  labelTextColor: string;
  levelIdField: string;
  levelIdMappings: LevelIdCameraHeightMapping[];
  markerSize: number;
  minLevelId: number;
  nameField: string;
  poiDomainStyleGroups: RerPoiCatalogItemTraits["poiDomainStyleGroups"];
  queryableProperties: RerPoiCatalogItemTraits["queryableProperties"];
  queryBboxPaddingRatio: number;
  scaleField: string;
  showDebugBBox: boolean;
  showLabels: boolean;
  where: string;
}

export default class RerPoiCatalogItem extends ArcGisFeatureServerCatalogItem {
  static readonly type = RER_POI_CATALOG_ITEM_TYPE;
  static readonly TraitsClass = RerPoiCatalogItemTraits;
  static readonly traits = RerPoiCatalogItemTraits.traits;

  readonly TraitsClass = RerPoiCatalogItemTraits;
  readonly traits = RerPoiCatalogItemTraits.traits;

  private removeCesiumCameraChangedListener: (() => void) | undefined;
  private removeLeafletViewportChangedListener: (() => void) | undefined;
  private removeBeforeViewerChangedListener: (() => void) | undefined;
  private removeViewerChangedListener: (() => void) | undefined;
  private removeCurrentViewerReaction: (() => void) | undefined;
  private removeViewerModeReaction: (() => void) | undefined;
  private removeShowReaction: (() => void) | undefined;
  private removeLanguageChangedListener: (() => void) | undefined;
  private removeTraitSnapshotReaction: (() => void) | undefined;
  private readonly computedKeepAliveDisposers: Array<() => void> = [];

  private dynamicReloadTimer: ReturnType<typeof setTimeout> | undefined;
  private pendingDynamicQuery: DynamicViewportQuery | undefined;
  private activeDynamicQuery: DynamicViewportQuery | undefined;
  private dynamicReloadQueued = false;
  private dynamicReloadInProgress = false;

  @observable private cameraTiltLimitExceeded = false;
  @observable private activeLanguage =
    i18next.resolvedLanguage ?? i18next.language;
  @observable.ref private rerPoiTraitSnapshot =
    createDefaultRerPoiTraitSnapshot();

  private managedDataSource: GeoJsonDataSource | undefined;
  private liveEntityByObjectId = new Map<string, any>();
  private isFirstDynamicLoad = true;
  private serviceEnumValuesLoadPromise: Promise<void> | undefined;
  private readonly serviceEnumValues = new Map<string, string[]>();

  @observable private debugDataSource: CustomDataSource | undefined;

  private readonly onDynamicViewportChanged = () => {
    const isPastLimit = this.isCameraPastTiltLimit();
    runInAction(() => {
      this.cameraTiltLimitExceeded = isPastLimit;
    });
    if (isPastLimit) return;
    this.queueDynamicReload();
  };

  private readonly onLanguageChanged = (language: string) => {
    runInAction(() => {
      this.activeLanguage = language;
    });
  };

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
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

    this.keepImperativeComputedViewsAlive();
    this.keepImperativeTraitSnapshotUpdated();
  }

  dispose() {
    super.dispose();
    this.stopDynamicViewportRequests();
    this.removeTraitSnapshotReaction?.();
    this.removeTraitSnapshotReaction = undefined;
    this.disposeImperativeComputedViews();
  }

  @override
  get mapItems() {
    const items = super.mapItems.slice();
    if (this.debugDataSource) {
      items.push(this.debugDataSource);
    }
    return items;
  }

  get type(): string {
    return RER_POI_CATALOG_ITEM_TYPE;
  }

  get objectIdField(): string {
    const stratum = this.strata.get("featureServer") as any;
    return stratum?._featureServer?.objectIdField ?? "OBJECTID";
  }

  @override
  get shortReport(): string | undefined {
    let report: string = "";

    if (this.cameraTiltLimitExceeded) {
      const tiltMessage = i18next.t(
        "models.rerPoiCatalogItem.exceededCameraTiltLimit",
        {
          cameraTiltLimitDegrees: this.getRerPoiTrait("cameraTiltLimitDegrees"),
          lng: this.activeLanguage
        }
      );
      report = report ? `${report}<br/>${tiltMessage}` : tiltMessage;
    }

    if (this.show && this.numberOfVisibleElements === 0) {
      const noVisiblePointsMessage = i18next.t(
        "models.rerPoiCatalogItem.noVisiblePoints",
        { lng: this.activeLanguage }
      );
      report = report
        ? `${report}<br/>${noVisiblePointsMessage}`
        : noVisiblePointsMessage;
    }

    return report;
  }

  private getRerPoiTrait<T extends keyof RerPoiTraitSnapshot>(
    traitName: T
  ): RerPoiTraitSnapshot[T] {
    return this.rerPoiTraitSnapshot[traitName];
  }

  private getRerPoiTraitForSnapshot<T extends keyof RerPoiCatalogItemTraits>(
    traitName: T
  ): RerPoiCatalogItemTraits[T] {
    const trait = RerPoiCatalogItemTraits.traits[traitName as string];
    const value = trait?.getValue(this as unknown as BaseModel);
    return cloneTraitValue(
      value === undefined ? defaultRerPoiCatalogItemTraits[traitName] : value
    ) as RerPoiCatalogItemTraits[T];
  }

  private buildRerPoiTraitSnapshot(): RerPoiTraitSnapshot {
    return {
      cameraTiltLimitDegrees: this.getRerPoiTraitForSnapshot(
        "cameraTiltLimitDegrees"
      ),
      defaultMarkerColor: this.getRerPoiTraitForSnapshot("defaultMarkerColor"),
      domainIdField: this.getRerPoiTraitForSnapshot("domainIdField"),
      dynamicRequestDebounceMs: this.getRerPoiTraitForSnapshot(
        "dynamicRequestDebounceMs"
      ),
      iconStrokeColor: this.getRerPoiTraitForSnapshot("iconStrokeColor"),
      iconStrokeWidth: this.getRerPoiTraitForSnapshot("iconStrokeWidth"),
      labelFontSize: this.getRerPoiTraitForSnapshot("labelFontSize"),
      labelOutlineColor: this.getRerPoiTraitForSnapshot("labelOutlineColor"),
      labelOutlineWidth: this.getRerPoiTraitForSnapshot("labelOutlineWidth"),
      labelTextColor: this.getRerPoiTraitForSnapshot("labelTextColor"),
      levelIdField: this.getRerPoiTraitForSnapshot("levelIdField"),
      levelIdMappings: this.getRerPoiTraitForSnapshot("levelIdMappings"),
      markerSize: this.getRerPoiTraitForSnapshot("markerSize"),
      minLevelId: this.getRerPoiTraitForSnapshot("minLevelId"),
      nameField: this.getRerPoiTraitForSnapshot("nameField"),
      poiDomainStyleGroups: this.getRerPoiTraitForSnapshot(
        "poiDomainStyleGroups"
      ),
      queryableProperties: this.getRerPoiTraitForSnapshot(
        "queryableProperties"
      ),
      queryBboxPaddingRatio: this.getRerPoiTraitForSnapshot(
        "queryBboxPaddingRatio"
      ),
      scaleField: this.getRerPoiTraitForSnapshot("scaleField"),
      showDebugBBox: this.getRerPoiTraitForSnapshot("showDebugBBox"),
      showLabels: this.getRerPoiTraitForSnapshot("showLabels"),
      where: this.getRerPoiTraitForSnapshot("where")
    };
  }

  private keepImperativeTraitSnapshotUpdated() {
    this.removeTraitSnapshotReaction = reaction(
      () => this.buildRerPoiTraitSnapshot(),
      (snapshot) => {
        runInAction(() => {
          this.rerPoiTraitSnapshot = snapshot;
        });
      },
      { fireImmediately: true }
    );
  }

  private keepImperativeComputedViewsAlive() {
    [
      "disableZoomTo",
      "queryProperties",
      "queryableProperties",
      "where",
      "zoomOnAddToWorkbench"
    ].forEach((property) => {
      this.computedKeepAliveDisposers.push(keepAlive(this, property));
    });
  }

  private disposeImperativeComputedViews() {
    this.computedKeepAliveDisposers.forEach((dispose) => dispose());
    this.computedKeepAliveDisposers.length = 0;
  }

  getEnumValues(propertyName: string): string[] {
    const queryableProperty = this.getRerPoiTrait("queryableProperties")?.find(
      (property) => property.propertyName === propertyName
    );

    if (queryableProperty?.loadValuesFromService) {
      return this.serviceEnumValues.get(propertyName) ?? [this.ENUM_ALL_VALUE];
    }

    const baseValues = this.getLoadedEnumValues(propertyName);
    const valuesFromData =
      baseValues.length > 0
        ? baseValues
        : runInAction(() => super.getEnumValues(propertyName));
    const preservedValues = (this.queryValues?.[propertyName] ?? []).flatMap(
      (value) =>
        queryableProperty?.enumMultiValue
          ? value.split(",").map((text) => text.trim())
          : [value]
    );

    const combinedValues = Array.from(
      new Set(
        [...valuesFromData, ...preservedValues].filter(
          (value) => isDefined(value) && value.length > 0
        )
      )
    );

    return combinedValues.includes(this.ENUM_ALL_VALUE)
      ? combinedValues
      : [this.ENUM_ALL_VALUE, ...combinedValues];
  }

  private startDynamicViewportRequests() {
    if (!this.removeBeforeViewerChangedListener) {
      this.removeBeforeViewerChangedListener =
        this.terria.mainViewer.beforeViewerChanged.addEventListener(() => {
          this.detachCurrentViewerListener();
        });
    }

    if (!this.removeViewerChangedListener) {
      this.removeViewerChangedListener =
        this.terria.mainViewer.afterViewerChanged.addEventListener(() => {
          this.refreshDynamicViewportRequestsForViewerChange();
        });
    }

    this.removeCurrentViewerReaction ??= reaction(
      () => this.terria.currentViewer,
      () => {
        this.refreshDynamicViewportRequestsForViewerChange();
      }
    );

    this.removeViewerModeReaction ??= reaction(
      () => this.terria.mainViewer.viewerMode,
      () => {
        this.refreshDynamicViewportRequestsForViewerChange();
      }
    );

    if (!this.removeLanguageChangedListener) {
      i18next.on("languageChanged", this.onLanguageChanged);
      this.removeLanguageChangedListener = () => {
        i18next.off("languageChanged", this.onLanguageChanged);
      };
    }

    runInAction(() => {
      this.activeLanguage = i18next.resolvedLanguage ?? i18next.language;
    });

    this.removeShowReaction ??= reaction(
      () => this.show,
      (show) => {
        if (show) this.queueDynamicReload(true);
      }
    );

    this.refreshDynamicViewportRequestsForViewerChange();
  }

  private refreshDynamicViewportRequestsForViewerChange() {
    this.resetDynamicViewportState();
    this.attachCurrentViewerListener();
    this.queueDynamicReload(true);
  }

  private resetDynamicViewportState() {
    if (this.dynamicReloadTimer) {
      clearTimeout(this.dynamicReloadTimer);
      this.dynamicReloadTimer = undefined;
    }

    this.dynamicReloadQueued = false;
    this.dynamicReloadInProgress = false;
    this.managedDataSource = undefined;
    this.liveEntityByObjectId.clear();
    this.isFirstDynamicLoad = true;
    this.pendingDynamicQuery = undefined;
    this.activeDynamicQuery = undefined;

    runInAction(() => {
      this.debugDataSource = undefined;
    });
  }

  private stopDynamicViewportRequests() {
    this.detachCurrentViewerListener();
    this.removeLanguageChangedListener?.();
    this.removeLanguageChangedListener = undefined;
    this.removeShowReaction?.();
    this.removeShowReaction = undefined;
    this.removeBeforeViewerChangedListener?.();
    this.removeBeforeViewerChangedListener = undefined;
    this.removeViewerChangedListener?.();
    this.removeViewerChangedListener = undefined;
    this.removeCurrentViewerReaction?.();
    this.removeCurrentViewerReaction = undefined;
    this.removeViewerModeReaction?.();
    this.removeViewerModeReaction = undefined;

    if (this.dynamicReloadTimer) {
      clearTimeout(this.dynamicReloadTimer);
      this.dynamicReloadTimer = undefined;
    }

    runInAction(() => {
      this.debugDataSource = undefined;
    });

    this.dynamicReloadQueued = false;
    this.dynamicReloadInProgress = false;
    this.managedDataSource = undefined;
    this.liveEntityByObjectId.clear();
    this.isFirstDynamicLoad = true;
    this.pendingDynamicQuery = undefined;
    this.activeDynamicQuery = undefined;
  }

  private attachCurrentViewerListener() {
    this.detachCurrentViewerListener();
    const cesium = this.terria.cesium;
    if (cesium) {
      this.removeCesiumCameraChangedListener =
        cesium.scene.camera.changed.addEventListener(
          this.onDynamicViewportChanged
        );
      this.onDynamicViewportChanged();
      return;
    }

    const leaflet = this.terria.leaflet;
    if (leaflet) {
      const map = leaflet.map;
      map.on("move", this.onDynamicViewportChanged);
      map.on("zoom", this.onDynamicViewportChanged);
      map.on("resize", this.onDynamicViewportChanged);
      this.removeLeafletViewportChangedListener = () => {
        map.off("move", this.onDynamicViewportChanged);
        map.off("zoom", this.onDynamicViewportChanged);
        map.off("resize", this.onDynamicViewportChanged);
      };
      this.onDynamicViewportChanged();
    }
  }

  private getLoadedEnumValues(propertyName: string): string[] {
    const queryableProperty = this.getRerPoiTrait("queryableProperties")?.find(
      (property) => property.propertyName === propertyName
    );
    if (!queryableProperty || !this.managedDataSource) return [];

    const now = JulianDate.now();
    const values = new Set<string>();

    for (const entity of this.managedDataSource.entities.values) {
      const rawValue = entity.properties?.[propertyName]?.getValue(now);
      if (!isDefined(rawValue)) continue;

      if (queryableProperty.enumMultiValue) {
        String(rawValue)
          .split(",")
          .map((text) => text.trim())
          .filter((text) => text.length > 0 && text !== this.ENUM_ALL_VALUE)
          .forEach((text) => values.add(text));
      } else {
        const normalized = String(rawValue).trim();
        if (normalized && normalized !== this.ENUM_ALL_VALUE) {
          values.add(normalized);
        }
      }
    }

    return [this.ENUM_ALL_VALUE, ...Array.from(values)];
  }

  private detachCurrentViewerListener() {
    this.removeCesiumCameraChangedListener?.();
    this.removeCesiumCameraChangedListener = undefined;
    this.removeLeafletViewportChangedListener?.();
    this.removeLeafletViewportChangedListener = undefined;
  }

  private async preloadServiceQueryableValues(): Promise<void> {
    const propertiesToLoad = (
      this.getRerPoiTrait("queryableProperties") ?? []
    ).filter(
      (property) =>
        property.propertyType === "enum" &&
        property.loadValuesFromService &&
        !this.serviceEnumValues.has(property.propertyName)
    );

    if (propertiesToLoad.length === 0) {
      return;
    }

    if (this.serviceEnumValuesLoadPromise) {
      return this.serviceEnumValuesLoadPromise;
    }

    this.serviceEnumValuesLoadPromise = Promise.allSettled(
      propertiesToLoad.map(async (property) => {
        const values = await this.loadQueryableValuesFromService(
          property.propertyName
        );
        this.serviceEnumValues.set(
          property.propertyName,
          this.buildEnumValuesFromService(values, property.enumMultiValue)
        );
      })
    )
      .then((results) => {
        for (const result of results) {
          if (result.status === "rejected") {
            console.warn(
              "[RerPoiCatalogItem] Failed to preload queryable values from service",
              result.reason
            );
          }
        }

        this.updateEnumValues();
        if (this.queryValues) {
          this.sanitizeQueryValues();
        }
      })
      .finally(() => {
        this.serviceEnumValuesLoadPromise = undefined;
      });

    return this.serviceEnumValuesLoadPromise;
  }

  private async loadQueryableValuesFromService(
    propertyName: string
  ): Promise<string[]> {
    const esriJson = await this.loadEsriJsonFromServer({
      outFields: propertyName,
      orderByFields: propertyName,
      returnDistinctValues: true,
      returnGeometry: false
    });

    return (esriJson.features ?? [])
      .map((feature) => feature.attributes?.[propertyName])
      .filter((value): value is string | number | boolean => isDefined(value))
      .map((value) => String(value));
  }

  private buildEnumValuesFromService(
    values: string[],
    enumMultiValue: boolean
  ): string[] {
    const normalizedValues = values
      .filter((value) => value !== this.ENUM_ALL_VALUE)
      .flatMap((value) =>
        enumMultiValue ? value.split(",").map((text) => text.trim()) : [value]
      );

    return [this.ENUM_ALL_VALUE, ...Array.from(new Set(normalizedValues))];
  }

  private async loadEsriJsonFromServer(
    queryOptions?: EsriJsonQueryOptions
  ): Promise<EsriJsonFeatureServerResponse> {
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
      return fetchPage();
    }

    const combined = await fetchPage(0);
    combined.features ??= [];

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

    return combined;
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
      this.activeDynamicQuery = nextQuery;
      this.syncCachedEntityVisibility(nextQuery);
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
          await this.preloadServiceQueryableValues();
          this.syncCachedEntityVisibility(nextQuery);
          this.updateEnumValues();
          this.sanitizeQueryValues();
        }
      } else {
        await this.applyIncrementalUpdate(nextQuery);
        this.updateEnumValues();
        this.sanitizeQueryValues();
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
    const totalPoiCount = this.managedDataSource.entities.values.length;

    for (const entity of this.managedDataSource.entities.values) {
      const inRectangle = isEntityInRectangle(entity, query.queryRectangle);
      const inLevelRange = this.isEntityInLevelRange(
        entity,
        now,
        minLevelId,
        maxLevelId
      );
      const matchesQueryableFilters = this.matchesQueryableFilters(entity, now);
      const isVisible =
        this.isProtectedLevelId(entity, now) ||
        (inRectangle && inLevelRange && matchesQueryableFilters);
      this.setEntityVisibility(entity, isVisible);
      if (isVisible) visiblePoiCount += 1;
    }
    console.log("[RerPoiCatalogItem] POI debug", {
      cachedPoiCount: this.liveEntityByObjectId.size,
      visiblePoiCount,
      totalPoiCount,
      viewerScale: this.getCurrentViewerScale(),
      minLevelId,
      maxLevelId
    });
    runInAction(() => {
      this.numberOfTotalElements = totalPoiCount;
      this.numberOfVisibleElements = visiblePoiCount;
    });
    this.terria.currentViewer.notifyRepaintRequired();
  }

  private setEntityVisibility(entity: any, isVisible: boolean) {
    entity.show = isVisible;
    const show = new ConstantProperty(isVisible);
    if (entity.billboard) entity.billboard.show = show;
    if (entity.point) entity.point.show = show;
    if (entity.label) entity.label.show = show;
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

  private isProtectedLevelId(entity: any, now: JulianDate): boolean {
    if (this.hasActiveFilters()) {
      return false;
    }

    const levelIdField = this.getRerPoiTrait("levelIdField");
    if (!levelIdField) return false;

    const raw = entity.properties?.[levelIdField]?.getValue(now);
    if (!isDefined(raw)) return false;

    return Number(raw) === 7;
  }

  private hasActiveFilters(): boolean {
    if (!this.queryValues) return false;

    return Object.values(this.queryValues)
      .flat()
      .some((value) => value !== "" && value !== this.ENUM_ALL_VALUE);
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

  filterData() {
    this.syncCachedEntityVisibility(
      this.activeDynamicQuery ?? this.getDynamicViewportQuery()
    );
  }

  private matchesQueryableFilters(entity: any, now: JulianDate): boolean {
    if (!this.queryProperties || !this.queryValues) return true;

    const selectedValuesArray = Object.values(this.queryValues);
    const showAll = !selectedValuesArray
      .flat()
      .some((value) => value !== "" && value !== this.ENUM_ALL_VALUE);

    if (showAll) return true;

    const entityProperties = entity.properties?.getValue(now);
    if (!entityProperties) return false;

    const normalizeSelectedValues = (values: string[] | undefined): string[] =>
      (values ?? [])
        .map((selectedValue) => selectedValue.trim().toLowerCase())
        .filter(
          (selectedValue) =>
            selectedValue !== "" &&
            selectedValue !== this.ENUM_ALL_VALUE.toLowerCase()
        );

    return Object.entries(this.queryValues).every(([key, value]) => {
      const property = this.queryProperties?.[key];
      if (!property) return true;

      if (!entity.properties?.hasProperty(key)) return false;

      const selectedValues = normalizeSelectedValues(value);
      const entityValue = entityProperties[key];
      if (entityValue === undefined || entityValue === null) return false;

      if (property.type === "date") {
        if (value[0] === "" || value[1] === "") return true;
        const fromDate = new Date(value[0]);
        const toDate = new Date(value[1]);
        const entityDate = new Date(String(entityValue));
        return (
          fromDate.getTime() < entityDate.getTime() &&
          entityDate.getTime() < toDate.getTime()
        );
      }

      if (selectedValues.length === 0) {
        return true;
      }

      const entityText = String(entityValue).trim().toLowerCase();
      if (property.type === "enum") {
        if (property.enumMultiValue) {
          const entityValues = entityText
            .split(",")
            .map((text) => text.trim())
            .filter((text) => text.length > 0);
          return selectedValues.some((selectedValue) =>
            entityValues.includes(selectedValue)
          );
        }

        return selectedValues.some(
          (selectedValue) => entityText === selectedValue
        );
      }

      return entityText === selectedValues[0];
    });
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

    const pruneRect = rectangleWithPadding(nextQuery.queryRectangle, 0.5);
    const now = JulianDate.now();
    const idsToRemove: string[] = [];
    for (const [id, entity] of this.liveEntityByObjectId) {
      if (
        !isEntityInRectangle(entity, pruneRect) &&
        !this.isProtectedLevelId(entity, now)
      ) {
        idsToRemove.push(id);
      }
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

      applyRerPoiEntityStyles(ds, newEntities, {
        isCesium2D: this.terria.mainViewer.viewerMode === ViewerMode.Cesium2D,
        defaultMarkerColor: this.getRerPoiTrait("defaultMarkerColor"),
        markerSize: this.getRerPoiTrait("markerSize"),
        iconStrokeWidth: this.getRerPoiTrait("iconStrokeWidth"),
        iconStrokeColor: this.getRerPoiTrait("iconStrokeColor"),
        showLabels: this.getRerPoiTrait("showLabels"),
        labelTextColor: this.getRerPoiTrait("labelTextColor"),
        labelFontSize: this.getRerPoiTrait("labelFontSize"),
        labelOutlineWidth: this.getRerPoiTrait("labelOutlineWidth"),
        labelOutlineColor: this.getRerPoiTrait("labelOutlineColor"),
        poiDomainStyleGroups: this.getRerPoiTrait("poiDomainStyleGroups"),
        scaleField: this.getRerPoiTrait("scaleField"),
        nameField: this.getRerPoiTrait("nameField"),
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

    applyRerPoiEntityStyles(dataSource, dataSource.entities.values, {
      isCesium2D: this.terria.mainViewer.viewerMode === ViewerMode.Cesium2D,
      defaultMarkerColor: this.getRerPoiTrait("defaultMarkerColor"),
      markerSize: this.getRerPoiTrait("markerSize"),
      iconStrokeWidth: this.getRerPoiTrait("iconStrokeWidth"),
      iconStrokeColor: this.getRerPoiTrait("iconStrokeColor"),
      showLabels: this.getRerPoiTrait("showLabels"),
      labelTextColor: this.getRerPoiTrait("labelTextColor"),
      labelFontSize: this.getRerPoiTrait("labelFontSize"),
      labelOutlineWidth: this.getRerPoiTrait("labelOutlineWidth"),
      labelOutlineColor: this.getRerPoiTrait("labelOutlineColor"),
      poiDomainStyleGroups: this.getRerPoiTrait("poiDomainStyleGroups"),
      scaleField: this.getRerPoiTrait("scaleField"),
      nameField: this.getRerPoiTrait("nameField"),
      domainIdField: this.getRerPoiTrait("domainIdField")
    });
    return dataSource;
  }

  protected async loadGeoJsonFromServer(
    queryOptions?: EsriJsonQueryOptions
  ): Promise<
    FeatureCollectionWithCrs<Geometry | GeometryCollection, Properties>
  > {
    const combined = await this.loadEsriJsonFromServer(queryOptions);

    if (!combined.features || combined.features.length === 0)
      throw new Error("RerPoi query returned no features");
    if (combined.features.length > this.maxFeatures)
      throw new Error("RerPoi query exceeded the maximum feature limit");
    if (combined.exceededTransferLimit === true)
      throw new Error("RerPoi query exceeded transfer limit");

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
      this.getRerPoiTrait("where"),
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
      .addQuery("outSR", "4326");

    uri.addQuery("outFields", queryOptions?.outFields ?? "*");

    if (queryOptions?.returnDistinctValues) {
      uri.addQuery("returnDistinctValues", "true");
    }

    if (queryOptions?.bbox) {
      uri
        .addQuery("geometry", rectangleToBounds(queryOptions.bbox))
        .addQuery("geometryType", "esriGeometryEnvelope")
        .addQuery("inSR", "4326")
        .addQuery("spatialRel", "esriSpatialRelIntersects")
        .addQuery("returnGeometry", "true");
    } else if (queryOptions?.returnGeometry !== undefined) {
      uri.addQuery(
        "returnGeometry",
        queryOptions.returnGeometry ? "true" : "false"
      );
    } else if (queryOptions?.returnDistinctValues) {
      uri.addQuery("returnGeometry", "false");
    }

    if (queryOptions?.orderByFields) {
      uri.addQuery("orderByFields", queryOptions.orderByFields);
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

  private getScreenBoundingBox(): Rectangle {
    const currentView = this.terria.currentViewer.getCurrentCameraView();
    const cesium = this.terria.cesium;
    if (!cesium) return currentView.rectangle;

    const scene = cesium.scene;
    const camera = scene.camera;
    const canvas = scene.canvas;
    const ellipsoid = scene.globe.ellipsoid;

    if (scene.mode === SceneMode.SCENE2D) {
      const rect = camera.computeViewRectangle(ellipsoid);
      return rect ?? currentView.rectangle;
    }

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const screenPoints = [
      new Cartesian2(0, 0),
      new Cartesian2(w / 2, 0),
      new Cartesian2(w, 0),
      new Cartesian2(0, h / 2),
      new Cartesian2(w / 2, h / 2),
      new Cartesian2(w, h / 2),
      new Cartesian2(0, h),
      new Cartesian2(w / 2, h),
      new Cartesian2(w, h)
    ];

    let minLon = Number.POSITIVE_INFINITY;
    let maxLon = Number.NEGATIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;
    let validPoints = 0;

    for (const pt of screenPoints) {
      const cartesian = camera.pickEllipsoid(pt, ellipsoid);
      if (cartesian) {
        const carto = Cartographic.fromCartesian(cartesian);
        if (carto) {
          minLon = Math.min(minLon, carto.longitude);
          maxLon = Math.max(maxLon, carto.longitude);
          minLat = Math.min(minLat, carto.latitude);
          maxLat = Math.max(maxLat, carto.latitude);
          validPoints++;
        }
      }
    }

    if (validPoints === screenPoints.length) {
      if (maxLon - minLon < Math.PI) {
        return new Rectangle(minLon, minLat, maxLon, maxLat);
      }
    }

    const nativeRect = camera.computeViewRectangle(ellipsoid);
    if (nativeRect) {
      return nativeRect;
    }

    return currentView.rectangle;
  }

  private renderDebugRectangles(cameraRect: Rectangle, queryRect: Rectangle) {
    if (!this.getRerPoiTrait("showDebugBBox")) {
      if (this.debugDataSource) {
        runInAction(() => {
          this.debugDataSource = undefined;
        });
        this.terria.currentViewer.notifyRepaintRequired();
      }
      return;
    }

    runInAction(() => {
      if (!this.debugDataSource) {
        this.debugDataSource = new CustomDataSource("RerPoiDebugBBox");
      }
    });

    const entities = this.debugDataSource!.entities;
    entities.suspendEvents();
    entities.removeAll();

    entities.add({
      name: "Camera View Rectangle",
      rectangle: {
        coordinates: cameraRect,
        material: Color.BLUE.withAlpha(0.2),
        outline: true,
        outlineColor: Color.BLUE,
        height: 500
      }
    } as any);

    entities.add({
      name: "Padded Query BBox",
      rectangle: {
        coordinates: queryRect,
        material: Color.RED.withAlpha(0.2),
        outline: true,
        outlineColor: Color.RED,
        height: 500
      }
    } as any);

    entities.resumeEvents();
    this.terria.currentViewer.notifyRepaintRequired();
  }

  private getDynamicViewportQuery(): DynamicViewportQuery | undefined {
    if (
      this.terria.currentViewer.type === "none" ||
      this.isCameraPastTiltLimit()
    ) {
      return undefined;
    }

    const screenRectangle = this.getScreenBoundingBox();
    const paddingRatio = this.getRerPoiTrait("queryBboxPaddingRatio");
    const queryRectangle = rectangleWithPadding(screenRectangle, paddingRatio);

    this.renderDebugRectangles(screenRectangle, queryRectangle);

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
    const viewerScale = this.getCurrentViewerScale();

    const maxLevelId =
      viewerScale === undefined
        ? minLevelId - 1
        : this.getProgressiveLevelIdFromScale(viewerScale, minLevelId);

    const levelIdField = this.getRerPoiTrait("levelIdField");
    return {
      minLevelId,
      maxLevelId,
      filterKey: [
        this.getRerPoiTrait("where"),
        levelIdField,
        minLevelId,
        maxLevelId
      ].join("|")
    };
  }

  private getProgressiveLevelIdMappings(): LevelIdCameraHeightMapping[] {
    const mappings = this.getRerPoiTrait("levelIdMappings");
    return mappings.length > 0
      ? mappings
      : defaultRerPoiCatalogItemTraits.levelIdMappings;
  }

  private getProgressiveLevelIdFromScale(
    viewerScale: number,
    minimumLevelId: number
  ): number {
    const levelIdMappings = this.getProgressiveLevelIdMappings();

    if (levelIdMappings.length === 0) {
      return minimumLevelId - 1;
    }

    let lastLevelId = levelIdMappings[levelIdMappings.length - 1].levelId;

    for (const mapping of levelIdMappings) {
      lastLevelId = mapping.levelId;

      if (viewerScale >= mapping.cameraHeightThreshold) {
        return mapping.levelId;
      }
    }

    return lastLevelId;
  }

  private getCurrentViewerScale(): number | undefined {
    const leafletScale = this.getLeafletViewerScale();
    if (isDefined(leafletScale)) return leafletScale;

    const scale = this.terria.mainViewer.scale;
    if (isDefined(scale) && Number.isFinite(scale)) {
      return scale * 100;
    }

    const cesium = this.terria.cesium;
    if (!cesium) return undefined;

    const scene = cesium.scene;
    const width = scene.canvas.clientWidth;
    const height = scene.canvas.clientHeight;

    if (width <= 1 || height <= 1) return undefined;

    const left = scene.camera.getPickRay(
      new Cartesian2((width / 2) | 0, height - 1)
    );
    const right = scene.camera.getPickRay(
      new Cartesian2((1 + width / 2) | 0, height - 1)
    );

    if (!isDefined(left) || !isDefined(right)) return undefined;

    const leftPosition = scene.globe.pick(left, scene);
    const rightPosition = scene.globe.pick(right, scene);

    if (!isDefined(leftPosition) || !isDefined(rightPosition)) return undefined;

    const leftCartographic =
      scene.globe.ellipsoid.cartesianToCartographic(leftPosition);
    const rightCartographic =
      scene.globe.ellipsoid.cartesianToCartographic(rightPosition);

    if (!isDefined(leftCartographic) || !isDefined(rightCartographic)) {
      return undefined;
    }

    geodesic.setEndPoints(leftCartographic, rightCartographic);
    return geodesic.surfaceDistance;
  }

  private getLeafletViewerScale(): number | undefined {
    const leaflet = this.terria.leaflet;
    if (!leaflet) return undefined;

    const map = leaflet.map;
    const size = map.getSize();
    if (size.x <= 1 || size.y <= 1) return undefined;

    const y = size.y / 2;
    const x = size.x / 2;
    const pixelDistance = map
      .containerPointToLatLng([x, y])
      .distanceTo(map.containerPointToLatLng([x + 1, y]));

    return Number.isFinite(pixelDistance) ? pixelDistance * 100 : undefined;
  }
}

function getDefaultRerPoiTrait<T extends keyof RerPoiCatalogItemTraits>(
  traitName: T
): RerPoiCatalogItemTraits[T] {
  return cloneTraitValue(defaultRerPoiCatalogItemTraits[traitName]);
}

function createDefaultRerPoiTraitSnapshot(): RerPoiTraitSnapshot {
  return {
    cameraTiltLimitDegrees: getDefaultRerPoiTrait("cameraTiltLimitDegrees"),
    defaultMarkerColor: getDefaultRerPoiTrait("defaultMarkerColor"),
    domainIdField: getDefaultRerPoiTrait("domainIdField"),
    dynamicRequestDebounceMs: getDefaultRerPoiTrait("dynamicRequestDebounceMs"),
    iconStrokeColor: getDefaultRerPoiTrait("iconStrokeColor"),
    iconStrokeWidth: getDefaultRerPoiTrait("iconStrokeWidth"),
    labelFontSize: getDefaultRerPoiTrait("labelFontSize"),
    labelOutlineColor: getDefaultRerPoiTrait("labelOutlineColor"),
    labelOutlineWidth: getDefaultRerPoiTrait("labelOutlineWidth"),
    labelTextColor: getDefaultRerPoiTrait("labelTextColor"),
    levelIdField: getDefaultRerPoiTrait("levelIdField"),
    levelIdMappings: getDefaultRerPoiTrait("levelIdMappings"),
    markerSize: getDefaultRerPoiTrait("markerSize"),
    minLevelId: getDefaultRerPoiTrait("minLevelId"),
    nameField: getDefaultRerPoiTrait("nameField"),
    poiDomainStyleGroups: getDefaultRerPoiTrait("poiDomainStyleGroups"),
    queryableProperties: getDefaultRerPoiTrait("queryableProperties"),
    queryBboxPaddingRatio: getDefaultRerPoiTrait("queryBboxPaddingRatio"),
    scaleField: getDefaultRerPoiTrait("scaleField"),
    showDebugBBox: getDefaultRerPoiTrait("showDebugBBox"),
    showLabels: getDefaultRerPoiTrait("showLabels"),
    where: getDefaultRerPoiTrait("where")
  };
}

function cloneTraitValue<T>(value: T): T {
  if (value instanceof BaseModel) {
    return Object.keys(value.traits).reduce((result, traitName) => {
      result[traitName] = cloneTraitValue((value as any)[traitName]);
      return result;
    }, {} as any);
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneTraitValue(item)) as T;
  }

  if (value !== null && typeof value === "object") {
    return Object.keys(value as any).reduce((result, key) => {
      result[key] = cloneTraitValue((value as any)[key]);
      return result;
    }, {} as any);
  }

  return value;
}

function rectangleWithPadding(
  rectangle: Rectangle,
  paddingRatio: number
): Rectangle {
  const width = Rectangle.computeWidth(rectangle);
  const height = Rectangle.computeHeight(rectangle);
  const safePadding = Math.max(0, paddingRatio);
  const lonPad = width * safePadding;
  const latPad = height * safePadding;

  return new Rectangle(
    CesiumMath.clamp(rectangle.west - lonPad, -Math.PI, Math.PI),
    CesiumMath.clamp(
      rectangle.south - latPad,
      -CesiumMath.PI_OVER_TWO,
      CesiumMath.PI_OVER_TWO
    ),
    CesiumMath.clamp(rectangle.east + lonPad, -Math.PI, Math.PI),
    CesiumMath.clamp(
      rectangle.north + latPad,
      -CesiumMath.PI_OVER_TWO,
      CesiumMath.PI_OVER_TWO
    )
  );
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

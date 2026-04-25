import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
  toJS,
  when
} from "mobx";
import { createTransformer } from "mobx-utils";
import Clock from "terriajs-cesium/Source/Core/Clock";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import TerrainProvider from "terriajs-cesium/Source/Core/TerrainProvider";
import buildModuleUrl from "terriajs-cesium/Source/Core/buildModuleUrl";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import URI from "urijs";
import NoopAnalytics from "../Core/Analytics/NoopAnalytics";
import {
  Category,
  DataSourceAction,
  LaunchAction
} from "../Core/Analytics/analyticEvents";
import { Analytics } from "../Core/Analytics/types";
import AsyncLoader from "../Core/AsyncLoader";
import Class from "../Core/Class";
import CorsProxy from "../Core/CorsProxy";
import {
  JsonObject,
  isJsonBoolean,
  isJsonNumber,
  isJsonObject,
  isJsonString
} from "../Core/Json";
import { isLatLonHeight } from "../Core/LatLonHeight";
import Result from "../Core/Result";
import TerriaError, {
  TerriaErrorOverrides,
  TerriaErrorSeverity
} from "../Core/TerriaError";
import ensureSuffix from "../Core/ensureSuffix";
import filterOutUndefined from "../Core/filterOutUndefined";
import getDereferencedIfExists from "../Core/getDereferencedIfExists";
import getPath from "../Core/getPath";
import hashEntity from "../Core/hashEntity";
import instanceOf from "../Core/instanceOf";
import isDefined from "../Core/isDefined";
import loadJson5 from "../Core/loadJson5";
import PickedFeatures, {
  featureBelongsToCatalogItem,
  isProviderCoordsMap
} from "../Map/PickedFeatures/PickedFeatures";
import CatalogMemberMixin, { getName } from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import MappableMixin, { isDataSource } from "../ModelMixins/MappableMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import TimeVarying from "../ModelMixins/TimeVarying";
import NotificationState from "../ReactViewModels/NotificationState";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import MapNavigationModel from "../ViewModels/MapNavigation/MapNavigationModel";
import TerriaViewer from "../ViewModels/TerriaViewer";
import { BaseMapsModel } from "./BaseMaps/BaseMapsModel";
import CameraView from "./CameraView";
import Catalog from "./Catalog/Catalog";
import CatalogMemberFactory from "./Catalog/CatalogMemberFactory";
import SplitItemReference from "./Catalog/CatalogReferences/SplitItemReference";
import CommonStrata from "./Definition/CommonStrata";
import { BaseModel } from "./Definition/Model";
import hasTraits from "./Definition/hasTraits";
import updateModelFromJson from "./Definition/updateModelFromJson";
import upsertModelFromJson from "./Definition/upsertModelFromJson";
import { ErrorServiceProvider } from "./ErrorServiceProviders/ErrorService";
import StubErrorServiceProvider from "./ErrorServiceProviders/StubErrorServiceProvider";
import TerriaFeature from "./Feature/Feature";
import { FeedbackService } from "./FeedbackService";
import GlobeOrMap from "./GlobeOrMap";
import { HashParams, emptyHashParams } from "./HashParams";
import IElementConfig from "./IElementConfig";
import InitSource, {
  InitSourceData,
  InitSourceFromData,
  StoryData,
  isInitFromData,
  isInitFromDataPromise,
  isInitFromOptions,
  isInitFromUrl
} from "./InitSource";
import Internationalization, { I18nStartOptions } from "./Internationalization";
import { LocalStorage } from "./LocalStorage";
import MapInteractionMode from "./MapInteractionMode";
import NoViewer from "./NoViewer";
import { PersistedSettings } from "./PersistedSettings";
import CatalogIndex from "./SearchProviders/CatalogIndex";
import { SearchBarModel } from "./SearchProviders/SearchBarModel";
import ShareDataService from "./ShareDataService";
import { ConfigParameters, TerriaConfig } from "./TerriaConfig";
import TimelineStack from "./TimelineStack";
import { isViewerMode, setViewerMode } from "./ViewerMode";
import Workbench from "./Workbench";
import SelectableDimensionWorkflow from "./Workflows/SelectableDimensionWorkflow";

interface TerriaOptions {
  config?: TerriaConfig;
  /**
   * Override detecting base href from document.baseURI.
   * Used in specs to support routes within Browser spec automation framework
   */
  appBaseHref?: string;

  /**
   * Base url where TerriaJS resources can be found.
   * Normally "build/TerriaJS/" in any TerriaMap and "./" in specs
   */
  baseUrl?: string;

  /**
   * Base url where Cesium static resources can be found.
   */
  cesiumBaseUrl?: string;
}

interface HomeCameraInit {
  [key: string]: HomeCameraInit[keyof HomeCameraInit];
  north: number;
  east: number;
  south: number;
  west: number;
}

export default class Terria {
  private readonly models = observable.map<string, BaseModel>();

  /** Map from share key -> id */
  readonly shareKeysMap = observable.map<string, string>();
  /** Map from id -> share keys */
  readonly modelIdShareKeysMap = observable.map<string, string[]>();

  /** Base URL to Terria resources */
  readonly baseUrl: string;

  readonly tileLoadProgressEvent = new CesiumEvent();
  readonly indeterminateTileLoadProgressEvent = new CesiumEvent();
  readonly workbench = new Workbench();
  readonly overlays = new Workbench();
  readonly searchBarModel = new SearchBarModel(this);
  readonly catalog = new Catalog(this);
  readonly baseMapsModel = new BaseMapsModel("basemaps", this);
  readonly timelineClock = new Clock({ shouldAnimate: false });

  readonly elements = observable.map<string, IElementConfig>();

  @observable
  readonly mainViewer = new TerriaViewer(
    this,
    computed(() =>
      filterOutUndefined(
        this.overlays.items
          .map((item) => (MappableMixin.isMixedInto(item) ? item : undefined))
          .concat(
            this.workbench.items.map((item) =>
              MappableMixin.isMixedInto(item) ? item : undefined
            )
          )
      )
    )
  );

  @computed
  get appName(): string {
    return this.configParameters.appName;
  }

  @computed
  get supportEmail(): string {
    return this.configParameters.supportEmail;
  }

  /**
   * Gets or sets the {@link this.corsProxy} used to determine if a URL needs to be proxied and to proxy it if necessary.
   * @type {CorsProxy}
   */
  corsProxy: CorsProxy = new CorsProxy();

  /**
   * Gets or sets the instance to which to report Google Analytics-style log
   * events. Default to NoopAnalytics, which does nothing. Can be set to
   * ConsoleAnalytics for development, or GoogleAnalytics to report to Google Analytics.
   */
  analytics: Analytics = new NoopAnalytics();

  /**
   *
   */
  feedbackService: FeedbackService | undefined;

  @observable shareDataService: ShareDataService | undefined;

  /**
   * An error service instance. The instance can be provided via the
   * `errorService` startOption. Here we initialize it to stub provider so
   * that the `terria.errorService` always exists.
   */
  errorService: ErrorServiceProvider = new StubErrorServiceProvider();

  /**
   * Gets the stack of layers active on the timeline.
   */
  readonly timelineStack = new TimelineStack(this, this.timelineClock);

  readonly configParameters: TerriaConfig;
  readonly localStorage: LocalStorage;

  @observable
  pickedFeatures: PickedFeatures | undefined;

  @observable
  selectedFeature: TerriaFeature | undefined;

  @observable
  allowFeatureInfoRequests: boolean = true;

  /**
   * Gets or sets the stack of map interactions modes.  The mode at the top of the stack
   * (highest index) handles click interactions with the map
   */
  @observable
  mapInteractionModeStack: MapInteractionMode[] = [];

  @observable isWorkflowPanelActive = false;

  /** Gets or sets the active SelectableDimensionWorkflow, if defined, then the workflow will be displayed using `WorkflowPanel` */
  @observable
  selectableDimensionWorkflow?: SelectableDimensionWorkflow;

  /**
   * Flag for zooming to workbench items after all init sources have been loaded.
   *
   * This is automatically enabled when your init file has the following settings:
   * ```
   *    {"initialCamera": {"focusWorkbenchItems": true}}
   * ```
   */
  private focusWorkbenchItemsAfterLoadingInitSources: boolean = false;

  @computed
  get baseMapContrastColor() {
    return (
      this.baseMapsModel.baseMapItems.find(
        (basemap) =>
          isDefined(basemap.item?.uniqueId) &&
          basemap.item?.uniqueId === this.mainViewer.baseMap?.uniqueId
      )?.contrastColor ?? "#ffffff"
    );
  }

  hashParams: HashParams = emptyHashParams;

  @observable
  playStoryOnInit: boolean = false;

  private persistedSettings: PersistedSettings = {};

  @observable
  readonly initSources: InitSource[] = [];
  private _initSourceLoader = new AsyncLoader(
    this.forceLoadInitSources.bind(this)
  );

  @observable stories: StoryData[] = [];
  @observable storyPromptShown: number = 0; // Story Prompt modal will be rendered when this property changes. See StandardUserInterface, section regarding sui.notifications. Ideally move this to ViewState.

  /**
   * Gets or sets the ID of the catalog member that is currently being
   * previewed. This is observed in ViewState. It is used to open "Add data" if a catalog member is open in a share link.
   * This should stay private - use viewState.viewCatalogMember() instead
   */
  @observable private _previewedItemId: string | undefined;
  get previewedItemId() {
    return this._previewedItemId;
  }

  /**
   * Model to use for map navigation
   */
  @observable mapNavigationModel: MapNavigationModel = new MapNavigationModel(
    this
  );

  /**
   * Whether we think all references in the catalog have been loaded
   * @type {boolean}
   */
  @observable catalogReferencesLoaded: boolean = false;

  augmentedVirtuality?: any;

  readonly notificationState: NotificationState = new NotificationState();

  readonly developmentEnv = process.env.NODE_ENV === "development";

  constructor({
    config = new TerriaConfig(),
    baseUrl = "build/TerriaJS/",
    appBaseHref,
    cesiumBaseUrl
  }: TerriaOptions = {}) {
    makeObservable(this);
    this.configParameters = config;
    this.localStorage = new LocalStorage(this.configParameters);

    appBaseHref = !appBaseHref
      ? ensureSuffix(
          typeof document !== "undefined" ? document.baseURI : "/",
          "/"
        )
      : ensureSuffix(
          typeof document !== "undefined"
            ? new URI(appBaseHref).absoluteTo(document.baseURI).toString()
            : appBaseHref,
          "/"
        );

    this.baseUrl = ensureSuffix(baseUrl, "/");

    // Try to construct an absolute URL to send to Cesium, as otherwise it resolves relative
    // to document.location instead of the correct document.baseURI
    // This URL can still be relative if Terria is running in an environment without `document`
    // (e.g. Node.js) and no absolute URL is passed as an option for `appBaseHref`. In this case,
    // send a relative URL to cesium
    const cesiumBaseUrlRelative =
      cesiumBaseUrl ?? `${this.baseUrl}build/Cesium/build/`;
    // Casting to `any` as `setBaseUrl` method is not part of the Cesiums' type definitions
    (buildModuleUrl as any).setBaseUrl(
      ensureSuffix(
        new URI(cesiumBaseUrlRelative).absoluteTo(appBaseHref).toString(),
        "/"
      )
    );
  }

  @computed
  get currentViewer(): GlobeOrMap {
    return this.mainViewer.currentViewer;
  }

  @computed
  get cesium(): import("./Cesium").default | undefined {
    if (
      isDefined(this.mainViewer) &&
      this.mainViewer.currentViewer.type === "Cesium"
    ) {
      return this.mainViewer.currentViewer as import("./Cesium").default;
    }
  }

  /**
   * @returns The currently active `TerrainProvider` or `undefined`.
   */
  @computed
  get terrainProvider(): TerrainProvider | undefined {
    return this.cesium?.terrainProvider;
  }

  @computed
  get leaflet(): import("./Leaflet").default | undefined {
    if (
      isDefined(this.mainViewer) &&
      this.mainViewer.currentViewer.type === "Leaflet"
    ) {
      return this.mainViewer.currentViewer as import("./Leaflet").default;
    }
  }

  @computed get modelValues() {
    return Array.from<BaseModel>(this.models.values());
  }

  @computed
  get modelIds() {
    return Array.from(this.models.keys());
  }

  setAnalyticsService(analytics: Analytics): Terria {
    this.analytics = analytics;

    return this;
  }

  setFeedbackService(feedbackService: FeedbackService): Terria {
    this.feedbackService = feedbackService;

    return this;
  }

  setErrorService(errorService: ErrorServiceProvider): Terria {
    this.errorService = errorService;

    return this;
  }

  @action
  setShareDataService(shareDataService: ShareDataService): Terria {
    this.shareDataService = shareDataService;

    return this;
  }

  @action
  setHashParams(hashParams: HashParams): Terria {
    this.hashParams = hashParams;

    if (isDefined(hashParams.hideWelcomeMessage)) {
      this.updateConfig({
        showWelcomeMessage: !hashParams.hideWelcomeMessage
      });
    }
    if (isDefined(hashParams.hideExplorerPanel)) {
      this.updateConfig({
        hideExplorerPanel: hashParams.hideExplorerPanel
      });
    }
    if (isDefined(hashParams.hideWorkbench)) {
      this.updateConfig({
        hideWorkbench: hashParams.hideWorkbench
      });
    }
    if (isDefined(hashParams.tools)) {
      this.updateConfig({
        tools: hashParams.tools
      });
    }
    if (isDefined(hashParams.map)) {
      setViewerMode(hashParams.map, this.mainViewer);
    }

    return this;
  }

  initCorsProxy(
    proxyAllDomains?: boolean,
    allowProxyFor?: string[],
    baseProxyUrl: string = CorsProxy.DEFAULT_BASE_PROXY_PATH,
    proxyDomains: string[] = []
  ): void {
    this.corsProxy.init(
      proxyAllDomains,
      allowProxyFor,
      baseProxyUrl,
      proxyDomains
    );
  }

  async initLanguage(i18nOptions?: I18nStartOptions): Promise<Terria> {
    await Internationalization.initLanguage(
      this.configParameters.languageConfiguration,
      i18nOptions,
      this.baseUrl
    );

    return this;
  }

  /**
   * Initialize catalog index. Note: this isn't loaded now, it is loaded in
   * first `CatalogSearchProvider.doSearch()`
   * @param url - the url of the catalog index, if not provided, it will be taken from `configParameters.catalogIndexUrl`
   */
  initCatalogIndex(
    url: string | undefined = this.configParameters.catalogIndexUrl
  ): Terria {
    if (url) {
      this.catalog.setIndex(new CatalogIndex(this, url));
    }
    return this;
  }

  init(): Terria {
    this.analytics.logEvent(
      Category.launch,
      LaunchAction.url,
      window.location.href
    );

    this.baseMapsModel.initializeDefaultBaseMaps();

    return this;
  }

  /** Raise error to user.
   *
   * This accepts same arguments as `TerriaError.from` - but also has:
   *
   * @param forceRaiseToUser - which can be used to force raise the error
   */
  raiseErrorToUser(
    error: unknown,
    overrides?: TerriaErrorOverrides,
    forceRaiseToUser = false
  ): void {
    const terriaError = TerriaError.from(error, overrides);

    // Set shouldRaiseToUser true if forceRaiseToUser agrument is true
    if (forceRaiseToUser) terriaError.overrideRaiseToUser = true;

    // Log error to error service
    this.errorService.error(terriaError);

    // Only show error to user if `ignoreError` flag hasn't been set to "1"
    // Note: this will take precedence over forceRaiseToUser/overrideRaiseToUser
    if (!this.configParameters.ignoreErrors)
      this.notificationState.addNotificationToQueue(
        terriaError.toNotification()
      );

    terriaError.log();
  }

  addInitSources(sources: InitSource[]): Terria {
    this.initSources.push(...sources);

    return this;
  }

  updateConfig(config: Partial<ConfigParameters>): Terria {
    this.configParameters.update(config);

    return this;
  }

  getModelById<T extends BaseModel>(type: Class<T>, id: string): T | undefined {
    const model = this.models.get(id);
    if (instanceOf(type, model)) {
      return model;
    }

    // Model does not have the requested type.
    return undefined;
  }

  @action
  addModel(model: BaseModel, shareKeys?: string[]): void {
    if (model.uniqueId === undefined) {
      throw new DeveloperError("A model without a `uniqueId` cannot be added.");
    }

    if (this.models.has(model.uniqueId)) {
      throw new RuntimeError(
        `A model with the specified ID already exists: \`${model.uniqueId}\``
      );
    }

    this.models.set(model.uniqueId, model);
    shareKeys?.forEach((shareKey) =>
      this.addShareKey(model.uniqueId!, shareKey)
    );
  }

  /**
   * Remove references to a model from Terria.
   */
  @action
  removeModelReferences(model: BaseModel): void {
    this.removeSelectedFeaturesForModel(model);
    this.workbench.remove(model);
    if (model.uniqueId) {
      this.models.delete(model.uniqueId);
    }
  }

  @action
  removeSelectedFeaturesForModel(model: BaseModel): void {
    const pickedFeatures = this.pickedFeatures;
    if (pickedFeatures) {
      // Remove picked features that belong to the catalog item
      pickedFeatures.features.forEach((feature, i) => {
        if (featureBelongsToCatalogItem(feature as TerriaFeature, model)) {
          pickedFeatures?.features.splice(i, 1);
          if (this.selectedFeature === feature)
            this.selectedFeature = undefined;
        }
      });
    }
  }

  getModelIdByShareKey(shareKey: string): string | undefined {
    return this.shareKeysMap.get(shareKey);
  }

  getModelByIdOrShareKey<T extends BaseModel>(
    type: Class<T>,
    id: string
  ): T | undefined {
    const model = this.getModelById(type, id);
    if (model) {
      return model;
    } else {
      const idFromShareKey = this.getModelIdByShareKey(id);
      return idFromShareKey !== undefined
        ? this.getModelById(type, idFromShareKey)
        : undefined;
    }
  }

  async getModelByIdShareKeyOrCatalogIndex(
    id: string
  ): Promise<Result<BaseModel | undefined>> {
    try {
      // See if model exists by ID of sharekey
      const model = this.getModelByIdOrShareKey(BaseModel, id);
      // If no model exists, try to find it through Terria model sharekeys or CatalogIndex sharekeys
      if (model?.uniqueId !== undefined) {
        return new Result(model);
      } else if (this.catalog.index) {
        try {
          await this.catalog.index.load();
        } catch (e) {
          throw TerriaError.from(
            e,
            `Failed to load CatalogIndex while trying to load model \`${id}\``
          );
        }
        const indexModel = this.catalog.index.getModelByIdOrShareKey(id);
        if (indexModel) {
          (await indexModel.loadReference()).throwIfError();
          return new Result(indexModel.target);
        }
      }
    } catch (e) {
      return Result.error(e);
    }
    return new Result(undefined);
  }

  @action
  addShareKey(id: string, shareKey: string): void {
    if (id === shareKey || this.shareKeysMap.has(shareKey)) return;
    this.shareKeysMap.set(shareKey, id);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.modelIdShareKeysMap.get(id)?.push(shareKey) ??
      this.modelIdShareKeysMap.set(id, [shareKey]);
  }

  /**
   * Zoom to workbench items if `focusWorkbenchItemsAfterLoadingInitSources` is `true`.
   *
   * Note that the current behaviour is to zoom to the first item of the
   * workbench, however in the future we should modify it to zoom to a view
   * which shows all the workbench items.
   *
   * If a Cesium or Leaflet viewer is not available,
   * we wait for it to load before triggering the zoom.
   */
  private async doZoomToWorkbenchItems() {
    if (!this.focusWorkbenchItemsAfterLoadingInitSources) {
      return;
    }

    // TODO: modify this to zoom to a view that shows all workbench items
    // instead of just zooming to the first workbench item!
    const firstMappableItem = this.workbench.items.find((item) =>
      MappableMixin.isMixedInto(item)
    ) as MappableMixin.Instance | undefined;
    if (firstMappableItem) {
      // When the app loads, Cesium/Leaflet viewers are loaded
      // asynchronously. Until they become available, a stub viewer called
      // `NoViewer` is used. `NoViewer` does not implement zooming to mappable
      // items. So here wait for a valid viewer to become available before
      // attempting to zoom to the mappable item.
      const isViewerAvailable = () => this.currentViewer.type !== NoViewer.type;
      // Note: In some situations the following use of when() can result in
      // a hanging promise if a valid viewer never becomes available,
      // for eg: when react is not rendered - `currentViewer` will always be `NoViewer`.
      await when(isViewerAvailable);
      await this.currentViewer.zoomTo(firstMappableItem, 0.0);
    }
  }

  async loadPersistedOrInitBaseMap(): Promise<void> {
    const baseMapItems = this.baseMapsModel.baseMapItems;
    // Set baseMap fallback to first option
    let baseMap = baseMapItems[0];
    const persistedBaseMapId = this.persistedSettings.baseMapId;
    const baseMapSearch = baseMapItems.find(
      (baseMapItem) => baseMapItem.item?.uniqueId === persistedBaseMapId
    );
    if (baseMapSearch?.item && MappableMixin.isMixedInto(baseMapSearch.item)) {
      baseMap = baseMapSearch;
    } else {
      // Try to find basemap using defaultBaseMapId and defaultBaseMapName
      const baseMapSearch =
        baseMapItems.find(
          (baseMapItem) =>
            baseMapItem.item?.uniqueId === this.baseMapsModel.defaultBaseMapId
        ) ??
        baseMapItems.find(
          (baseMapItem) =>
            CatalogMemberMixin.isMixedInto(baseMapItem) &&
            (baseMapItem.item as any).name ===
              this.baseMapsModel.defaultBaseMapName
        );
      if (
        baseMapSearch?.item &&
        MappableMixin.isMixedInto(baseMapSearch.item)
      ) {
        baseMap = baseMapSearch;
      }
    }
    if (baseMap?.item)
      await this.mainViewer.setBaseMap(baseMap.item as MappableMixin.Instance);
  }

  get isLoadingInitSources(): boolean {
    return this._initSourceLoader.isLoading;
  }

  /**
   * Asynchronously loads init sources
   */
  loadInitSources(): Promise<Result<void>> {
    return this._initSourceLoader.load();
  }

  dispose(): void {
    this._initSourceLoader.dispose();
  }

  protected async forceLoadInitSources(): Promise<void> {
    const loadInitSource = createTransformer(
      async (initSource: InitSource): Promise<InitSourceData | undefined> => {
        let initSourceData: InitSourceData | undefined;
        if (isInitFromUrl(initSource)) {
          try {
            const json = await loadJson5(initSource.initUrl);
            if (isJsonObject(json, false)) {
              initSourceData = json;
            }
          } catch (e) {
            throw TerriaError.from(e, {
              message: {
                key: "models.terria.loadingInitJsonMessage",
                parameters: { url: initSource.initUrl }
              }
            });
          }
        } else if (isInitFromOptions(initSource)) {
          let error: unknown;
          for (const option of initSource.options) {
            try {
              initSourceData = await loadInitSource(option);
              if (initSourceData !== undefined) break;
            } catch (err) {
              error = err;
            }
          }
          if (initSourceData === undefined && error !== undefined) throw error;
        } else if (isInitFromData(initSource)) {
          initSourceData = initSource.data;
        } else if (isInitFromDataPromise(initSource)) {
          initSourceData = (await initSource.data).throwIfError()?.data;
        }

        return initSourceData;
      }
    );

    const errors: TerriaError[] = [];

    // Load all init sources
    // Converts them to InitSourceFromData
    const loadedInitSources = await Promise.all(
      this.initSources.map(async (initSource) => {
        try {
          return {
            name: initSource.name,
            errorSeverity: initSource.errorSeverity,
            data: await loadInitSource(initSource)
          } as InitSourceFromData;
        } catch (e) {
          errors.push(
            TerriaError.from(e, {
              severity: initSource.errorSeverity,
              message: {
                key: "models.terria.loadingInitSourceError2Message",
                parameters: { loadSource: initSource.name ?? "Unknown source" }
              }
            })
          );
        }
      })
    );

    let baseMapPromise: Promise<void> | undefined;
    // Sequentially apply all InitSources
    for (let i = 0; i < loadedInitSources.length; i++) {
      const initSource = loadedInitSources[i];
      if (!isDefined(initSource?.data)) continue;
      try {
        const result = await this._applyInitData({
          initData: initSource!.data
        });
        if (result.baseMapPromise) {
          baseMapPromise = result.baseMapPromise;
        }
      } catch (e) {
        errors.push(
          TerriaError.from(e, {
            severity: initSource?.errorSeverity,
            message: {
              key: "models.terria.loadingInitSourceError2Message",
              parameters: {
                loadSource: initSource!.name ?? "Unknown source"
              }
            }
          })
        );
      }
    }

    // Wait for any basemap loaded from applyInitData to finish
    // loading before we restore from user preference.
    Promise.resolve(baseMapPromise).finally(() => {
      runInAction(() => {
        if (!this.mainViewer.baseMap) {
          // Note: there is no "await" here - as basemaps can take a while
          // to load and there is no need to wait for them to load before
          // rendering Terria
          this.loadPersistedOrInitBaseMap();
        }
      });
    });

    // Zoom to workbench items if any of the init sources specifically requested it
    if (this.focusWorkbenchItemsAfterLoadingInitSources) {
      this.doZoomToWorkbenchItems();
    }

    if (errors.length > 0) {
      // Note - this will get wrapped up in a Result object because it is called in AsyncLoader
      throw TerriaError.combine(errors, {
        title: { key: "models.terria.loadingInitSourcesErrorTitle" },
        message: {
          key: "models.terria.loadingInitSourcesErrorMessage",
          parameters: { appName: this.appName, email: this.supportEmail }
        }
      });
    }
  }

  private async loadModelStratum(
    modelId: string,
    stratumId: string,
    allModelStratumData: JsonObject,
    replaceStratum: boolean
  ): Promise<Result<BaseModel | undefined>> {
    const thisModelStratumData = allModelStratumData[modelId] || {};
    if (!isJsonObject(thisModelStratumData)) {
      throw new TerriaError({
        sender: this,
        title: "Invalid model traits",
        message: "The traits of a model must be a JSON object."
      });
    }

    const cleanStratumData = { ...thisModelStratumData };
    delete cleanStratumData.dereferenced;
    delete cleanStratumData.knownContainerUniqueIds;

    const errors: TerriaError[] = [];

    const containerIds = thisModelStratumData.knownContainerUniqueIds;
    if (Array.isArray(containerIds)) {
      // Groups that contain this item must be loaded before this item.
      await Promise.all(
        containerIds.map(async (containerId) => {
          if (typeof containerId !== "string") {
            return;
          }
          const container = (
            await this.loadModelStratum(
              containerId,
              stratumId,
              allModelStratumData,
              replaceStratum
            )
          ).pushErrorTo(errors, `Failed to load container ${containerId}`);

          if (container) {
            const dereferenced = ReferenceMixin.isMixedInto(container)
              ? container.target
              : container;
            if (GroupMixin.isMixedInto(dereferenced)) {
              (await dereferenced.loadMembers()).pushErrorTo(
                errors,
                `Failed to load group ${dereferenced.uniqueId}`
              );
            }
          }
        })
      );
    }

    const model = (
      await this.getModelByIdShareKeyOrCatalogIndex(modelId)
    ).pushErrorTo(errors);
    if (model?.uniqueId !== undefined) {
      // Update modelId from model sharekeys or CatalogIndex sharekeys
      modelId = model.uniqueId;
    }

    // If this model is a `SplitItemReference` we must load the source item first
    const splitSourceId = cleanStratumData.splitSourceItemId;
    if (
      cleanStratumData.type === SplitItemReference.type &&
      typeof splitSourceId === "string"
    ) {
      (
        await this.loadModelStratum(
          splitSourceId,
          stratumId,
          allModelStratumData,
          replaceStratum
        )
      ).pushErrorTo(
        errors,
        `Failed to load SplitItemReference ${splitSourceId}`
      );
    }

    const loadedModel = upsertModelFromJson(
      CatalogMemberFactory,
      this,
      "/",
      stratumId,
      {
        ...cleanStratumData,
        id: modelId
      },
      {
        replaceStratum
      }
    ).pushErrorTo(errors);

    if (loadedModel && Array.isArray(containerIds)) {
      containerIds.forEach((containerId) => {
        if (
          typeof containerId === "string" &&
          loadedModel.knownContainerUniqueIds.indexOf(containerId) < 0
        ) {
          loadedModel.knownContainerUniqueIds.push(containerId);
        }
      });
    }
    // If we're replacing the stratum and the existing model is already
    // dereferenced, we need to replace the dereferenced stratum, too,
    // even if there's no trace of it in the load data.
    let dereferenced: JsonObject | undefined = isJsonObject(
      thisModelStratumData.dereferenced
    )
      ? thisModelStratumData.dereferenced
      : undefined;
    if (
      loadedModel &&
      replaceStratum &&
      dereferenced === undefined &&
      ReferenceMixin.isMixedInto(loadedModel) &&
      loadedModel.target !== undefined
    ) {
      dereferenced = {};
    }
    if (loadedModel && ReferenceMixin.isMixedInto(loadedModel)) {
      (await loadedModel.loadReference()).pushErrorTo(
        errors,
        `Failed to load reference ${loadedModel.uniqueId}`
      );

      if (isDefined(loadedModel.target)) {
        updateModelFromJson(
          loadedModel.target,
          stratumId,
          dereferenced || {},
          replaceStratum
        ).pushErrorTo(
          errors,
          `Failed to update model from JSON: ${loadedModel.target!.uniqueId}`
        );
      }
    } else if (dereferenced) {
      throw new TerriaError({
        sender: this,
        title: "Model cannot be dereferenced",
        message: `Model ${getName(
          loadedModel
        )} has a \`dereferenced\` property, but the model cannot be dereferenced.`
      });
    }

    if (loadedModel) {
      const dereferencedGroup = getDereferencedIfExists(loadedModel);
      if (GroupMixin.isMixedInto(dereferencedGroup)) {
        if (dereferencedGroup.isOpen) {
          (await dereferencedGroup.loadMembers()).pushErrorTo(
            errors,
            `Failed to open group ${dereferencedGroup.uniqueId}`
          );
        }
      }
    }

    return new Result(
      loadedModel,
      TerriaError.combine(errors, {
        // This will set TerriaErrorSeverity to Error if the model which FAILED to load is in the workbench.
        severity: () =>
          this.workbench.items.find(
            (workbenchItem) => workbenchItem.uniqueId === modelId
          )
            ? TerriaErrorSeverity.Error
            : TerriaErrorSeverity.Warning,
        message: {
          key: "models.terria.loadModelErrorMessage",
          parameters: { model: modelId }
        }
      })
    );
  }

  private async pushAndLoadMapItems(
    model: BaseModel,
    newItems: BaseModel[],
    errors: TerriaError[]
  ) {
    if (ReferenceMixin.isMixedInto(model)) {
      (await model.loadReference()).pushErrorTo(errors);

      if (model.target !== undefined) {
        await this.pushAndLoadMapItems(model.target, newItems, errors);
      } else {
        errors.push(
          TerriaError.from(
            "Reference model has no target. Model Id: " + model.uniqueId
          )
        );
      }
    } else if (GroupMixin.isMixedInto(model)) {
      (await model.loadMembers()).pushErrorTo(errors);

      model.memberModels.map(async (m) => {
        await this.pushAndLoadMapItems(m, newItems, errors);
      });
    } else if (MappableMixin.isMixedInto(model)) {
      newItems.push(model);
      (await model.loadMapItems()).pushErrorTo(errors);
    } else {
      errors.push(
        TerriaError.from(
          "Can not load an un-mappable item to the map. Item Id: " +
            model.uniqueId
        )
      );
    }
  }

  async applyInitData(params: {
    initData: InitSourceData;
    replaceStratum?: boolean;
    // When feature picking state is missing from the initData, unset the state only if this flag is true
    // This is for eg, set to true when switching through story slides.
    canUnsetFeaturePickingState?: boolean;
  }): Promise<void> {
    await this._applyInitData(params);
  }

  /**
   * @private
   */
  @action
  async _applyInitData({
    initData,
    replaceStratum = false,
    canUnsetFeaturePickingState = false
  }: {
    initData: InitSourceData;
    replaceStratum?: boolean;
    canUnsetFeaturePickingState?: boolean;
  }): Promise<{ baseMapPromise: Promise<void> | undefined }> {
    const errors: TerriaError[] = [];

    initData = toJS(initData);

    let baseMapPromise: Promise<void> | undefined;

    const stratumId =
      typeof initData.stratum === "string"
        ? initData.stratum
        : CommonStrata.definition;

    // Extract the list of CORS-ready domains.
    if (Array.isArray(initData.corsDomains)) {
      this.corsProxy.corsDomains.push(...(initData.corsDomains as string[]));
    }

    // Add catalog members
    if (initData.catalog !== undefined) {
      this.catalog.group
        .addMembersFromJson(stratumId, initData.catalog)
        .pushErrorTo(errors);
    }

    // Show/hide elements in mapNavigationModel
    if (isJsonObject(initData.elements)) {
      this.elements.merge(initData.elements);
      // we don't want to go through all elements unless they are added.
      if (this.mapNavigationModel.items.length > 0) {
        this.elements.forEach((element, key) => {
          if (isDefined(element.visible)) {
            if (element.visible) {
              this.mapNavigationModel.show(key);
            } else {
              this.mapNavigationModel.hide(key);
            }
          }
        });
      }
    }

    // Add stories
    if (Array.isArray(initData.stories)) {
      this.stories = initData.stories;
      this.storyPromptShown++;
    }

    // Add map settings
    if (isJsonString(initData.viewerMode)) {
      const viewerMode = initData.viewerMode.toLowerCase();
      if (isViewerMode(viewerMode)) {
        setViewerMode(viewerMode, this.mainViewer);
      }
    }

    if (isJsonObject(initData.baseMaps)) {
      this.baseMapsModel
        .loadFromJson(CommonStrata.definition, initData.baseMaps)
        .pushErrorTo(errors, "Failed to load basemaps");
    }

    if (isJsonObject(initData.homeCamera)) {
      this.loadHomeCamera(initData.homeCamera);
    }

    if (isJsonObject(initData.initialCamera)) {
      // When initialCamera is set:
      // - try to construct a CameraView and zoom to it
      // - otherwise, if `initialCamera.focusWorkbenchItems` is `true` flag it
      //   so that we can zoom after the workbench items are loaded.
      // - If there are multiple initSources, the setting from the last source takes effect
      try {
        const initialCamera = CameraView.fromJson(initData.initialCamera);
        this.currentViewer.zoomTo(initialCamera, 2.0);
        // reset in case this was enabled by a previous initSource
        this.focusWorkbenchItemsAfterLoadingInitSources = false;
      } catch (error) {
        // Not a CameraView but does it specify focusWorkbenchItems?
        if (typeof initData.initialCamera.focusWorkbenchItems === "boolean") {
          this.focusWorkbenchItemsAfterLoadingInitSources =
            initData.initialCamera.focusWorkbenchItems;
        } else {
          throw error;
        }
      }
    }

    if (isJsonBoolean(initData.showSplitter)) {
      this.updateConfig({
        showSplitter: initData.showSplitter
      });
    }

    if (isJsonNumber(initData.splitPosition)) {
      this.updateConfig({
        splitPosition: initData.splitPosition
      });
    }

    if (isJsonObject(initData.settings)) {
      this.updateConfig({
        ...(isJsonNumber(initData.settings.baseMaximumScreenSpaceError) && {
          baseMaximumScreenSpaceError: initData.settings
            .baseMaximumScreenSpaceError as number
        }),
        ...(isJsonBoolean(initData.settings.useNativeResolution) && {
          useNativeResolution: initData.settings.useNativeResolution as boolean
        }),
        ...(isJsonBoolean(initData.settings.shortenShareUrls) && {
          shortenShareUrls: initData.settings.shortenShareUrls as boolean
        }),
        ...(isJsonNumber(initData.settings.terrainSplitDirection) && {
          terrainSplitDirection: initData.settings
            .terrainSplitDirection as SplitDirection
        }),
        ...(isJsonBoolean(initData.settings.depthTestAgainstTerrainEnabled) && {
          depthTestAgainstTerrainEnabled: initData.settings
            .depthTestAgainstTerrainEnabled as boolean
        })
      });
      if (isJsonBoolean(initData.settings.alwaysShowTimeline)) {
        this.timelineStack.setAlwaysShowTimeline(
          initData.settings.alwaysShowTimeline
        );
      }
      if (isJsonString(initData.settings.baseMapId)) {
        baseMapPromise = this.mainViewer.setBaseMap(
          this.baseMapsModel.baseMapItems.find(
            (item) => item.item.uniqueId === initData.settings!.baseMapId
          )?.item
        );
      }
    }

    // Copy but don't yet load the workbench.
    const workbench = Array.isArray(initData.workbench)
      ? initData.workbench.slice()
      : [];

    const timeline = Array.isArray(initData.timeline)
      ? initData.timeline.slice()
      : [];

    // NOTE: after this Promise, this function is no longer an `@action`
    const models = initData.models;
    if (isJsonObject(models, false)) {
      await Promise.all(
        Object.keys(models).map(async (modelId) => {
          (
            await this.loadModelStratum(
              modelId,
              stratumId,
              models,
              replaceStratum
            )
          ).pushErrorTo(errors);
        })
      );
    }

    runInAction(() => {
      if (isJsonString(initData.previewedItemId)) {
        this._previewedItemId = initData.previewedItemId;
      }
    });

    // Set the new contents of the workbench.
    const newItemsRaw = filterOutUndefined(
      workbench.map((modelId) => {
        if (typeof modelId !== "string") {
          errors.push(
            new TerriaError({
              sender: this,
              title: "Invalid model ID in workbench",
              message: "A model ID in the workbench list is not a string."
            })
          );
        } else {
          return this.getModelByIdOrShareKey(BaseModel, modelId);
        }
      })
    );

    const newItems: BaseModel[] = [];

    // Maintain the model order in the workbench.
    for (;;) {
      const model = newItemsRaw.shift();
      if (model) {
        await this.pushAndLoadMapItems(model, newItems, errors);
      } else {
        break;
      }
    }

    newItems.forEach((item) => {
      // fire the google analytics event
      this.analytics.logEvent(
        Category.dataSource,
        DataSourceAction.addFromShareOrInit,
        getPath(item)
      );
    });

    runInAction(() => (this.workbench.items = newItems));

    // For ids that don't correspond to models resolve an id by share keys
    const timelineWithShareKeysResolved = new Set(
      filterOutUndefined(
        timeline.map((modelId) => {
          if (typeof modelId !== "string") {
            errors.push(
              new TerriaError({
                sender: this,
                title: "Invalid model ID in timeline",
                message: "A model ID in the timneline list is not a string."
              })
            );
          } else {
            if (this.getModelById(BaseModel, modelId) !== undefined) {
              return modelId;
            } else {
              return this.getModelIdByShareKey(modelId);
            }
          }
        })
      )
    );

    // TODO: the timelineStack should be populated from the `timeline` property,
    // not from the workbench.
    runInAction(
      () =>
        (this.timelineStack.items = this.workbench.items
          .filter((item) => {
            return (
              item.uniqueId && timelineWithShareKeysResolved.has(item.uniqueId)
            );
            // && TODO: what is a good way to test if an item is of type TimeVarying.
          })
          .map((item) => item as TimeVarying))
    );

    if (isJsonObject(initData.pickedFeatures)) {
      when(() => !(this.currentViewer instanceof NoViewer)).then(() => {
        if (isJsonObject(initData.pickedFeatures)) {
          this.loadPickedFeatures(initData.pickedFeatures);
        }
      });
    } else if (canUnsetFeaturePickingState) {
      runInAction(() => {
        this.pickedFeatures = undefined;
        this.selectedFeature = undefined;
      });
    }

    if (errors.length > 0)
      throw TerriaError.combine(errors, {
        message: {
          key: "models.terria.loadingInitSourceErrorTitle"
        }
      });

    return { baseMapPromise };
  }

  @action
  loadHomeCamera(homeCameraInit: JsonObject | HomeCameraInit): void {
    this.mainViewer.homeCamera = CameraView.fromJson(homeCameraInit);
  }

  @action
  async loadPickedFeatures(pickedFeatures: JsonObject): Promise<void> {
    let vectorFeatures: TerriaFeature[] = [];
    const featureIndex: Record<number, TerriaFeature[] | undefined> = {};

    if (Array.isArray(pickedFeatures.entities)) {
      // Build index of terria features by a hash of their properties.
      const relevantItems = this.workbench.items.filter(
        (item) =>
          hasTraits(item, MappableTraits, "show") &&
          item.show &&
          MappableMixin.isMixedInto(item)
      ) as MappableMixin.Instance[];

      relevantItems.forEach((item) => {
        const entities: Entity[] = item.mapItems
          .filter(isDataSource)
          .reduce((arr: Entity[], ds) => arr.concat(ds.entities.values), []);

        entities.forEach((entity) => {
          const feature = TerriaFeature.fromEntityCollectionOrEntity(entity);
          const hash = hashEntity(feature, this);

          featureIndex[hash] = (featureIndex[hash] || []).concat([feature]);
        });
      });

      // Go through the features we've got from terria match them up to the id/name info we got from the
      // share link, filtering out any without a match.
      vectorFeatures = filterOutUndefined(
        pickedFeatures.entities.map((e) => {
          if (isJsonObject(e) && typeof e.hash === "number") {
            const features = featureIndex[e.hash] || [];
            const match = features.find((f) => f.name === e.name);
            return match;
          }
        })
      );
    }

    // Set the current pick location, if we have a valid coord
    const maybeCoords: any = pickedFeatures.pickCoords;
    const pickCoords = {
      latitude: maybeCoords?.lat,
      longitude: maybeCoords?.lng,
      height: maybeCoords?.height
    };
    if (
      isLatLonHeight(pickCoords) &&
      isProviderCoordsMap(pickedFeatures.providerCoords)
    ) {
      this.currentViewer.pickFromLocation(
        pickCoords,
        pickedFeatures.providerCoords,
        vectorFeatures
      );
    }

    if (this.pickedFeatures?.allFeaturesAvailablePromise) {
      // When feature picking is done, set the selected feature
      await this.pickedFeatures?.allFeaturesAvailablePromise;
    }

    runInAction(() => {
      this.pickedFeatures?.features.forEach((feature) => {
        const hash = hashEntity(feature, this);
        featureIndex[hash] = (featureIndex[hash] || []).concat([feature]);
      });

      // Find picked feature by matching feature hash
      // Also try to match name if defined
      const current = pickedFeatures.current;
      if (isJsonObject(current) && typeof current.hash === "number") {
        const selectedFeature =
          (featureIndex[current.hash] || []).find(
            (feature) => feature.name === current.name
          ) ?? featureIndex[current.hash]?.[0];
        if (selectedFeature) {
          this.selectedFeature = selectedFeature;
        }
      }
    });
  }
}

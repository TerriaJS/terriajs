import i18next from "i18next";
import { action, computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import Clock from "terriajs-cesium/Source/Core/Clock";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import URI from "urijs";
import { Category, LaunchAction } from "../Core/AnalyticEvents/analyticEvents";
import AsyncLoader from "../Core/AsyncLoader";
import Class from "../Core/Class";
import ConsoleAnalytics from "../Core/ConsoleAnalytics";
import CorsProxy from "../Core/CorsProxy";
import filterOutUndefined from "../Core/filterOutUndefined";
import GoogleAnalytics from "../Core/GoogleAnalytics";
import hashEntity from "../Core/hashEntity";
import instanceOf from "../Core/instanceOf";
import isDefined from "../Core/isDefined";
import { isJsonObject, JsonObject } from "../Core/Json";
import { isLatLonHeight } from "../Core/LatLonHeight";
import loadJson5 from "../Core/loadJson5";
import Result from "../Core/Result";
import ServerConfig from "../Core/ServerConfig";
import TerriaError, {
  TerriaErrorOverrides,
  TerriaErrorSeverity
} from "../Core/TerriaError";
import { Complete } from "../Core/TypeModifiers";
import { getUriWithoutPath } from "../Core/uriHelpers";
import PickedFeatures, {
  featureBelongsToCatalogItem,
  isProviderCoordsMap
} from "../Map/PickedFeatures/PickedFeatures";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import MappableMixin, { isDataSource } from "../ModelMixins/MappableMixin";
import { defaultTerms } from "../ReactViewModels/defaultTerms";
import NotificationState from "../ReactViewModels/NotificationState";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import MapNavigationModel from "../ViewModels/MapNavigation/MapNavigationModel";
import TerriaViewer from "../ViewModels/TerriaViewer";
import { BaseMapsModel } from "./BaseMaps/BaseMapsModel";
import CameraView from "./CameraView";
import Catalog from "./Catalog/Catalog";
import CatalogGroup from "./Catalog/CatalogGroup";
import MagdaReference from "./Catalog/CatalogReferences/MagdaReference";
import CommonStrata from "./Definition/CommonStrata";
import hasTraits from "./Definition/hasTraits";
import { BaseModel } from "./Definition/Model";
import {
  ErrorServiceOptions,
  ErrorServiceProvider,
  initializeErrorServiceProvider
} from "./ErrorServiceProviders/ErrorService";
import StubErrorServiceProvider from "./ErrorServiceProviders/StubErrorServiceProvider";
import Feature from "./Feature";
import GlobeOrMap from "./GlobeOrMap";
import IElementConfig from "./IElementConfig";
import { applyInitData } from "./InitData";
import InitSource, {
  addInitSourcesFromUrl,
  InitSourceData,
  addInitSourcesFromStartData,
  isInitFromData,
  isInitFromDataPromise,
  isInitFromOptions,
  isInitFromUrl,
  StoryData,
  addInitSourcesFromConfig
} from "./InitSource";
import Internationalization from "./Internationalization";
import MapInteractionMode from "./MapInteractionMode";
import CatalogIndex from "./SearchProviders/CatalogIndex";
import ShareDataService from "./ShareDataService";
import TimelineStack from "./TimelineStack";
import { isViewerMode, setViewerMode } from "./ViewerMode";
import Workbench from "./Workbench";
import SelectableDimensionWorkflow from "./Workflows/SelectableDimensionWorkflow";
import {
  Analytics,
  ConfigParameters,
  TerriaOptions,
  StartOptions,
  TerriaConfig,
  HomeCameraInit
} from "./TerriaConfig";
import updateApplicationOnHashChange from "../ViewModels/updateApplicationOnHashChange";
import updateApplicationOnMessageFromParentWindow from "../ViewModels/updateApplicationOnMessageFromParentWindow";

export default class Terria {
  private readonly models = observable.map<string, BaseModel>();

  /** Map from share key -> id */
  readonly shareKeysMap = observable.map<string, string>();
  /** Map from id -> share keys */
  readonly modelIdShareKeysMap = observable.map<string, string[]>();

  /** Base URL for the Terria app. Used for SPA routes */
  readonly appBaseHref: string =
    typeof document !== "undefined" ? document.baseURI : "/";
  /** Base URL to Terria resources */
  readonly baseUrl: string = "build/TerriaJS/";

  readonly tileLoadProgressEvent = new CesiumEvent();
  readonly indeterminateTileLoadProgressEvent = new CesiumEvent();
  readonly workbench = new Workbench();
  readonly overlays = new Workbench();
  readonly catalog = new Catalog(this);
  readonly baseMapsModel = new BaseMapsModel("basemaps", this);
  readonly timelineClock = new Clock({ shouldAnimate: false });
  // readonly overrides: any = overrides; // TODO: add options.functionOverrides like in master

  catalogIndex: CatalogIndex | undefined;

  readonly elements = observable.map<string, IElementConfig>();

  @observable
  readonly mainViewer = new TerriaViewer(
    this,
    computed(() =>
      filterOutUndefined(
        this.overlays.items
          .map(item => (MappableMixin.isMixedInto(item) ? item : undefined))
          .concat(
            this.workbench.items.map(item =>
              MappableMixin.isMixedInto(item) ? item : undefined
            )
          )
      )
    )
  );

  appName: string = "TerriaJS App";
  supportEmail: string = "info@terria.io";

  /**
   * Gets or sets the {@link this.corsProxy} used to determine if a URL needs to be proxied and to proxy it if necessary.
   * @type {CorsProxy}
   */
  corsProxy: CorsProxy = new CorsProxy();

  /**
   * Gets or sets the instance to which to report Google Analytics-style log events.
   * If a global `ga` function is defined, this defaults to `GoogleAnalytics`.  Otherwise, it defaults
   * to `ConsoleAnalytics`.
   */
  readonly analytics: Analytics | undefined;

  /**
   * Gets the stack of layers active on the timeline.
   */
  readonly timelineStack = new TimelineStack(this, this.timelineClock);

  @observable
  readonly configParameters: Complete<ConfigParameters> = {
    appName: "TerriaJS App",
    supportEmail: "info@terria.io",
    defaultMaximumShownFeatureInfos: 100,
    catalogIndexUrl: undefined,
    regionMappingDefinitionsUrl: "build/TerriaJS/data/regionMapping.json",
    proj4ServiceBaseUrl: "proj4def/",
    corsProxyBaseUrl: "proxy/",
    proxyableDomainsUrl: "proxyabledomains/", // deprecated, will be determined from serverconfig
    serverConfigUrl: "serverconfig/",
    shareUrl: "share",
    feedbackUrl: undefined,
    initFragmentPaths: ["init/"],
    storyEnabled: true,
    interceptBrowserPrint: true,
    tabbedCatalog: false,
    useCesiumIonTerrain: true,
    cesiumTerrainUrl: undefined,
    cesiumTerrainAssetId: undefined,
    cesiumIonAccessToken: undefined,
    useCesiumIonBingImagery: undefined,
    bingMapsKey: undefined,
    hideTerriaLogo: false,
    brandBarElements: undefined,
    brandBarSmallElements: undefined,
    displayOneBrand: 0,
    disableMyLocation: undefined,
    disableSplitter: undefined,
    disablePedestrianMode: false,
    experimentalFeatures: undefined,
    magdaReferenceHeaders: undefined,
    locationSearchBoundingBox: undefined,
    googleAnalyticsKey: undefined,
    errorService: undefined,
    globalDisclaimer: undefined,
    theme: {},
    showWelcomeMessage: false,
    welcomeMessageVideo: {
      videoTitle: "Getting started with the map",
      videoUrl: "https://www.youtube-nocookie.com/embed/FjSxaviSLhc",
      placeholderImage:
        "https://img.youtube.com/vi/FjSxaviSLhc/maxresdefault.jpg"
    },
    showInAppGuides: false,
    helpContent: [],
    helpContentTerms: defaultTerms,
    languageConfiguration: undefined,
    customRequestSchedulerLimits: undefined,
    persistViewerMode: true,
    openAddData: false,
    feedbackPreamble: "translate#feedback.feedbackPreamble",
    feedbackPostamble: undefined,
    feedbackMinLength: 0,
    leafletAttributionPrefix: undefined,
    extraCreditLinks: [
      // Default credit links (shown at the bottom of the Cesium map)
      {
        text: "map.extraCreditLinks.dataAttribution",
        url: "about.html#data-attribution"
      },
      { text: "map.extraCreditLinks.disclaimer", url: "about.html#disclaimer" }
    ],
    printDisclaimer: undefined,
    storyRouteUrlPrefix: undefined,
    enableConsoleAnalytics: undefined,
    googleAnalyticsOptions: undefined
  };

  @observable
  pickedFeatures: PickedFeatures | undefined;

  @observable
  selectedFeature: Feature | undefined;

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

  @computed
  get baseMapContrastColor() {
    return (
      this.baseMapsModel.baseMapItems.find(
        basemap =>
          isDefined(basemap.item?.uniqueId) &&
          basemap.item?.uniqueId === this.mainViewer.baseMap?.uniqueId
      )?.contrastColor ?? "#ffffff"
    );
  }

  @observable
  readonly userProperties = new Map<string, any>();

  @observable
  readonly initSources: InitSource[] = [];
  private _initSourceLoader = new AsyncLoader(
    this.forceLoadInitSources.bind(this)
  );

  @observable serverConfig: any; // TODO
  @observable shareDataService: ShareDataService | undefined;

  /* Splitter controls */
  @observable showSplitter = false;
  @observable splitPosition = 0.5;
  @observable splitPositionVertical = 0.5;
  @observable terrainSplitDirection: SplitDirection = SplitDirection.NONE;

  @observable depthTestAgainstTerrainEnabled = false;

  @observable stories: StoryData[] = [];
  @observable storyPromptShown: number = 0; // Story Prompt modal will be rendered when this property changes. See StandardUserInterface, section regarding sui.notifications. Ideally move this to ViewState.

  /**
   * Gets or sets the ID of the catalog member that is currently being
   * previewed. This is observed in ViewState. It is used to open "Add data" if a catalog member is open in a share link.
   * Use viewState.viewCatalogMember() instead
   */
  @observable previewedItemId: string | undefined;

  /**
   * Base ratio for maximumScreenSpaceError
   * @type {number}
   */
  @observable baseMaximumScreenSpaceError = 2;

  /**
   * Model to use for map navigation
   */
  @observable mapNavigationModel: MapNavigationModel = new MapNavigationModel(
    this
  );

  /**
   * Gets or sets whether to use the device's native resolution (sets cesium.viewer.resolutionScale to a ratio of devicePixelRatio)
   * @type {boolean}
   */
  @observable useNativeResolution = false;

  /**
   * Whether we think all references in the catalog have been loaded
   * @type {boolean}
   */
  @observable catalogReferencesLoaded: boolean = false;

  augmentedVirtuality?: any;

  readonly notificationState: NotificationState = new NotificationState();

  readonly developmentEnv = process?.env?.NODE_ENV === "development";

  /**
   * An error service instance. The instance can be configured by setting the
   * `errorService` config parameter. Here we initialize it to stub provider so
   * that the `terria.errorService` always exists.
   */
  errorService: ErrorServiceProvider = new StubErrorServiceProvider();

  constructor(options: TerriaOptions = {}) {
    if (options.appBaseHref) {
      this.appBaseHref = new URL(
        options.appBaseHref,
        typeof document !== "undefined" ? document.baseURI : "/"
      ).toString();
    }
    if (options.baseUrl) {
      if (options.baseUrl.lastIndexOf("/") !== options.baseUrl.length - 1) {
        this.baseUrl = options.baseUrl + "/";
      } else {
        this.baseUrl = options.baseUrl;
      }
    }

    this.analytics = options.analytics;
    if (!defined(this.analytics)) {
      if (typeof window !== "undefined" && defined((<any>window).ga)) {
        this.analytics = new GoogleAnalytics();
      } else {
        this.analytics = new ConsoleAnalytics();
      }
    }
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
  ) {
    const terriaError = TerriaError.from(error, overrides);

    // Set shouldRaiseToUser true if forceRaiseToUser agrument is true
    if (forceRaiseToUser) terriaError.overrideRaiseToUser = true;

    // Log error to error service
    this.errorService.error(terriaError);

    // Only show error to user if `ignoreError` flag hasn't been set to "1"
    // Note: this will take precedence over forceRaiseToUser/overrideRaiseToUser
    if (this.userProperties.get("ignoreErrors") !== "1")
      this.notificationState.addNotificationToQueue(
        terriaError.toNotification()
      );

    terriaError.log();
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
    return Array.from(this.models.values());
  }

  @computed
  get modelIds() {
    return Array.from(this.models.keys());
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
  addModel(model: BaseModel, shareKeys?: string[]) {
    if (model.uniqueId === undefined) {
      throw new DeveloperError("A model without a `uniqueId` cannot be added.");
    }

    if (this.models.has(model.uniqueId)) {
      throw new RuntimeError(
        `A model with the specified ID already exists: \`${model.uniqueId}\``
      );
    }

    this.models.set(model.uniqueId, model);
    shareKeys?.forEach(shareKey => this.addShareKey(model.uniqueId!, shareKey));
  }

  /**
   * Remove references to a model from Terria.
   */
  @action
  removeModelReferences(model: BaseModel) {
    this.removeSelectedFeaturesForModel(model);
    this.workbench.remove(model);
    if (model.uniqueId) {
      this.models.delete(model.uniqueId);
    }
  }

  @action
  removeSelectedFeaturesForModel(model: BaseModel) {
    const pickedFeatures = this.pickedFeatures;
    if (pickedFeatures) {
      // Remove picked features that belong to the catalog item
      pickedFeatures.features.forEach((feature, i) => {
        if (featureBelongsToCatalogItem(<Feature>feature, model)) {
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
    let model = this.getModelById(type, id);
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
      } else if (this.catalogIndex) {
        try {
          await this.catalogIndex.load();
        } catch (e) {
          throw TerriaError.from(
            e,
            `Failed to load CatalogIndex while trying to load model \`${id}\``
          );
        }
        const indexModel = this.catalogIndex.getModelByIdOrShareKey(id);
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
  addShareKey(id: string, shareKey: string) {
    if (id === shareKey || this.shareKeysMap.has(shareKey)) return;
    this.shareKeysMap.set(shareKey, id);
    this.modelIdShareKeysMap.get(id)?.push(shareKey) ??
      this.modelIdShareKeysMap.set(id, [shareKey]);
  }

  /**
   * Initialize errorService from config parameters.
   */
  setupErrorServiceProvider(errorService: ErrorServiceOptions) {
    initializeErrorServiceProvider(errorService)
      .then(errorService => {
        this.errorService = errorService;
      })
      .catch(e => {
        console.error("Failed to initialize error service", e);
      });
  }

  /** Main Terria initalization function:
   * 1. Set `ignoreErrors` userProperty from hash parameters (All other hashProperties are set in InitSource.addInitSourcesFromUrl())
   * 2.
   */
  async start(options: StartOptions) {
    // Some hashProperties need to be set before anything else happens - only the following are used:
    // - ignoreErrors
    // - configUrl
    //
    const hashProperties = queryToObject(new URI(window.location).fragment());

    if (isDefined(hashProperties["ignoreErrors"])) {
      this.userProperties.set("ignoreErrors", hashProperties["ignoreErrors"]);
    }

    // If in development environment, allow usage of #configUrl to set Terria config URL
    if (this.developmentEnv) {
      if (
        isDefined(hashProperties["configUrl"]) &&
        hashProperties["configUrl"] !== ""
      )
        options.configUrl = hashProperties["configUrl"];
    }

    const baseUri = new URI(options.configUrl).filename("");

    // Load TerriaConfig
    // -
    // - update this.configParameters
    // - Add InitSources from config JSON (eg initializationUrls)
    // -
    try {
      const config = await loadJson5(
        options.configUrl,
        options.configUrlHeaders
      );

      // If it's a magda config, we only load magda config and parameters should never be a property on the direct
      // config aspect (it would be under the `terria-config` aspect)
      if (isJsonObject(config) && config.aspects) {
        await this.loadMagdaConfig(options.configUrl, config, baseUri);
      }

      // If it's TerriaConfig,
      runInAction(() => {
        if (isJsonObject(config) && isJsonObject(config.parameters)) {
          this.updateParameters(config.parameters);
          addInitSourcesFromConfig(this, baseUri, config);
        }
      });
    } catch (error) {
      this.raiseErrorToUser(error, {
        sender: this,
        title: { key: "models.terria.loadConfigErrorTitle" },
        message: `Couldn't load ${options.configUrl}`,
        severity: TerriaErrorSeverity.Error
      });
    }

    // Init error service
    if (this.configParameters.errorService) {
      this.setupErrorServiceProvider(this.configParameters.errorService);
    }

    // Init Internationalization
    if (!options.i18nOptions?.skipInit) {
      Internationalization.initLanguage(
        this.configParameters.languageConfiguration,
        options.i18nOptions,
        this.baseUrl
      );
    }

    // Apply custom request scheduler for domains
    if (isDefined(this.configParameters.customRequestSchedulerLimits)) {
      Object.entries(
        this.configParameters.customRequestSchedulerLimits
      ).forEach(([domain, limit]) => {
        RequestScheduler.requestsByServer[domain] = limit;
      });
    }

    // Init analytics
    this.analytics?.start(this.configParameters);
    const launchUrlForAnalytics =
      options.applicationUrl?.href || getUriWithoutPath(baseUri);
    this.analytics?.logEvent(
      Category.launch,
      LaunchAction.url,
      launchUrlForAnalytics
    );

    // Load server config
    this.serverConfig = new ServerConfig();
    const serverConfig = await this.serverConfig.init(
      this.configParameters.serverConfigUrl
    );

    // Init cors proxy
    if (this.configParameters.proxyableDomainsUrl) {
      console.warn(i18next.t("models.terria.proxyableDomainsDeprecation"));
    }
    this.corsProxy.init(
      serverConfig,
      this.configParameters.corsProxyBaseUrl,
      []
    );

    // Init share data service
    this.shareDataService = options.shareDataService;
    if (this.shareDataService && this.serverConfig.config) {
      this.shareDataService.init(this.serverConfig.config);
    }

    // Init catalog index if catalogIndexUrl is set
    // Note: this isn't loaded now, it is loaded in first CatalogSearchProvider.doSearch()
    if (this.configParameters.catalogIndexUrl && !this.catalogIndex) {
      this.catalogIndex = new CatalogIndex(
        this,
        this.configParameters.catalogIndexUrl
      );
    }

    // Init Basemaps
    this.baseMapsModel
      .initializeDefaultBaseMaps()
      .catchError(error =>
        this.raiseErrorToUser(
          TerriaError.from(error, "Failed to load default basemaps")
        )
      );

    // Create init sources from URL
    if (options.applicationUrl?.href) {
      try {
        await addInitSourcesFromUrl(this, options.applicationUrl?.href);
      } catch (e) {
        this.raiseErrorToUser(e);
      }
    }

    this.loadPersistedMapSettings();

    // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
    updateApplicationOnHashChange(this, window);
    updateApplicationOnMessageFromParentWindow(this, window);
  }

  /** Load persisted map settings, this should be called after `addInitSourcesFromUrl`*/
  private loadPersistedMapSettings(): void {
    const persistViewerMode = this.configParameters.persistViewerMode;
    const hashViewerMode = this.userProperties.get("map");
    if (hashViewerMode && isViewerMode(hashViewerMode)) {
      setViewerMode(hashViewerMode, this.mainViewer);
    } else if (persistViewerMode) {
      const viewerMode = <string>this.getLocalProperty("viewermode");
      if (isDefined(viewerMode) && isViewerMode(viewerMode)) {
        setViewerMode(viewerMode, this.mainViewer);
      }
    }
    const useNativeResolution = this.getLocalProperty("useNativeResolution");
    if (typeof useNativeResolution === "boolean") {
      this.setUseNativeResolution(useNativeResolution);
    }

    const baseMaximumScreenSpaceError = parseFloat(
      this.getLocalProperty("baseMaximumScreenSpaceError")?.toString() || ""
    );
    if (!isNaN(baseMaximumScreenSpaceError)) {
      this.setBaseMaximumScreenSpaceError(baseMaximumScreenSpaceError);
    }
  }

  private async loadPersistedOrInitBaseMap() {
    const baseMapItems = this.baseMapsModel.baseMapItems;
    // Set baseMap fallback to first option
    let baseMap = baseMapItems[0];
    const persistedBaseMapId = this.getLocalProperty("basemap");
    const baseMapSearch = baseMapItems.find(
      baseMapItem => baseMapItem.item?.uniqueId === persistedBaseMapId
    );
    if (baseMapSearch?.item && MappableMixin.isMixedInto(baseMapSearch.item)) {
      baseMap = baseMapSearch;
    } else {
      // Try to find basemap using defaultBaseMapId and defaultBaseMapName
      const baseMapSearch =
        baseMapItems.find(
          baseMapItem =>
            baseMapItem.item?.uniqueId === this.baseMapsModel.defaultBaseMapId
        ) ??
        baseMapItems.find(
          baseMapItem =>
            CatalogMemberMixin.isMixedInto(baseMapItem) &&
            (<any>baseMapItem.item).name ===
              this.baseMapsModel.defaultBaseMapName
        );
      if (
        baseMapSearch?.item &&
        MappableMixin.isMixedInto(baseMapSearch.item)
      ) {
        baseMap = baseMapSearch;
      }
    }
    await this.mainViewer.setBaseMap(<MappableMixin.Instance>baseMap.item);
  }

  get isLoadingInitSources(): boolean {
    return this._initSourceLoader.isLoading;
  }

  /**
   * Asynchronously loads init sources
   */
  loadInitSources() {
    return this._initSourceLoader.load();
  }

  dispose() {
    this._initSourceLoader.dispose();
  }

  /** Adds InitSources from URL and then load **all** InitSources */
  async updateApplicationUrl(newUrl: string) {
    return await this.loadInitSources();
  }

  @action
  updateParameters(parameters: ConfigParameters | JsonObject): void {
    Object.entries(parameters).forEach(([key, value]) => {
      if (this.configParameters.hasOwnProperty(key)) {
        (this.configParameters as any)[key] = value;
      }
    });

    this.appName = defaultValue(this.configParameters.appName, this.appName);
    this.supportEmail = defaultValue(
      this.configParameters.supportEmail,
      this.supportEmail
    );
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
    const loadedInitSources = await Promise.all(
      this.initSources.map(async initSource => {
        try {
          return {
            ...initSource,
            data: await loadInitSource(initSource)
          };
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

    // Apply all init sources
    await Promise.all(
      loadedInitSources.map(async initSource => {
        if (!isDefined(initSource?.data)) return;
        try {
          await applyInitData(this, {
            initData: initSource!.data
          });
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
      })
    );

    // Load basemap
    runInAction(() => {
      if (!this.mainViewer.baseMap) {
        // Note: there is no "await" here - as basemaps can take a while to load and there is no need to wait for them to load before rendering Terria
        this.loadPersistedOrInitBaseMap();
      }
    });

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

  /**
   * This method can be used to refresh magda based catalogue configuration. Useful if the catalogue
   * has items that are only available to authorised users.
   *
   * @param magdaCatalogConfigUrl URL of magda based catalogue configuration
   * @param config Optional. If present, use this magda based catalogue config instead of reloading.
   * @param configUrlHeaders  Optional. If present, the headers are added to above URL request.
   */
  async refreshCatalogMembersFromMagda(
    magdaCatalogConfigUrl: string,
    config?: any,
    configUrlHeaders?: { [key: string]: string }
  ) {
    const theConfig = config
      ? config
      : await loadJson5(magdaCatalogConfigUrl, configUrlHeaders);

    // force config (root group) id to be `/`
    const id = "/";
    this.removeModelReferences(this.catalog.group);

    let existingReference = this.getModelById(MagdaReference, id);
    if (existingReference === undefined) {
      existingReference = new MagdaReference(id, this);
      // Add model with terria aspects shareKeys
      this.addModel(existingReference, theConfig.aspects?.terria?.shareKeys);
    }

    const reference = existingReference;

    const magdaRoot = new URI(magdaCatalogConfigUrl)
      .path("")
      .query("")
      .toString();

    reference.setTrait(CommonStrata.definition, "url", magdaRoot);
    reference.setTrait(CommonStrata.definition, "recordId", id);
    reference.setTrait(
      CommonStrata.definition,
      "magdaRecord",
      theConfig as JsonObject
    );
    (await reference.loadReference(true)).raiseError(
      this,
      `Failed to load MagdaReference for record ${id}`
    );
    if (reference.target instanceof CatalogGroup) {
      runInAction(() => {
        this.catalog.group = <CatalogGroup>reference.target;
      });
    }
  }

  private async loadMagdaConfig(
    configUrl: string,
    config: any,
    baseUri: uri.URI
  ) {
    const aspects = config.aspects;
    const terriaConfig = aspects["terria-config"] as TerriaConfig;

    if (terriaConfig.parameters) {
      this.updateParameters(terriaConfig.parameters);
    }

    const initObj = aspects["terria-init"];
    if (isJsonObject(initObj)) {
      const { catalog, ...initObjWithoutCatalog } = initObj;
      /** Load the init data without the catalog yet, as we'll push the catalog
       * source up as an init source later */
      try {
        await applyInitData(this, {
          initData: initObjWithoutCatalog
        });
      } catch (e) {
        this.raiseErrorToUser(e, {
          title: { key: "models.terria.loadingMagdaInitSourceErrorMessage" },
          message: {
            key: "models.terria.loadingMagdaInitSourceErrorMessage",
            parameters: { url: configUrl }
          }
        });
      }
    }

    if (aspects.group && aspects.group.members) {
      await this.refreshCatalogMembersFromMagda(configUrl, config);
    }

    addInitSourcesFromConfig(this, baseUri, terriaConfig);

    /** Load up rest of terria catalog if one is inlined in terria-init */
    if (config.aspects?.["terria-init"]) {
      const { catalog, ...rest } = initObj;
      this.initSources.push({
        name: `Magda map-config aspect terria-init from ${configUrl}`,
        errorSeverity: TerriaErrorSeverity.Error,
        data: {
          catalog: catalog
        }
      });
    }
  }

  @action
  async loadPickedFeatures(pickedFeatures: JsonObject): Promise<void> {
    let vectorFeatures: Entity[] = [];
    let featureIndex: Record<number, Entity[] | undefined> = {};

    if (Array.isArray(pickedFeatures.entities)) {
      // Build index of terria features by a hash of their properties.
      const relevantItems = this.workbench.items.filter(
        item =>
          hasTraits(item, MappableTraits, "show") &&
          item.show &&
          MappableMixin.isMixedInto(item)
      ) as MappableMixin.Instance[];

      relevantItems.forEach(item => {
        const entities: Entity[] = item.mapItems
          .filter(isDataSource)
          .reduce((arr: Entity[], ds) => arr.concat(ds.entities.values), []);

        entities.forEach(entity => {
          const hash = hashEntity(entity, this.timelineClock);
          const feature = Feature.fromEntityCollectionOrEntity(entity);
          featureIndex[hash] = (featureIndex[hash] || []).concat([feature]);
        });
      });

      // Go through the features we've got from terria match them up to the id/name info we got from the
      // share link, filtering out any without a match.
      vectorFeatures = filterOutUndefined(
        pickedFeatures.entities.map(e => {
          if (isJsonObject(e) && typeof e.hash === "number") {
            const features = featureIndex[e.hash] || [];
            const match = features.find(f => f.name === e.name);
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
        vectorFeatures as Feature[]
      );
    }

    if (this.pickedFeatures?.allFeaturesAvailablePromise) {
      // When feature picking is done, set the selected feature
      await this.pickedFeatures?.allFeaturesAvailablePromise;
    }

    runInAction(() => {
      this.pickedFeatures?.features.forEach((entity: Entity) => {
        const hash = hashEntity(entity, this.timelineClock);
        const feature = entity;
        featureIndex[hash] = (featureIndex[hash] || []).concat([feature]);
      });

      const current = pickedFeatures.current;
      if (
        isJsonObject(current) &&
        typeof current.hash === "number" &&
        typeof current.name === "string"
      ) {
        const selectedFeature = (featureIndex[current.hash] || []).find(
          feature => feature.name === current.name
        );
        if (selectedFeature) {
          this.selectedFeature = selectedFeature as Feature;
        }
      }
    });
  }

  @action
  setUseNativeResolution(useNativeResolution: boolean) {
    this.useNativeResolution = useNativeResolution;
  }

  @action
  setBaseMaximumScreenSpaceError(baseMaximumScreenSpaceError: number): void {
    this.baseMaximumScreenSpaceError = baseMaximumScreenSpaceError;
  }

  @action
  loadHomeCamera(homeCameraInit: JsonObject | HomeCameraInit) {
    this.mainViewer.homeCamera = CameraView.fromJson(homeCameraInit);
  }

  getUserProperty(key: string) {
    return undefined;
  }

  getLocalProperty(key: string): string | boolean | null {
    try {
      if (!defined(window.localStorage)) {
        return null;
      }
    } catch (e) {
      // SecurityError can arise if 3rd party cookies are blocked in Chrome and we're served in an iFrame
      return null;
    }
    var v = window.localStorage.getItem(this.appName + "." + key);
    if (v === "true") {
      return true;
    } else if (v === "false") {
      return false;
    }
    return v;
  }

  setLocalProperty(key: string, value: string | boolean): boolean {
    try {
      if (!defined(window.localStorage)) {
        return false;
      }
    } catch (e) {
      return false;
    }
    window.localStorage.setItem(this.appName + "." + key, value.toString());
    return true;
  }
}

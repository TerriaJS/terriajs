import { convertCatalog } from "catalog-converter";
import i18next from "i18next";
import { action, computed, observable, runInAction, toJS, when } from "mobx";
import { createTransformer } from "mobx-utils";
import Clock from "terriajs-cesium/Source/Core/Clock";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import URI from "urijs";
import AsyncLoader from "../Core/AsyncLoader";
import Class from "../Core/Class";
import ConsoleAnalytics from "../Core/ConsoleAnalytics";
import CorsProxy from "../Core/CorsProxy";
import filterOutUndefined from "../Core/filterOutUndefined";
import getDereferencedIfExists from "../Core/getDereferencedIfExists";
import GoogleAnalytics from "../Core/GoogleAnalytics";
import hashEntity from "../Core/hashEntity";
import instanceOf from "../Core/instanceOf";
import isDefined from "../Core/isDefined";
import JsonValue, {
  isJsonBoolean,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  JsonObject
} from "../Core/Json";
import { isLatLonHeight } from "../Core/LatLonHeight";
import loadJson5 from "../Core/loadJson5";
import ServerConfig from "../Core/ServerConfig";
import TerriaError from "../Core/TerriaError";
import { getUriWithoutPath } from "../Core/uriHelpers";
import PickedFeatures, {
  featureBelongsToCatalogItem,
  isProviderCoordsMap
} from "../Map/PickedFeatures";
import GroupMixin from "../ModelMixins/GroupMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import TimeVarying from "../ModelMixins/TimeVarying";
import { HelpContentItem } from "../ReactViewModels/defaultHelpContent";
import { defaultTerms, Term } from "../ReactViewModels/defaultTerms";
import { Notification } from "../ReactViewModels/ViewState";
import { shareConvertNotification } from "../ReactViews/Notification/shareConvertNotification";
import ShowableTraits from "../Traits/ShowableTraits";
import { BaseMapViewModel } from "../ViewModels/BaseMapViewModel";
import TerriaViewer from "../ViewModels/TerriaViewer";
import CameraView from "./CameraView";
import CatalogGroup from "./CatalogGroupNew";
import CatalogMemberFactory from "./CatalogMemberFactory";
import Catalog from "./CatalogNew";
import CommonStrata from "./CommonStrata";
import Feature from "./Feature";
import GlobeOrMap from "./GlobeOrMap";
import hasTraits from "./hasTraits";
import InitSource, {
  isInitData,
  isInitDataPromise,
  isInitOptions,
  isInitUrl
} from "./InitSource";
import Internationalization, {
  I18nStartOptions,
  LanguageConfiguration
} from "./Internationalization";
import MagdaReference, { MagdaReferenceHeaders } from "./MagdaReference";
import MapInteractionMode from "./MapInteractionMode";
import Mappable, { isDataSource } from "./Mappable";
import { BaseModel } from "./Model";
import NoViewer from "./NoViewer";
import openGroup from "./openGroup";
import ShareDataService from "./ShareDataService";
import SplitItemReference from "./SplitItemReference";
import TimelineStack from "./TimelineStack";
import updateModelFromJson from "./updateModelFromJson";
import upsertModelFromJson from "./upsertModelFromJson";
import ViewerMode from "./ViewerMode";
import Workbench from "./Workbench";
// import overrides from "../Overrides/defaults.jsx";

interface InitModels {
  [key: string]: {
    [key: string]: JsonValue;
    knownContainerUniqueIds: string[];
  };
}
/**
 * This is a short term gap to addresing the issue of old share links being
 * generated with a record similar to `map-config` in its share data, but
 * newer-Terria forcing the root record to an ID of `/` for a consistent
 * approach to the root record
 *
 * The hardcode approach - it will check for any `knownContainerUniqueIds` for
 * each model, and add an entry for `/` if it detects `map-config-*`
 */
export function makeModelsMagdaCompatible(models: InitModels) {
  return Object.entries(models).reduce((acc: any, current) => {
    const key = current[0];
    const value = current[1];
    const hasMapConfig =
      value.knownContainerUniqueIds &&
      value.knownContainerUniqueIds.find(
        value => value.indexOf("map-config") !== -1
      );
    const improvedKnownContainerUniqueIds = hasMapConfig
      ? [...value.knownContainerUniqueIds, "/"]
      : value.knownContainerUniqueIds;

    acc[key] = {
      ...value,
      knownContainerUniqueIds: improvedKnownContainerUniqueIds
    };

    return acc;
  }, {});
}

interface ConfigParameters {
  [key: string]: ConfigParameters[keyof ConfigParameters];
  appName?: string;
  supportEmail?: string;
  defaultMaximumShownFeatureInfos?: number;
  regionMappingDefinitionsUrl: string;
  conversionServiceBaseUrl?: string;
  proj4ServiceBaseUrl?: string;
  corsProxyBaseUrl?: string;
  proxyableDomainsUrl?: string;
  serverConfigUrl?: string;
  shareUrl?: string;
  feedbackUrl?: string;
  initFragmentPaths: string[];
  storyEnabled: boolean;
  interceptBrowserPrint?: boolean;
  tabbedCatalog?: boolean;
  useCesiumIonTerrain?: boolean;
  cesiumIonAccessToken?: string;
  hideTerriaLogo?: boolean;
  useCesiumIonBingImagery?: boolean;
  bingMapsKey?: string;
  brandBarElements?: string[];
  disableMyLocation?: boolean;
  experimentalFeatures?: boolean;
  magdaReferenceHeaders?: MagdaReferenceHeaders;
  locationSearchBoundingBox?: number[];
  googleAnalyticsKey?: string;
  rollbarAccessToken?: string;
  globalDisclaimer?: any;
  showWelcomeMessage?: boolean;
  welcomeMessageVideo?: any;
  showInAppGuides?: boolean;
  helpContent?: HelpContentItem[];
  helpContentTerms?: Term[];
  languageConfiguration?: LanguageConfiguration;
  displayOneBrand?: number;
}

interface StartOptions {
  configUrl: string;
  configUrlHeaders?: {
    [key: string]: string;
  };
  applicationUrl?: Location;
  shareDataService?: ShareDataService;
  /**
   * i18nOptions is explicitly a separate option from `languageConfiguration`,
   * as `languageConfiguration` can be serialised, but `i18nOptions` may have
   * some functions that are passed in from a TerriaMap
   *  */
  i18nOptions?: I18nStartOptions;
}

type Analytics = any;

interface TerriaOptions {
  baseUrl?: string;
  analytics?: Analytics;
}

interface ApplyInitDataOptions {
  initData: JsonObject;
  replaceStratum?: boolean;
  // When feature picking state is missing from the initData, unset the state only if this flag is true
  // This is for eg, set to true when switching through story slides.
  canUnsetFeaturePickingState?: boolean;
}

interface HomeCameraInit {
  [key: string]: HomeCameraInit[keyof HomeCameraInit];
  north: number;
  east: number;
  south: number;
  west: number;
}

export default class Terria {
  private models = observable.map<string, BaseModel>();
  /** Map from share key -> id */
  readonly shareKeysMap = observable.map<string, string>();
  /** Map from id -> share keys */
  readonly modelIdShareKeysMap = observable.map<string, string[]>();

  readonly baseUrl: string = "build/TerriaJS/";
  readonly notification = new CesiumEvent();
  readonly error = new CesiumEvent();
  readonly tileLoadProgressEvent = new CesiumEvent();
  readonly workbench = new Workbench();
  readonly overlays = new Workbench();
  readonly catalog = new Catalog(this);
  readonly timelineClock = new Clock({ shouldAnimate: false });
  // readonly overrides: any = overrides; // TODO: add options.functionOverrides like in master

  @observable
  readonly mainViewer = new TerriaViewer(
    this,
    computed(() =>
      filterOutUndefined(
        this.overlays.items
          .map(item => (Mappable.is(item) ? item : undefined))
          .concat(
            this.workbench.items.map(item =>
              Mappable.is(item) ? item : undefined
            )
          )
      )
    )
  );

  appName: string = "TerriaJS App";
  supportEmail: string = "support@terria.io";

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
  readonly analytics: Analytics;

  /**
   * Gets the stack of layers active on the timeline.
   */
  readonly timelineStack = new TimelineStack(this.timelineClock);

  @observable
  readonly configParameters: ConfigParameters = {
    appName: "TerriaJS App",
    supportEmail: "info@terria.io",
    defaultMaximumShownFeatureInfos: 100,
    regionMappingDefinitionsUrl: "build/TerriaJS/data/regionMapping.json",
    conversionServiceBaseUrl: "convert/",
    proj4ServiceBaseUrl: "proj4/",
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
    cesiumIonAccessToken: undefined,
    hideTerriaLogo: false,
    useCesiumIonBingImagery: undefined,
    bingMapsKey: undefined,
    brandBarElements: undefined,
    disableMyLocation: undefined,
    experimentalFeatures: undefined,
    magdaReferenceHeaders: undefined,
    locationSearchBoundingBox: undefined,
    googleAnalyticsKey: undefined,
    rollbarAccessToken: undefined,
    globalDisclaimer: undefined,
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
    displayOneBrand: 0 // index of which brandBarElements to show for mobile header
  };

  @observable
  baseMaps: BaseMapViewModel[] = [];

  initBaseMapId: string | undefined;

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

  baseMapContrastColor: string = "#ffffff";

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
  @observable terrainSplitDirection: ImagerySplitDirection =
    ImagerySplitDirection.NONE;

  @observable depthTestAgainstTerrainEnabled = false;

  @observable stories: any[] = [];

  // TODO: this is duplicated with properties on ViewState, which is
  //       kind of terrible.
  /**
   * Gets or sets the ID of the catalog member that is currently being
   * previewed.
   */
  @observable previewedItemId: string | undefined;

  /**
   * Base ratio for maximumScreenSpaceError
   * @type {number}
   */
  @observable baseMaximumScreenSpaceError = 2;

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

  constructor(options: TerriaOptions = {}) {
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
      throw new RuntimeError("A model with the specified ID already exists.");
    }

    this.models.set(model.uniqueId, model);
    shareKeys?.forEach(shareKey => this.addShareKey(model.uniqueId!, shareKey));
  }

  /**
   * Remove references to a model from Terria.
   */
  @action
  removeModelReferences(model: BaseModel) {
    const pickedFeatures = this.pickedFeatures;
    if (pickedFeatures) {
      // Remove picked features that belong to the catalog item
      pickedFeatures.features.forEach((feature, i) => {
        if (featureBelongsToCatalogItem(<Feature>feature, model)) {
          pickedFeatures?.features.splice(i, 1);
        }
      });
    }
    this.workbench.remove(model);
    if (model.uniqueId) {
      this.models.delete(model.uniqueId);
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

  @action
  addShareKey(id: string, shareKey: string) {
    if (id === shareKey || this.shareKeysMap.has(shareKey)) return;
    this.shareKeysMap.set(shareKey, id);
    this.modelIdShareKeysMap.get(id)?.push(shareKey) ??
      this.modelIdShareKeysMap.set(id, [shareKey]);
  }

  setupInitializationUrls(baseUri: uri.URI, config: any) {
    const initializationUrls: string[] = config?.initializationUrls || [];
    const initSources = initializationUrls.map(url =>
      generateInitializationUrl(
        baseUri,
        this.configParameters.initFragmentPaths,
        url
      )
    );

    // look for v7 catalogs -> push v7-v8 conversion to initSources
    if (Array.isArray(config?.v7initializationUrls)) {
      this.initSources.push(
        ...config?.v7initializationUrls
          .filter((v7initUrl: any) => isJsonString(v7initUrl))
          .map(async (v7initUrl: string) => {
            const catalog = await loadJson5(v7initUrl);
            const convert = convertCatalog(catalog);
            console.log(
              `WARNING: ${v7initUrl} is a v7 catalog - it has been upgraded to v8\nMessages:\n`
            );
            convert.messages.forEach(message =>
              console.log(`- ${message.path.join(".")}: ${message.message}`)
            );
            return { data: convert.result as JsonObject };
          })
      );
    }
    this.initSources.push(...initSources);
  }

  start(options: StartOptions) {
    this.shareDataService = options.shareDataService;

    const baseUri = new URI(options.configUrl).filename("");

    const launchUrlForAnalytics =
      options.applicationUrl?.href || getUriWithoutPath(baseUri);
    return loadJson5(options.configUrl, options.configUrlHeaders)
      .then((config: any) => {
        return runInAction(() => {
          // If it's a magda config, we only load magda config and parameters should never be a property on the direct
          // config aspect (it would be under the `terria-config` aspect)
          if (config.aspects) {
            return this.loadMagdaConfig(
              options.configUrl,
              config,
              baseUri
            ).then(() => {
              Internationalization.initLanguage(
                this.configParameters.languageConfiguration,
                options.i18nOptions
              );
            });
          }

          // If it's a regular config.json, continue on with parsing remaining init sources
          if (config.parameters) {
            this.updateParameters(config.parameters);
            Internationalization.initLanguage(
              config.parameters.languageConfiguration,
              options.i18nOptions
            );
          }

          this.setupInitializationUrls(baseUri, config);
        });
      })
      .then(() => {
        this.analytics?.start(this.configParameters);
        this.analytics?.logEvent("launch", "url", launchUrlForAnalytics);
        this.serverConfig = new ServerConfig();
        return this.serverConfig.init(this.configParameters.serverConfigUrl);
      })
      .then((serverConfig: any) => {
        return this.initCorsProxy(this.configParameters, serverConfig);
      })
      .then(() => {
        if (this.shareDataService && this.serverConfig.config) {
          this.shareDataService.init(this.serverConfig.config);
        }
        if (options.applicationUrl) {
          return this.updateApplicationUrl(options.applicationUrl.href);
        }
      })
      .then(() => {
        this.loadPersistedMapSettings();
      });
  }

  loadPersistedMapSettings(): void {
    const persistViewerMode = defaultValue(
      this.configParameters.persistViewerMode,
      true
    );
    const mainViewer = this.mainViewer;
    const viewerMode = this.getLocalProperty("viewermode");
    if (persistViewerMode && defined(viewerMode)) {
      if (viewerMode === "3d" || viewerMode === "3dsmooth") {
        mainViewer.viewerMode = ViewerMode.Cesium;
        mainViewer.viewerOptions.useTerrain = viewerMode === "3d";
      } else if (viewerMode === "2d") {
        mainViewer.viewerMode = ViewerMode.Leaflet;
      } else {
        console.error(
          `Trying to select ViewerMode ${viewerMode} that doesn't exist`
        );
      }
    }
  }

  @action
  updateBaseMaps(baseMaps: BaseMapViewModel[]): void {
    this.baseMaps.push(...baseMaps);
    if (!this.mainViewer.baseMap) {
      this.loadPersistedOrInitBaseMap();
    }
  }

  @action
  loadPersistedOrInitBaseMap(): void {
    const persistedBaseMapId = this.getLocalProperty("basemap");
    const baseMapSearch = this.baseMaps.find(
      baseMap => baseMap.mappable.uniqueId === persistedBaseMapId
    );
    if (baseMapSearch) {
      this.mainViewer.baseMap = baseMapSearch.mappable;
    } else {
      console.error(
        `Couldn't find a basemap for unique id ${persistedBaseMapId}. Trying to load init base map.`
      );
      const baseMapSearch = this.baseMaps.find(
        baseMap => baseMap.mappable.uniqueId === this.initBaseMapId
      );
      if (baseMapSearch) {
        this.mainViewer.baseMap = baseMapSearch.mappable;
      }
    }
  }

  get isLoadingInitSources(): boolean {
    return this._initSourceLoader.isLoading;
  }

  /**
   * Asynchronously loads init sources
   */
  loadInitSources(): Promise<void> {
    return this._initSourceLoader.load();
  }

  dispose() {
    this._initSourceLoader.dispose();
  }

  updateFromStartData(startData: any) {
    interpretStartData(this, startData);
    return this.loadInitSources();
  }

  updateApplicationUrl(newUrl: string) {
    const uri = new URI(newUrl);
    const hash = uri.fragment();
    const hashProperties = queryToObject(hash);

    return interpretHash(
      this,
      hashProperties,
      this.userProperties,
      new URI(newUrl)
        .filename("")
        .query("")
        .hash("")
    ).then(() => {
      return this.loadInitSources();
    });
  }

  @action
  updateParameters(parameters: ConfigParameters): void {
    Object.keys(parameters).forEach((key: string) => {
      if (this.configParameters.hasOwnProperty(key)) {
        this.configParameters[key] = parameters[key];
      }
    });

    this.appName = defaultValue(this.configParameters.appName, this.appName);
    this.supportEmail = defaultValue(
      this.configParameters.supportEmail,
      this.supportEmail
    );
  }

  protected forceLoadInitSources(): Promise<void> {
    const initSourcePromises = this.initSources.map(initSource => {
      return loadInitSource(initSource).catch(e => {
        this.error.raiseEvent(e);
        return undefined;
      });
    });

    return Promise.all(initSourcePromises).then(initSources => {
      return runInAction(() => {
        const promises = filterOutUndefined(initSources).map(initSource =>
          this.applyInitData({
            initData: initSource
          })
        );
        return Promise.all(promises);
      }).then(() => undefined);
    });
  }

  private loadModelStratum(
    modelId: string,
    stratumId: string,
    allModelStratumData: JsonObject,
    replaceStratum: boolean
  ): Promise<BaseModel> {
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

    let promise: Promise<void>;

    const containerIds = thisModelStratumData.knownContainerUniqueIds;
    if (Array.isArray(containerIds)) {
      // Groups that contain this item must be loaded before this item.
      const containerPromises = containerIds.map(containerId => {
        if (typeof containerId !== "string") {
          return Promise.resolve(undefined);
        }
        return this.loadModelStratum(
          containerId,
          stratumId,
          allModelStratumData,
          replaceStratum
        ).then(container => {
          const dereferenced = ReferenceMixin.is(container)
            ? container.target
            : container;
          if (GroupMixin.isMixedInto(dereferenced)) {
            return dereferenced.loadMembers();
          }
        });
      });
      promise = Promise.all(containerPromises).then(() => undefined);
    } else {
      promise = Promise.resolve();
    }

    // If this model is a `SplitItemReference` we must load the source item first
    const splitSourceId = cleanStratumData.splitSourceItemId;
    if (
      cleanStratumData.type === SplitItemReference.type &&
      typeof splitSourceId === "string"
    ) {
      promise = promise.then(() =>
        this.loadModelStratum(
          splitSourceId,
          stratumId,
          allModelStratumData,
          replaceStratum
        ).then(() => undefined)
      );
    }

    return promise
      .then(() => {
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
            replaceStratum,
            matchByShareKey: true
          }
        );

        if (Array.isArray(containerIds)) {
          containerIds.forEach(containerId => {
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
        let dereferenced = thisModelStratumData.dereferenced;
        if (
          replaceStratum &&
          dereferenced === undefined &&
          ReferenceMixin.is(loadedModel) &&
          loadedModel.target !== undefined
        ) {
          dereferenced = {};
        }

        if (ReferenceMixin.is(loadedModel)) {
          return loadedModel.loadReference().then(() => {
            if (isDefined(loadedModel.target)) {
              updateModelFromJson(
                loadedModel.target,
                stratumId,
                dereferenced || {},
                replaceStratum
              );
            }
            return loadedModel;
          });
        } else if (dereferenced) {
          throw new TerriaError({
            sender: this,
            title: "Model cannot be dereferenced",
            message:
              "The stratum has a `dereferenced` property, but the model cannot be dereferenced."
          });
        }

        return loadedModel;
      })
      .then(loadedModel => {
        const dereferenced = getDereferencedIfExists(loadedModel);
        if (GroupMixin.isMixedInto(dereferenced)) {
          return openGroup(dereferenced, dereferenced.isOpen).then(
            () => loadedModel
          );
        } else {
          return loadedModel;
        }
      });
  }

  @action
  applyInitData({
    initData,
    replaceStratum = false,
    canUnsetFeaturePickingState = false
  }: ApplyInitDataOptions): Promise<void> {
    initData = toJS(initData);

    const stratumId =
      typeof initData.stratum === "string"
        ? initData.stratum
        : CommonStrata.definition;

    // Extract the list of CORS-ready domains.
    if (Array.isArray(initData.corsDomains)) {
      this.corsProxy.corsDomains.push(...(<string[]>initData.corsDomains));
    }

    if (initData.catalog !== undefined) {
      this.catalog.group.addMembersFromJson(stratumId, initData.catalog);
    }

    if (Array.isArray(initData.stories)) {
      this.stories = initData.stories;
    }

    if (isJsonString(initData.viewerMode)) {
      switch (initData.viewerMode.toLowerCase()) {
        case "3d".toLowerCase():
          this.mainViewer.viewerOptions.useTerrain = true;
          this.mainViewer.viewerMode = ViewerMode.Cesium;
          break;
        case "3dSmooth".toLowerCase():
          this.mainViewer.viewerOptions.useTerrain = false;
          this.mainViewer.viewerMode = ViewerMode.Cesium;
          break;
        case "2d".toLowerCase():
          this.mainViewer.viewerMode = ViewerMode.Leaflet;
          break;
      }
    }

    if (isJsonString(initData.baseMapId)) {
      this.initBaseMapId = initData.baseMapId;
    }

    if (isJsonObject(initData.homeCamera)) {
      this.loadHomeCamera(initData.homeCamera);
    }

    if (isJsonObject(initData.initialCamera)) {
      const initialCamera = CameraView.fromJson(initData.initialCamera);
      this.currentViewer.zoomTo(initialCamera, 2.0);
    }

    if (isJsonBoolean(initData.showSplitter)) {
      this.showSplitter = initData.showSplitter;
    }

    if (isJsonNumber(initData.splitPosition)) {
      this.splitPosition = initData.splitPosition;
    }

    // Copy but don't yet load the workbench.
    const workbench = Array.isArray(initData.workbench)
      ? initData.workbench.slice()
      : [];

    const timeline = Array.isArray(initData.timeline)
      ? initData.timeline.slice()
      : [];

    // Load the models
    let promise: Promise<void>;

    const models = initData.models;
    if (isJsonObject(models)) {
      const modelsTyped = <InitModels>models;
      const magdaCompatibleModels = makeModelsMagdaCompatible(modelsTyped);
      promise = Promise.all(
        Object.keys(magdaCompatibleModels).map(modelId => {
          return this.loadModelStratum(
            modelId,
            stratumId,
            models,
            replaceStratum
          ).catch(e => {
            // TODO: deal with shared models that can't be loaded because, e.g. because they are private
            console.log(e);
            return Promise.resolve();
          });
        })
      ).then(() => undefined);
    } else {
      promise = Promise.resolve();
    }

    promise = promise.then(() => {
      return runInAction(() => {
        if (isJsonString(initData.previewedItemId)) {
          this.previewedItemId = initData.previewedItemId;
        }

        // Set the new contents of the workbench.
        const newItems = filterOutUndefined(
          workbench.map(modelId => {
            if (typeof modelId !== "string") {
              throw new TerriaError({
                sender: this,
                title: "Invalid model ID in workbench",
                message: "A model ID in the workbench list is not a string."
              });
            }
            return this.getModelByIdOrShareKey(BaseModel, modelId);
          })
        );

        this.workbench.items = newItems;

        // For ids that don't correspond to models resolve an id by share keys
        const timelineWithShareKeysResolved = new Set(
          filterOutUndefined(
            timeline.map(modelId => {
              if (typeof modelId !== "string") {
                throw new TerriaError({
                  sender: this,
                  title: "Invalid model ID in timeline",
                  message: "A model ID in the timneline list is not a string."
                });
              }
              if (this.getModelById(BaseModel, modelId) !== undefined) {
                return modelId;
              } else {
                return this.getModelIdByShareKey(modelId);
              }
            })
          )
        );

        // TODO: the timelineStack should be populated from the `timeline` property,
        // not from the workbench.
        this.timelineStack.items = this.workbench.items
          .filter(item => {
            return (
              item.uniqueId && timelineWithShareKeysResolved.has(item.uniqueId)
            );
            // && TODO: what is a good way to test if an item is of type TimeVarying.
          })
          .map(item => <TimeVarying>item);

        // Load the items on the workbench
        return Promise.all(
          newItems.map(async model => {
            if (ReferenceMixin.is(model)) {
              await model.loadReference();
              model = model.target || model;
            }

            if (Mappable.is(model)) {
              await model.loadMapItems();
            }
          })
        ).then(() => undefined);
      });
    });

    if (isJsonObject(initData.pickedFeatures)) {
      promise.then(() =>
        when(() => !(this.currentViewer instanceof NoViewer)).then(() => {
          if (isJsonObject(initData.pickedFeatures)) {
            this.loadPickedFeatures(initData.pickedFeatures);
          }
        })
      );
    } else if (canUnsetFeaturePickingState) {
      this.pickedFeatures = undefined;
      this.selectedFeature = undefined;
    }

    return promise;
  }

  @action
  loadHomeCamera(homeCameraInit: JsonObject | HomeCameraInit) {
    this.mainViewer.homeCamera = CameraView.fromJson(homeCameraInit);
  }

  async loadMagdaConfig(configUrl: string, config: any, baseUri: uri.URI) {
    const magdaRoot = new URI(configUrl)
      .path("")
      .query("")
      .toString();

    const aspects = config.aspects;
    const configParams = aspects["terria-config"]?.parameters;

    if (configParams) {
      this.updateParameters(configParams);
    }

    const initObj = aspects["terria-init"];
    if (isJsonObject(initObj)) {
      const { catalog, ...initObjWithoutCatalog } = initObj;
      /** Load the init data without the catalog yet, as we'll push the catalog
       * source up as an init source later */
      await this.applyInitData({
        initData: initObjWithoutCatalog as any
      });
    }

    if (aspects.group && aspects.group.members) {
      // force config (root group) id to be `/`
      const id = "/";
      this.removeModelReferences(this.catalog.group);

      let existingReference = this.getModelById(MagdaReference, id);
      if (existingReference === undefined) {
        existingReference = new MagdaReference(id, this);
        // Add model with terria aspects shareKeys
        this.addModel(existingReference, aspects?.terria?.shareKeys);
      }

      const reference = existingReference;

      reference.setTrait(CommonStrata.definition, "url", magdaRoot);
      reference.setTrait(CommonStrata.definition, "recordId", id);
      reference.setTrait(CommonStrata.definition, "magdaRecord", config);
      await reference.loadReference();
      if (reference.target instanceof CatalogGroup) {
        runInAction(() => {
          this.catalog.group = <CatalogGroup>reference.target;
        });
      }
    }
    this.setupInitializationUrls(baseUri, config.aspects?.["terria-config"]);
    /** Load up rest of terria catalog if one is inlined in terria-init */
    if (config.aspects?.["terria-init"]) {
      const { catalog, ...rest } = initObj;
      this.initSources.push({
        data: {
          catalog: catalog
        }
      });
    }
  }

  @action
  loadPickedFeatures(pickedFeatures: JsonObject): Promise<void> | undefined {
    let vectorFeatures: Entity[] = [];
    let featureIndex: Record<number, Entity[] | undefined> = {};

    if (Array.isArray(pickedFeatures.entities)) {
      // Build index of terria features by a hash of their properties.
      const relevantItems: Mappable[] = this.workbench.items.filter(item => {
        return (
          hasTraits(item, ShowableTraits, "show") &&
          item.show &&
          Mappable.is(item)
        );
      }) as Mappable[];

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

    // When feature picking is done, set the selected feature
    return this.pickedFeatures?.allFeaturesAvailablePromise?.then(
      action(() => {
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
      })
    );
  }

  initCorsProxy(config: ConfigParameters, serverConfig: any): Promise<void> {
    if (config.proxyableDomainsUrl) {
      console.warn(i18next.t("models.terria.proxyableDomainsDeprecation"));
    }
    this.corsProxy.init(
      serverConfig,
      this.configParameters.corsProxyBaseUrl,
      []
    );
    return Promise.resolve();
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

function generateInitializationUrl(
  baseUri: uri.URI,
  initFragmentPaths: string[],
  url: string
): InitSource {
  if (url.toLowerCase().substring(url.length - 5) !== ".json") {
    return {
      options: initFragmentPaths.map(fragmentPath => {
        return {
          initUrl: URI.joinPaths(fragmentPath, url + ".json")
            .absoluteTo(baseUri)
            .toString()
        };
      })
    };
  }
  return {
    initUrl: new URI(url).absoluteTo(baseUri).toString()
  };
}

const loadInitSource = createTransformer(
  async (initSource: InitSource): Promise<JsonObject | undefined> => {
    let jsonValue: JsonValue | undefined;
    if (isInitUrl(initSource)) {
      jsonValue = await loadJson5(initSource.initUrl);
    } else if (isInitOptions(initSource)) {
      await initSource.options.reduce(async (previousOptionPromise, option) => {
        try {
          const json = await previousOptionPromise;
          if (json === undefined) {
            return loadInitSource(option);
          }
          return json;
        } catch (_) {
          return loadInitSource(option);
        }
      }, Promise.resolve<JsonObject | undefined>(undefined));
    } else if (isInitData(initSource)) {
      jsonValue = initSource.data;
    } else if (isInitDataPromise(initSource)) {
      jsonValue = (await initSource).data;
    }

    if (jsonValue && isJsonObject(jsonValue)) {
      return jsonValue;
    }
    return undefined;
  }
);

function interpretHash(
  terria: Terria,
  hashProperties: any,
  userProperties: Map<string, any>,
  baseUri: uri.URI
) {
  // Resolve #share=xyz with the share data service.
  const promise =
    hashProperties.share !== undefined && terria.shareDataService !== undefined
      ? terria.shareDataService.resolveData(hashProperties.share)
      : Promise.resolve({});

  return promise.then((shareProps: any) => {
    runInAction(() => {
      Object.keys(hashProperties).forEach(function(property) {
        const propertyValue = hashProperties[property];
        if (property === "clean") {
          terria.initSources.splice(0, terria.initSources.length);
        } else if (property === "hideWelcomeMessage") {
          terria.configParameters.showWelcomeMessage = false;
        } else if (property === "start") {
          // a share link that hasn't been shortened: JSON embedded in URL (only works for small quantities of JSON)
          const startData = JSON.parse(propertyValue);
          interpretStartData(terria, startData);
        } else if (defined(propertyValue) && propertyValue.length > 0) {
          userProperties.set(property, propertyValue);
        } else {
          const initSourceFile = generateInitializationUrl(
            baseUri,
            terria.configParameters.initFragmentPaths,
            property
          );
          terria.initSources.push(initSourceFile);
        }
      });

      if (shareProps) {
        if (shareProps.converted) {
          terria.notification.raiseEvent({
            title: i18next.t("share.convertNotificationTitle"),
            message: shareConvertNotification(shareProps)
          } as Notification);
        }
        interpretStartData(terria, shareProps);
      }
    });
  });
}

function interpretStartData(terria: Terria, startData: any) {
  // TODO: version check, filtering, etc.

  if (startData.initSources) {
    runInAction(() => {
      terria.initSources.push(
        ...startData.initSources.map((initSource: any) => {
          return {
            data: initSource
          };
        })
      );
    });
  }

  // if (defined(startData.version) && startData.version !== latestStartVersion) {
  //   adjustForBackwardCompatibility(startData);
  // }

  // if (defined(terria.filterStartDataCallback)) {
  //   startData = terria.filterStartDataCallback(startData) || startData;
  // }

  // // Include any initSources specified in the URL.
  // if (defined(startData.initSources)) {
  //   for (var i = 0; i < startData.initSources.length; ++i) {
  //     var initSource = startData.initSources[i];
  //     // avoid loading terria.json twice
  //     if (
  //       temporaryInitSources.indexOf(initSource) < 0 &&
  //       !initFragmentExists(temporaryInitSources, initSource)
  //     ) {
  //       temporaryInitSources.push(initSource);
  //       // Only add external files to the application's list of init sources.
  //       if (
  //         typeof initSource === "string" &&
  //         persistentInitSources.indexOf(initSource) < 0
  //       ) {
  //         persistentInitSources.push(initSource);
  //       }
  //     }
  //   }
  // }
}

import { action, computed, observable, runInAction, toJS } from "mobx";
import { createTransformer } from "mobx-utils";
import Clock from "terriajs-cesium/Source/Core/Clock";
import defined from "terriajs-cesium/Source/Core/defined";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import URI from "urijs";
import AsyncLoader from "../Core/AsyncLoader";
import Class from "../Core/Class";
import ConsoleAnalytics from "../Core/ConsoleAnalytics";
import filterOutUndefined from "../Core/filterOutUndefined";
import GoogleAnalytics from "../Core/GoogleAnalytics";
import instanceOf from "../Core/instanceOf";
import isDefined from "../Core/isDefined";
import JsonValue, {
  isJsonObject,
  isJsonString,
  JsonObject
} from "../Core/Json";
import loadJson5 from "../Core/loadJson5";
import ServerConfig from "../Core/ServerConfig";
import TerriaError from "../Core/TerriaError";
import PickedFeatures from "../Map/PickedFeatures";
import GroupMixin from "../ModelMixins/GroupMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import { BaseMapViewModel } from "../ViewModels/BaseMapViewModel";
import TerriaViewer from "../ViewModels/TerriaViewer";
import CameraView from "./CameraView";
import CatalogMemberFactory from "./CatalogMemberFactory";
import Catalog from "./CatalogNew";
import CommonStrata from "./CommonStrata";
import Feature from "./Feature";
import GlobeOrMap from "./GlobeOrMap";
import InitSource, { isInitOptions, isInitUrl } from "./InitSource";
import Mappable from "./Mappable";
import { BaseModel } from "./Model";
import NoViewer from "./NoViewer";
import ShareDataService from "./ShareDataService";
import TimelineStack from "./TimelineStack";
import updateModelFromJson from "./updateModelFromJson";
import upsertModelFromJson from "./upsertModelFromJson";
import Workbench from "./Workbench";
import CorsProxy from "../Core/CorsProxy";
import MapInteractionMode from "./MapInteractionMode";
import TimeVarying from "../ModelMixins/TimeVarying";
import MagdaReference from "./MagdaReference";
import CatalogGroup from "./CatalogGroupNew";

interface ConfigParameters {
  [key: string]: ConfigParameters[keyof ConfigParameters];
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
}

interface StartOptions {
  configUrl: string;
  applicationUrl?: string;
  shareDataService?: ShareDataService;
}

type Analytics = any;

interface TerriaOptions {
  baseUrl?: string;
  analytics?: Analytics;
}

interface ApplyInitDataOptions {
  initData: JsonObject;
  replaceStratum?: boolean;
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

  readonly baseUrl: string = "build/TerriaJS/";
  readonly error = new CesiumEvent();
  readonly workbench = new Workbench();
  readonly overlays = new Workbench();
  readonly catalog = new Catalog(this);
  readonly timelineClock = new Clock({ shouldAnimate: false });
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

  appName?: string;
  supportEmail?: string;

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
    defaultMaximumShownFeatureInfos: 100,
    regionMappingDefinitionsUrl: "build/TerriaJS/data/regionMapping.json",
    conversionServiceBaseUrl: "convert/",
    proj4ServiceBaseUrl: "proj4/",
    corsProxyBaseUrl: "proxy/",
    proxyableDomainsUrl: "proxyabledomains/",
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
    brandBarElements: undefined
  };

  @observable
  baseMaps: BaseMapViewModel[] = [];

  @observable
  pickedFeatures: PickedFeatures | undefined;

  @observable
  selectedFeature: Feature | undefined;

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

  getModelById<T extends BaseModel>(type: Class<T>, id: string): T | undefined {
    const model = this.models.get(id);
    if (instanceOf(type, model)) {
      return model;
    }

    // Model does not have the requested type.
    return undefined;
  }

  addModel(model: BaseModel) {
    if (model.uniqueId === undefined) {
      throw new DeveloperError("A model without a `uniqueId` cannot be added.");
    }

    if (this.models.has(model.uniqueId)) {
      throw new RuntimeError("A model with the specified ID already exists.");
    }

    this.models.set(model.uniqueId, model);
  }

  start(options: StartOptions) {
    this.shareDataService = options.shareDataService;

    const baseUri = new URI(options.configUrl).filename("");

    return loadJson5(options.configUrl)
      .then((config: any) => {
        runInAction(() => {
          if (config.parameters) {
            this.updateParameters(config.parameters);
          }

          if (config.aspects) {
            return this.loadMagdaConfig(options.configUrl, config);
          }

          const initializationUrls: string[] = config.initializationUrls;
          const initSources = initializationUrls.map(url =>
            generateInitializationUrl(
              baseUri,
              this.configParameters.initFragmentPaths,
              url
            )
          );

          this.initSources.push(...initSources);
        });
      })
      .then(() => {
        this.serverConfig = new ServerConfig();
        return this.serverConfig
          .init(this.configParameters.serverConfigUrl)
          .then((serverConfig: any) => {
            this.initCorsProxy(this.configParameters, serverConfig);
            return serverConfig;
          });
      })
      .then(serverConfig => {
        if (this.shareDataService && serverConfig) {
          this.shareDataService.init(serverConfig);
        }
        if (options.applicationUrl) {
          return this.updateApplicationUrl(options.applicationUrl);
        }
      });
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
  }

  protected forceLoadInitSources(): Promise<void> {
    const initSourcePromises = this.initSources.map(initSource => {
      return loadInitSource(initSource).catch(e => {
        this.error.raiseEvent(e);
        return undefined;
      });
    });

    return Promise.all(initSourcePromises).then(initSources => {
      runInAction(() => {
        initSources.forEach(initSource => {
          if (initSource === undefined) {
            return;
          }
          this.applyInitData({
            initData: initSource
          });
        });
      });
    });
  }

  private loadModelStratum(
    modelId: string,
    stratumId: string,
    allModelStratumData: JsonObject,
    replaceStratum: boolean
  ): Promise<BaseModel> {
    const thisModelStratumData = allModelStratumData[modelId];
    if (!isJsonObject(thisModelStratumData)) {
      throw new TerriaError({
        sender: this,
        title: "Invalid model traits",
        message: "The traits of a model must be a JSON object."
      });
    }

    let promise: Promise<void>;

    const containerIds = thisModelStratumData.knownContainerUniqueIds;
    if (Array.isArray(containerIds)) {
      delete thisModelStratumData.knownContainerUniqueIds;
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
          if (GroupMixin.isMixedInto(container)) {
            return container.loadMembers();
          }
        });
      });
      promise = Promise.all(containerPromises).then(() => undefined);
    } else {
      promise = Promise.resolve();
    }

    return promise.then(() => {
      let dereferenced = thisModelStratumData.dereferenced;
      delete thisModelStratumData.dereferenced;

      const loadedModel = upsertModelFromJson(
        CatalogMemberFactory,
        this,
        "/",
        undefined,
        stratumId,
        {
          ...thisModelStratumData,
          id: modelId
        },
        replaceStratum
      );

      // If we're replacing the stratum and the existing model is already
      // dereferenced, we need to replace the dereferenced stratum, too,
      // even if there's no trace of it it in the load data.
      if (
        replaceStratum &&
        dereferenced === undefined &&
        ReferenceMixin.is(loadedModel) &&
        loadedModel.target !== undefined
      ) {
        dereferenced = {};
      }

      if (dereferenced) {
        if (ReferenceMixin.is(loadedModel)) {
          return loadedModel
            .loadReference()
            .then(() => {
              return upsertModelFromJson(
                CatalogMemberFactory,
                this,
                "/",
                loadedModel.target,
                stratumId,
                dereferenced,
                replaceStratum
              );
            })
            .then(() => loadedModel);
        } else {
          throw new TerriaError({
            sender: this,
            title: "Model cannot be dereferenced",
            message:
              "The stratum has a `dereferenced` property, but the model cannot be dereferenced."
          });
        }
      }

      return loadedModel;
    });
  }

  @action
  applyInitData({
    initData,
    replaceStratum = false
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
      updateModelFromJson(this.catalog.group, stratumId, {
        members: initData.catalog
      });
    }

    if (Array.isArray(initData.stories)) {
      this.stories = initData.stories;
    }

    if (isJsonString(initData.viewerMode)) {
      switch (initData.viewerMode.toLowerCase()) {
        case "3d".toLowerCase():
          this.mainViewer.viewerOptions.useTerrain = true;
          this.mainViewer.viewerMode = "cesium";
          break;
        case "3dSmooth".toLowerCase():
          this.mainViewer.viewerOptions.useTerrain = false;
          this.mainViewer.viewerMode = "cesium";
          break;
        case "2d".toLowerCase():
          this.mainViewer.viewerMode = "leaflet";
          break;
      }
    }

    if (isJsonObject(initData.homeCamera)) {
      this.loadHomeCamera(initData.homeCamera);
    }

    if (isJsonObject(initData.initialCamera)) {
      const initialCamera = CameraView.fromJson(initData.initialCamera);
      this.currentViewer.zoomTo(initialCamera, 2.0);
    }

    if (isJsonString(initData.previewedItemId)) {
      this.previewedItemId = initData.previewedItemId;
    }

    // Copy but don't yet load the workbench.
    const workbench = Array.isArray(initData.workbench)
      ? initData.workbench.slice().reverse()
      : [];

    const timeline = Array.isArray(initData.timeline)
      ? initData.timeline.slice()
      : [];

    // Load the models
    let promise: Promise<void>;

    const models = initData.models;
    if (isJsonObject(models)) {
      promise = Promise.all(
        Object.keys(models).map(modelId => {
          return this.loadModelStratum(
            modelId,
            stratumId,
            models,
            replaceStratum
          );
        })
      ).then(() => undefined);
    } else {
      promise = Promise.resolve();
    }

    return promise.then(() => {
      return runInAction(() => {
        const promises: Promise<void>[] = [];

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

            return this.getModelById(BaseModel, modelId);
          })
        );

        this.workbench.items = newItems;

        this.timelineStack.items = this.workbench.items
          .filter(item => {
            return item.uniqueId && timeline.indexOf(item.uniqueId) >= 0;
            // && TODO: what is a good way to test if an item is of type TimeVarying.
          })
          .map(item => <TimeVarying>item);

        // Load the items on the workbench
        for (let model of newItems) {
          if (ReferenceMixin.is(model)) {
            promises.push(model.loadReference());
            model = model.target || model;
          }

          if (Mappable.is(model)) {
            promises.push(model.loadMapItems());
          }
        }

        return Promise.all(promises).then(() => undefined);
      });
    });
  }

  @action
  loadHomeCamera(homeCameraInit: JsonObject | HomeCameraInit) {
    this.mainViewer.homeCamera = CameraView.fromJson(homeCameraInit);
  }

  async loadMagdaConfig(configUrl: string, config: any) {
    const magdaRoot = new URI(configUrl)
      .path("")
      .query("")
      .toString();

    const aspects = config.aspects;
    const configParams =
      aspects["terria-config"] && aspects["terria-config"].parameters;

    if (configParams) {
      this.updateParameters(configParams);
    }

    const initObj = aspects["terria-init"];
    if (isJsonObject(initObj)) {
      await this.applyInitData({
        initData: initObj as any
      });
    }

    if (aspects.group && aspects.group.members) {
      const id = config.id;

      let existingReference = this.getModelById(MagdaReference, id);
      if (existingReference === undefined) {
        existingReference = new MagdaReference(id, this);
        this.addModel(existingReference);
      }

      const reference = existingReference;

      reference.setTrait(CommonStrata.definition, "url", magdaRoot);
      reference.setTrait(CommonStrata.definition, "recordId", config.id);
      reference.setTrait(CommonStrata.definition, "magdaRecord", config);
      await reference.loadReference().then(() => {
        if (reference.target instanceof CatalogGroup) {
          this.catalog.group = reference.target;
        }
      });
    }
  }

  initCorsProxy(config: any, serverConfig: any): Promise<void> {
    // All the "proxyableDomains" bits here are due to a pre-serverConfig mechanism for whitelisting domains.
    // We should deprecate it.s

    // If a URL was specified in the config parameters to get the proxyable domains from, get them from that
    var pdu = this.configParameters.proxyableDomainsUrl;
    const proxyableDomainsPromise: Promise<JsonValue | void> = pdu
      ? loadJson5(pdu)
      : Promise.resolve();
    return proxyableDomainsPromise.then((proxyableDomains: any | void) => {
      if (proxyableDomains) {
        // format of proxyableDomains JSON file slightly differs from serverConfig format.
        proxyableDomains.allowProxyFor =
          proxyableDomains.allowProxyFor || proxyableDomains.proxyableDomains;
      }

      // If there isn't anything there, check the server config
      if (typeof serverConfig === "object") {
        serverConfig = serverConfig.config; // if server config is unavailable, this remains undefined.
      }

      this.corsProxy.init(
        proxyableDomains || serverConfig,
        this.configParameters.corsProxyBaseUrl,
        config.proxyDomains // fall back to local config
      );
    });
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
  (initSource: InitSource): Promise<JsonObject | undefined> => {
    let promise: Promise<JsonValue | undefined>;

    if (isInitUrl(initSource)) {
      promise = loadJson5(initSource.initUrl);
    } else if (isInitOptions(initSource)) {
      promise = initSource.options.reduce((previousOptionPromise, option) => {
        return previousOptionPromise
          .then(json => {
            if (json === undefined) {
              return loadInitSource(option);
            }
            return json;
          })
          .catch(_ => {
            return loadInitSource(option);
          });
      }, Promise.resolve<JsonObject | undefined>(undefined));
    } else {
      promise = Promise.resolve(initSource.data);
    }

    return promise.then(jsonValue => {
      if (isJsonObject(jsonValue)) {
        return jsonValue;
      }
      return undefined;
    });
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
        interpretStartData(terria, shareProps);
      }
    });
  });
}

function interpretStartData(terria: Terria, startData: any) {
  // TODO: version check, filtering, etc.

  if (startData.initSources) {
    terria.initSources.push(
      ...startData.initSources.map((initSource: any) => {
        return {
          data: initSource
        };
      })
    );
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

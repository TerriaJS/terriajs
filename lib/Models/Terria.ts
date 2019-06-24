import { computed, observable, runInAction, toJS } from "mobx";
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
import JsonValue, { isJsonObject, JsonObject } from "../Core/Json";
import loadJson5 from "../Core/loadJson5";
import TerriaError from "../Core/TerriaError";
import PickedFeatures from "../Map/PickedFeatures";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import { BaseMapViewModel } from "../ViewModels/BaseMapViewModel";
import TerriaViewer from "../ViewModels/TerriaViewer";
import CatalogMemberFactory from "./CatalogMemberFactory";
import Catalog from "./CatalogNew";
import Cesium from "./Cesium";
import CommonStrata from "./CommonStrata";
import Feature from "./Feature";
import GlobeOrMap from "./GlobeOrMap";
import InitSource, { isInitOptions, isInitUrl } from "./InitSource";
import Leaflet from "./Leaflet";
import magdaRecordToCatalogMemberDefinition from "./magdaRecordToCatalogMember";
import Mappable from "./Mappable";
import { BaseModel } from "./Model";
import NoViewer from "./NoViewer";
import TimelineStack from "./TimelineStack";
import updateModelFromJson from "./updateModelFromJson";
import upsertModelFromJson from "./upsertModelFromJson";
import Workbench from "./Workbench";
import ShareDataService from "./ShareDataService";
import ServerConfig from "../Core/ServerConfig";
import GroupMixin from "../ModelMixins/GroupMixin";

require("regenerator-runtime/runtime");

interface ConfigParameters {
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

export default class Terria {
  private models = observable.map<string, BaseModel>();

  readonly baseUrl: string = "build/TerriaJS/";
  readonly error = new CesiumEvent();
  readonly beforeViewerChanged = new CesiumEvent();
  readonly afterViewerChanged = new CesiumEvent();
  readonly workbench = new Workbench();
  readonly catalog = new Catalog(this);
  readonly timelineClock = new Clock({ shouldAnimate: false });
  readonly mainViewer: TerriaViewer = new TerriaViewer(
    this,
    computed(() =>
      filterOutUndefined(
        this.workbench.items.map(item => (Mappable.is(item) ? item : undefined))
      )
    )
  );

  appName?: string;
  supportEmail?: string;

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
    hideTerriaLogo: false
  };

  @observable
  baseMaps: BaseMapViewModel[] = [];

  @observable
  pickedFeatures: PickedFeatures | undefined;

  @observable
  selectedFeature: Feature | undefined;

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
    return (
      (this.mainViewer && this.mainViewer.currentViewer) || new NoViewer(this)
    );
  }

  @computed
  get cesium(): Cesium | undefined {
    if (isDefined(this.mainViewer) && this.mainViewer instanceof Cesium) {
      return this.mainViewer;
    }
  }

  @computed
  get leaflet(): Leaflet | undefined {
    if (isDefined(this.mainViewer) && this.mainViewer instanceof Leaflet) {
      return this.mainViewer;
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
        if (config.aspects) {
          return this.loadMagdaConfig(config);
        }

        const initializationUrls: string[] = config.initializationUrls;
        const initSources = initializationUrls.map(url =>
          generateInitializationUrl(
            baseUri,
            this.configParameters.initFragmentPaths,
            url
          )
        );

        runInAction(() => {
          this.initSources.push(...initSources);
        });
      })
      .then(() => {
        this.serverConfig = new ServerConfig();
        return this.serverConfig.init(this.configParameters.serverConfigUrl);
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
          this.applyInitData(toJS(initSource));
        });
      });
    });
  }

  private loadModelStratum(
    modelId: string,
    stratumId: string,
    allModelStratumData: JsonObject
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
          allModelStratumData
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
      const dereferenced = thisModelStratumData.dereferenced;
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
        }
      );

      if (dereferenced) {
        if (ReferenceMixin.is(loadedModel)) {
          return loadedModel
            .loadReference()
            .then(() => {
              return upsertModelFromJson(
                CatalogMemberFactory,
                this,
                "/",
                loadedModel.dereferenced,
                stratumId,
                dereferenced
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

  private applyInitData(initData: JsonObject): Promise<void> {
    const stratumId =
      typeof initData.stratum === "string"
        ? initData.stratum
        : CommonStrata.definition;

    if (initData.catalog !== undefined) {
      updateModelFromJson(this.catalog.group, stratumId, {
        members: initData.catalog
      });
    }

    // Copy but don't yet load the workbench.
    const workbench = Array.isArray(initData.workbench)
      ? initData.workbench.slice().reverse()
      : [];

    // Load the models
    let promise: Promise<void>;

    const models = initData.models;
    if (isJsonObject(models)) {
      promise = Promise.all(
        Object.keys(models).map(modelId => {
          return this.loadModelStratum(modelId, stratumId, models);
        })
      ).then(() => undefined);
    } else {
      promise = Promise.resolve();
    }

    return promise.then(async () => {
      // Now load the workbench
      for (let modelId of workbench) {
        if (typeof modelId !== "string") {
          throw new TerriaError({
            sender: this,
            title: "Invalid model ID in workbench",
            message: "A model ID in the workbench list is not a string."
          });
        }

        let model = this.getModelById(BaseModel, modelId);
        if (model === undefined) {
          throw new TerriaError({
            sender: this,
            title: "Unknown model ID in workbench",
            message: `A model ID in the workbench, ${modelId}, could not be found.`
          });
        }
        this.workbench.add(model);

        if (ReferenceMixin.is(model)) {
          await model.loadReference();
          model = model.dereferenced || model;
        }

        if (Mappable.is(model)) {
          await model.loadMapItems();
        }
      }
    });
  }

  loadMagdaConfig(config: any) {
    const aspects = config.aspects;
    if (aspects.group && aspects.group.members) {
      // Transform the Magda catalog structure to the Terria one.
      const members = aspects.group.members.map((member: any) => {
        return magdaRecordToCatalogMemberDefinition({
          magdaBaseUrl: "http://saas.terria.io",
          record: member
        });
      });

      updateModelFromJson(this.catalog.group, CommonStrata.definition, {
        members: members
      });
    }
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

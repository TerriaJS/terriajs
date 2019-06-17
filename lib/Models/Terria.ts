import { computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import Clock from "terriajs-cesium/Source/Core/Clock";
import defined from "terriajs-cesium/Source/Core/defined";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
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
import PickedFeatures from "../Map/PickedFeatures";
import ModelReference from "../Traits/ModelReference";
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

require("regenerator-runtime/runtime");

interface ConfigParameters {
  defaultMaximumShownFeatureInfos?: number;
  regionMappingDefinitionsUrl: string;
  conversionServiceBaseUrl?: string;
  proj4ServiceBaseUrl?: string;
  corsProxyBaseUrl?: string;
  proxyableDomainsUrl?: string;
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

  getModelById<T extends BaseModel>(
    type: Class<T>,
    id: ModelReference
  ): T | undefined {
    if (ModelReference.isRemoved(id)) {
      return undefined;
    } else {
      const model = this.models.get(id);
      if (instanceOf(type, model)) {
        return model;
      }

      // Model does not have the requested type.
      return undefined;
    }
  }

  addModel(model: BaseModel) {
    if (ModelReference.isRemoved(model.id)) {
      return;
    }

    if (this.models.has(model.id)) {
      throw new RuntimeError("A model with the specified ID already exists.");
    }

    this.models.set(model.id, model);
  }

  start(options: StartOptions) {
    const baseUri = new URI(options.configUrl).filename("");

    return loadJson5(options.configUrl).then((config: any) => {
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
          this.applyInitData(initSource);
        });
      });
    });
  }

  private applyInitData(initData: JsonObject) {
    if (initData.catalog !== undefined) {
      updateModelFromJson(this.catalog.group, CommonStrata.definition, {
        members: initData.catalog
      });
    }

    const strata = initData.strata;
    if (isJsonObject(strata)) {
      Object.keys(strata).forEach(stratum => {
        const models = strata[stratum];
        if (!isJsonObject(models)) {
          return;
        }

        Object.keys(models).forEach(modelId => {
          const model = models[modelId];
          if (!isJsonObject(model)) {
            return;
          }

          upsertModelFromJson(
            CatalogMemberFactory,
            this,
            "/",
            undefined,
            stratum,
            {
              ...model,
              id: modelId
            }
          );
        });
      });
    }
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

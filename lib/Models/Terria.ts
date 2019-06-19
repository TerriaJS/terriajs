import { computed, observable } from "mobx";
import Clock from "terriajs-cesium/Source/Core/Clock";
import defined from "terriajs-cesium/Source/Core/defined";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import when from "terriajs-cesium/Source/ThirdParty/when";
import URI from "urijs";
import Class from "../Core/Class";
import ConsoleAnalytics from "../Core/ConsoleAnalytics";
import filterOutUndefined from "../Core/filterOutUndefined";
import GoogleAnalytics from "../Core/GoogleAnalytics";
import instanceOf from "../Core/instanceOf";
import isDefined from "../Core/isDefined";
import loadJson5 from "../Core/loadJson5";
import PickedFeatures from "../Map/PickedFeatures";
import ModelReference from "../Traits/ModelReference";
import { BaseMapViewModel } from "../ViewModels/BaseMapViewModel";
import TerriaViewer from "../ViewModels/TerriaViewer";
import Catalog from "./CatalogNew";
import Cesium from "./Cesium";
import CommonStrata from "./CommonStrata";
import Feature from "./Feature";
import GlobeOrMap from "./GlobeOrMap";
import Leaflet from "./Leaflet";
import magdaRecordToCatalogMemberDefinition from "./magdaRecordToCatalogMember";
import Mappable from "./Mappable";
import { BaseModel } from "./Model";
import NoViewer from "./NoViewer";
import TimelineStack from "./TimelineStack";
import updateModelFromJson from "./updateModelFromJson";
import Workbench from "./Workbench";
import CorsProxy from "../Core/CorsProxy";
import { isNullOrUndefined } from "util";
import ServerConfig from "../Core/ServerConfig";

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
  initFragmentPaths?: string[];
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

  readonly serverConfig: any = new ServerConfig();

  @observable
  baseMaps: BaseMapViewModel[] = [];

  @observable
  pickedFeatures: PickedFeatures | undefined;

  @observable
  selectedFeature: Feature | undefined;

  baseMapContrastColor: string = "#ffffff";

  @observable
  readonly userProperties = new Map<string, any>();

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
    var baseUri = new URI(options.configUrl).filename("");

    return loadJson5(options.configUrl).then((config: any) => {
      if (config.aspects) {
        return this.loadMagdaConfig(config);
      }

      this.serverConfig.init(config.serverConfigUrl).then((serverConfig: any) =>
        this.initCorsProxy(config, serverConfig)
      );

      const initializationUrls = config.initializationUrls;
      return when.all(
        initializationUrls.map((initializationUrl: string) => {
          return loadJson5(
            buildInitUrlFromFragment(
              "init/",
              generateInitializationUrl(baseUri, initializationUrl)
            ).toString()
          ).then((initData: any) => {
            if (initData.catalog !== undefined) {
              updateModelFromJson(this.catalog.group, CommonStrata.definition, {
                members: initData.catalog
              });
            }
            if (initData.stories !== undefined) {
              this.stories = initData.stories;
            }
          });
        })
      );
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

  initCorsProxy(config: any, serverConfig: any): Promise<void> {
    // All the "proxyableDomains" bits here are due to a pre-serverConfig mechanism for whitelisting domains.
    // We should deprecate it.
    
    // If a URL was specified in the config paramaters to get the proxyable domains from, get them from that
    var pdu = this.configParameters.proxyableDomainsUrl;
    const proxyableDomainsPromise = pdu ? loadJson5(pdu) : Promise.resolve();
    return proxyableDomainsPromise.then(
      (proxyableDomains: { allowProxyFor: any; proxyableDomains: any }) => {
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
      }
    );
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

function generateInitializationUrl(baseUri: uri.URI, url: string) {
  if (url.toLowerCase().substring(url.length - 5) !== ".json") {
    return {
      baseUri: baseUri,
      initFragment: url
    };
  }
  return new URI(url).absoluteTo(baseUri).toString();
}

function buildInitUrlFromFragment(path: string, fragmentObject: any) {
  const uri = new URI(path + fragmentObject.initFragment + ".json");
  return fragmentObject.baseUri ? uri.absoluteTo(fragmentObject.baseUri) : uri;
}

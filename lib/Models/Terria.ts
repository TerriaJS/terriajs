import { computed, observable } from "mobx";
import Clock from "terriajs-cesium/Source/Core/Clock";
import defined from "terriajs-cesium/Source/Core/defined";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import when from "terriajs-cesium/Source/ThirdParty/when";
import URI from "urijs";
import Class from "../Core/Class";
import ConsoleAnalytics from "../Core/ConsoleAnalytics";
import GoogleAnalytics from "../Core/GoogleAnalytics";
import instanceOf from "../Core/instanceOf";
import loadJson5 from "../Core/loadJson5";
import PickedFeatures from "../Map/PickedFeatures";
import ModelReference from "../Traits/ModelReference";
import { BaseMapViewModel } from "../ViewModels/BaseMapViewModel";
import TerriaViewer from "../ViewModels/TerriaViewer";
import Catalog from "./CatalogNew";
import GlobeOrMap from "./GlobeOrMap";
import { BaseModel } from "./Model";
import NoViewer from "./NoViewer";
import TimelineStack from "./TimelineStack";
import updateModelFromJson from "./updateModelFromJson";
import Workbench from "./Workbench";

require("regenerator-runtime/runtime");

interface ConfigParameters {
  defaultMaximumShownFeatureInfos?: number;
  regionMappingDefinitionsUrl?: string;
  conversionServiceBaseUrl?: string;
  proj4ServiceBaseUrl?: string;
  corsProxyBaseUrl?: string;
  proxyableDomainsUrl?: string;
  shareUrl?: string;
  feedbackUrl?: string;
  initFragmentPaths?: string[];
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
  // Set in TerriaViewerWrapper.jsx. This is temporary while I work out what should own TerriaViewer
  // terriaViewer, currentViewer, baseMap and other viewer-related properties will go with TerriaViewer
  @observable mainViewer: TerriaViewer | undefined;

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
  readonly userProperties = new Map<string, any>();

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
              updateModelFromJson(this.catalog.group, "definition", {
                members: initData.catalog
              });
            }
          });
        })
      );
    });
  }

  getUserProperty(key: string) {
    return undefined;
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

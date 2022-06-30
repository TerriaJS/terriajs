import JsonValue from "../Core/Json";
import { HelpContentItem } from "../ReactViewModels/defaultHelpContent";
import { Term } from "../ReactViewModels/defaultTerms";
import { ICredit } from "../ReactViews/Credits";
import { MagdaReferenceHeaders } from "./Catalog/CatalogReferences/MagdaReference";
import { ErrorServiceOptions } from "./ErrorServiceProviders/ErrorService";
import {
  I18nStartOptions,
  LanguageConfiguration
} from "./Internationalization";
import ShareDataService from "./ShareDataService";

export interface TerriaConfig {
  initializationUrls?: string[];
  v7initializationUrls?: string[];
  parameters?: ConfigParameters;
}

export interface ConfigParameters {
  /**
   * TerriaJS uses this name whenever it needs to display the name of the application.
   */
  appName?: string;
  /**
   * The email address shown when things go wrong.
   */
  supportEmail?: string;
  /**
   * The maximum number of "feature info" boxes that can be displayed when clicking a point.
   */
  defaultMaximumShownFeatureInfos: number;
  /**
   * URL of the JSON file that contains index of catalog.
   */
  catalogIndexUrl?: string;
  /**
   * URL of the JSON file that defines region mapping for CSV files.
   */
  regionMappingDefinitionsUrl: string;
  /**
   * URL of Proj4 projection lookup service (part of TerriaJS-Server).
   */
  proj4ServiceBaseUrl?: string;
  /**
   * URL of CORS proxy service (part of TerriaJS-Server)
   */
  corsProxyBaseUrl?: string;
  /**
   * @deprecated
   */
  proxyableDomainsUrl?: string;
  serverConfigUrl?: string;
  shareUrl?: string;
  /**
   * URL of the service used to send feedback.  If not specified, the "Give Feedback" button will not appear.
   */
  feedbackUrl?: string;
  /**
   * An array of base paths to use to try to use to resolve init fragments in the URL.  For example, if this property is `[ "init/", "http://example.com/init/"]`, then a URL with `#test` will first try to load `init/test.json` and, if that fails, next try to load `http://example.com/init/test.json`.
   */
  initFragmentPaths: string[];
  /**
   * Whether the story is enabled. If false story function button won't be available.
   */
  storyEnabled: boolean;
  /**
   * True (the default) to intercept the browser's print feature and use a custom one accessible through the Share panel.
   */
  interceptBrowserPrint?: boolean;
  /**
   * True to create a separate explorer panel tab for each top-level catalog group to list its items in.
   */
  tabbedCatalog?: boolean;
  /**
   * True to use Cesium World Terrain from Cesium ion. False to use terrain from the URL specified with the `"cesiumTerrainUrl"` property. If this property is false and `"cesiumTerrainUrl"` is not specified, the 3D view will use a smooth ellipsoid instead of a terrain surface. Defaults to true.
   */
  useCesiumIonTerrain?: boolean;
  /**
   * The URL to use for Cesium terrain in the 3D Terrain viewer, in quantized mesh format. This property is ignored if "useCesiumIonTerrain" is set to true.
   */
  cesiumTerrainUrl?: string;
  /**
   * The Cesium Ion Asset ID to use for Cesium terrain in the 3D Terrain viewer. `cesiumIonAccessToken` will be used to authenticate. This property is ignored if "useCesiumIonTerrain" is set to true.
   */
  cesiumTerrainAssetId?: number;
  /**
   * The access token to use with Cesium ion. If `"useCesiumIonTerrain"` is true and this property is not specified, the Cesium default Ion key will be used. It is a violation of the Ion terms of use to use the default key in a deployed application.
   */
  cesiumIonAccessToken?: string;
  /**
   * True to use Bing Maps from Cesium ion (Cesium World Imagery). By default, Ion will be used, unless the `bingMapsKey` property is specified, in which case that will be used instead. To disable the Bing Maps layers entirely, set this property to false and set `bingMapsKey` to null.
   */
  useCesiumIonBingImagery?: boolean;
  /**
   * A [Bing Maps API key](https://msdn.microsoft.com/en-us/library/ff428642.aspx) used for requesting Bing Maps base maps and using the Bing Maps geocoder for searching. It is your responsibility to request a key and comply with all terms and conditions.
   */
  bingMapsKey?: string;
  hideTerriaLogo?: boolean;
  /**
   * An array of strings of HTML that fill up the top left logo space (see `brandBarSmallElements` or `displayOneBrand` for small screens).
   */
  brandBarElements?: string[];
  /**
   * An array of strings of HTML that fill up the top left logo space - used for small screens.
   */
  brandBarSmallElements?: string[];
  /**
   * Index of which `brandBarElements` to show for mobile header. This will be used if `this.brandBarSmallElements` is undefined.
   */
  displayOneBrand?: number;
  /**
   * True to disable the "Centre map at your current location" button.
   */
  disableMyLocation?: boolean;
  disableSplitter?: boolean;

  disablePedestrianMode?: boolean;

  experimentalFeatures?: boolean;
  magdaReferenceHeaders?: MagdaReferenceHeaders;
  locationSearchBoundingBox?: number[];
  /**
   * A Google API key for [Google Analytics](https://analytics.google.com).  If specified, TerriaJS will send various events about how it's used to Google Analytics.
   */
  googleAnalyticsKey?: string;

  /**
   * Error service provider configuration.
   */
  errorService?: ErrorServiceOptions;

  globalDisclaimer?: any;
  /**
   * True to display welcome message on startup.
   */
  showWelcomeMessage?: boolean;

  // TODO: make themeing TS
  /** Theme overrides, this is applied in StandardUserInterface and merged in order of highest priority:
   *  `StandardUserInterface.jsx` `themeOverrides` prop -> `theme` config parameter (this object) -> default `terriaTheme` (see `StandardTheme.jsx`)
   */
  theme?: any;
  /**
   * Video to show in welcome message.
   */
  welcomeMessageVideo?: any;
  /**
   * True to display in-app guides.
   */
  showInAppGuides?: boolean;
  /**
   * The content to be displayed in the help panel.
   */
  helpContent?: HelpContentItem[];
  helpContentTerms?: Term[];
  /**
   *
   */
  languageConfiguration?: LanguageConfiguration;
  /**
   * Custom concurrent request limits for domains in Cesium's RequestScheduler. Cesium's default is 6 per domain (the maximum allowed by browsers unless the server supports http2). For servers supporting http2 try 12-24 to have more parallel requests. Setting this too high will undermine Cesium's prioritised request scheduling and important data may load slower. Format is {"domain_without_protocol:port": number}.
   */
  customRequestSchedulerLimits?: Record<string, number>;

  /**
   * Whether to load persisted viewer mode from local storage.
   */
  persistViewerMode?: boolean;

  /**
   * Whether to open the add data explorer panel on load.
   */
  openAddData?: boolean;

  /**
   * Text showing at the top of feedback form.
   */
  feedbackPreamble?: string;

  /**
   * Text showing at the bottom of feedback form.
   */
  feedbackPostamble?: string;
  /**
   * Minimum length of feedback comment.
   */
  feedbackMinLength?: number;

  /** If undefined, then Leaflet's default attribution will be used */
  leafletAttributionPrefix?: string;

  /**
   * Extra links to show in the credit line at the bottom of the map (currently only the Cesium map).
   */
  extraCreditLinks?: ICredit[];

  /**
   * Configurable discalimer that shows up in print view
   */
  printDisclaimer?: { url: string; text: string };

  /**
   * Prefix to which `:story-id` is added to fetch JSON for stories when using /story/:story-id routes. Should end in /
   */
  storyRouteUrlPrefix?: string;

  /**
   * For Console Analytics
   */
  enableConsoleAnalytics?: boolean;

  /**
   * Options for Google Analytics
   */
  googleAnalyticsOptions?: unknown;
}

export interface StartOptions {
  configUrl: string;
  configUrlHeaders?: {
    [key: string]: string;
  };
  /** Override getConfigUrl, this function will be used to get TerriaConfig */
  getConfig?: () => Promise<JsonValue>;
  /** Set to undefined if you don't want the user to be able to control catalog loading via the URL */
  applicationUrl?: Location;
  shareDataService?: ShareDataService;
  /**
   * i18nOptions is explicitly a separate option from `languageConfiguration`,
   * as `languageConfiguration` can be serialised, but `i18nOptions` may have
   * some functions that are passed in from a TerriaMap
   *  */
  i18nOptions?: I18nStartOptions;
  disableUpdateApplicationOnHashChange?: boolean;
  disableUpdateApplicationOnMessageFromParentWindow?: boolean;
}

export interface Analytics {
  start: (
    configParameters: Partial<{
      enableConsoleAnalytics: boolean;
      googleAnalyticsKey: any;
      googleAnalyticsOptions: any;
    }>
  ) => void;
  logEvent: (
    category: string,
    action: string,
    label?: string,
    value?: string
  ) => void;
}

export interface TerriaOptions {
  /**
   * Override detecting base href from document.baseURI.
   * Used in specs to support routes within Karma spec automation framework
   */
  appBaseHref?: string;
  /**
   * Base url where TerriaJS resources can be found.
   * Normally "build/TerriaJS/" in any TerriaMap and "./" in specs
   */
  baseUrl?: string;
  analytics?: Analytics;
}

export interface HomeCameraInit {
  [key: string]: HomeCameraInit[keyof HomeCameraInit];
  north: number;
  east: number;
  south: number;
  west: number;
}

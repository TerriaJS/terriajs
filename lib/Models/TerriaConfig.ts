import { action, makeObservable, observable } from "mobx";
import { HelpContentItem } from "../ReactViewModels/defaultHelpContent";
import { Term, defaultTerms } from "../ReactViewModels/defaultTerms";
import { ICredit } from "../ReactViews/Map/BottomBar/Credits";
import { SearchBarTraits } from "../Traits/SearchProviders/SearchBarTraits";
import SearchProviderTraits from "../Traits/SearchProviders/SearchProviderTraits";
import { MagdaReferenceHeaders } from "./Catalog/CatalogReferences/MagdaReference";
import ModelPropertiesFromTraits from "./Definition/ModelPropertiesFromTraits";
import { ErrorServiceOptions } from "./ErrorServiceProviders/ErrorService";
import { LanguageConfiguration } from "./Internationalization";
import { RelatedMap } from "./RelatedMaps";
import { StoryVideoSettings } from "./StoryVideoSettings";

export interface ConfigParameters {
  /**
   * TerriaJS uses this name whenever it needs to display the name of the
   * application.
   */
  appName?: string;
  /**
   * The email address shown when things go wrong.
   */
  supportEmail?: string;
  /**
   * The maximum number of "feature info" boxes that can be displayed when
   * clicking a point.
   */
  defaultMaximumShownFeatureInfos: number;
  /**
   * URL of the JSON file that contains index of catalog.
   */
  catalogIndexUrl?: string;
  /**
   * **Deprecated** - please use regionMappingDefinitionsUrls array instead. If
   * this is defined, it will override `regionMappingDefinitionsUrls`
   */
  regionMappingDefinitionsUrl?: string | undefined;
  /**
   * URLs of the JSON file that defines region mapping for CSV files. First
   * matching region will be used (in array order)
   */
  regionMappingDefinitionsUrls: string[];
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
   * URL of the service used to send feedback.  If not specified, the "Give
   * Feedback" button will not appear.
   */
  feedbackUrl?: string;
  /**
   * An array of base paths to use to try to use to resolve init fragments in
   * the URL.  For example, if this property is `[ "init/",
   * "http://example.com/init/"]`, then a URL with `#test` will first try to
   * load `init/test.json` and, if that fails, next try to load
   * `http://example.com/init/test.json`.
   */
  initFragmentPaths: string[];
  /**
   * Whether the story is enabled. If false story function button won't be
   * available.
   */
  storyEnabled: boolean;
  /**
   * Whether to show the saving instructions message in the story builder panel.
   * Defaults to false.
   */
  showStorySaveInstructions?: boolean;
  /**
   * True (the default) to intercept the browser's print feature and use a
   * custom one accessible through the Share panel.
   */
  interceptBrowserPrint?: boolean;
  /**
   * True to create a separate explorer panel tab for each top-level catalog
   * group to list its items in.
   */
  tabbedCatalog?: boolean;
  /**
   * True to use Cesium World Terrain from Cesium ion. False to use terrain from
   * the URL specified with the `"cesiumTerrainUrl"` property. If this property
   * is false and `"cesiumTerrainUrl"` is not specified, the 3D view will use a
   * smooth ellipsoid instead of a terrain surface. Defaults to true.
   */
  useCesiumIonTerrain?: boolean;
  /**
   * The URL to use for Cesium terrain in the 3D Terrain viewer, in quantized
   * mesh format. This property is ignored if "useCesiumIonTerrain" is set to
   * true.
   */
  cesiumTerrainUrl?: string;
  /**
   * The Cesium Ion Asset ID to use for Cesium terrain in the 3D Terrain viewer.
   * `cesiumIonAccessToken` will be used to authenticate. This property is
   * ignored if "useCesiumIonTerrain" is set to true.
   */
  cesiumTerrainAssetId?: number;
  /**
   * The access token to use with Cesium ion. If `"useCesiumIonTerrain"` is true
   * and this property is not specified, the Cesium default Ion key will be
   * used. It is a violation of the Ion terms of use to use the default key in a
   * deployed application.
   */
  cesiumIonAccessToken?: string;
  /**
   * True to use Bing Maps from Cesium ion (Cesium World Imagery). By default,
   * Ion will be used, unless the `bingMapsKey` property is specified, in which
   * case that will be used instead. To disable the Bing Maps layers entirely,
   * set this property to false and set `bingMapsKey` to null.
   */
  useCesiumIonBingImagery?: boolean;
  /**
   * The OAuth2 application ID to use to allow login to Cesium ion on the "Add
   * Data" panel. The referenced application must be configured on Cesium ion
   * with a Redirect URI of `[TerriaMap Base
   * URL]/build/TerriaJS/cesium-ion-oauth2.html`. For example, if users access
   * your TerriaJS application at `https://example.com/AwesomeMap` then the
   * Redirect URI must be exactly
   * `https://example.com/AwesomeMap/build/TerriaJS/cesium-ion-oauth2.html`.
   */
  cesiumIonOAuth2ApplicationID?: number;
  /**
   * Specifies where to store the Cesium ion login token. Valid values are:
   *   - `page` (default) - The login token is associated with the current page
   *     load. Even simply reloading the current page will clear the token. This
   *     is the safest option.
   *   - `sessionStorage` - The login token is associated with a browser
   *     session, which means it is shared/accessible from any page hosted on
   *     the same domain and running in the same browser tab.
   *   - `localStorage` - The login token is shared/accessible from any page
   *     hosted on the same domain, even when running in different tabs or after
   *     exiting and restarted the web browser.
   */
  cesiumIonLoginTokenPersistence?: string;
  /**
   * Whether or not Cesium ion assets added via the "Add Data" panel will be
   * shared with others via share links. If true, users will be asked to select
   * a Cesium ion token when adding assets, and this choice must be made
   * carefully to avoid exposing more Cesium ion assets than intended. If false
   * (the default), the user's login token will be used, which is safe because
   * this token will not be shared with others.
   */
  cesiumIonAllowSharingAddedAssets?: boolean;
  /**
   * A [Bing Maps API
   * key](https://msdn.microsoft.com/en-us/library/ff428642.aspx) used for
   * requesting Bing Maps base maps and using the Bing Maps geocoder for
   * searching. It is your responsibility to request a key and comply with all
   * terms and conditions.
   */
  bingMapsKey?: string;
  hideTerriaLogo?: boolean;
  /**
   * An array of strings of HTML that fill up the top left logo space (see
   * `brandBarSmallElements` or `displayOneBrand` for small screens).
   */
  brandBarElements?: string[];
  /**
   * An array of strings of HTML that fill up the top left logo space - used for
   * small screens.
   */
  brandBarSmallElements?: string[];
  /**
   * Index of which `brandBarElements` to show for mobile header. This will be
   * used if `this.brandBarSmallElements` is undefined.
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
   * A Google API key for [Google Analytics](https://analytics.google.com).  If
   * specified, TerriaJS will send various events about how it's used to Google
   * Analytics.
   */
  googleAnalyticsKey?: string;

  /**
   * Options for Google Analytics
   */
  googleAnalyticsOptions?: unknown;

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
  /** Theme overrides, this is applied in StandardUserInterface and merged in
   *  order of highest priority: `StandardUserInterface.jsx` `themeOverrides`
   *  prop -> `theme` config parameter (this object) -> default `terriaTheme`
   *  (see `StandardTheme.jsx`)
   */
  theme?: any;
  /**
   * Video to show in welcome message.
   */
  welcomeMessageVideo?: any;
  /**
   * Video to show in Story Builder.
   */
  storyVideo?: StoryVideoSettings;
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
   * Custom concurrent request limits for domains in Cesium's RequestScheduler.
   * Cesium's default is 6 per domain (the maximum allowed by browsers unless
   * the server supports http2). For servers supporting http2 try 12-24 to have
   * more parallel requests. Setting this too high will undermine Cesium's
   * prioritised request scheduling and important data may load slower. Format
   * is {"domain_without_protocol:port": number}.
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

  /** Maximum zoom level for Leaflet map */
  leafletMaxZoom: number;

  /** If undefined, then Leaflet's default attribution will be used */
  leafletAttributionPrefix?: string;

  /**
   * Extra links to show in the credit line at the bottom of the map (currently
   * only the Cesium map).
   */
  extraCreditLinks?: ICredit[];

  /**
   * Configurable discalimer that shows up in print view
   */
  printDisclaimer?: { url: string; text: string };

  /**
   * Prefix to which `:story-id` is added to fetch JSON for stories when using
   * /story/:story-id routes. Should end in /
   */
  storyRouteUrlPrefix?: string;

  /**
   * For Console Analytics
   */
  enableConsoleAnalytics?: boolean;

  relatedMaps?: RelatedMap[];

  /**
   * Optional plugin configuration
   */
  plugins?: Record<string, any>;

  aboutButtonHrefUrl?: string | null;

  /**
   * The search bar allows requesting information from various search services
   * at once.
   */
  searchBarConfig?: ModelPropertiesFromTraits<SearchBarTraits>;
  searchProviders: ModelPropertiesFromTraits<SearchProviderTraits>[];

  /**
   * Keep catalog open when adding / removing items
   */
  keepCatalogOpen: boolean;
}

/**
 * Holds all TerriaJS application configuration with defaults.
 *
 * Apply config from any source in any order — last write wins per field,
 * `undefined` values do not overwrite existing values.
 *
 * @example
 * const config = new TerriaConfig();
 * config.apply(await loadConfig("config.json"));
 * config.apply(parseHashParams(location.hash));
 * config.apply(readLocalStorage(localStorage));
 */
export class TerriaConfig {
  @observable appName: string = "TerriaJS App";
  @observable supportEmail: string = "info@terria.io";
  @observable defaultMaximumShownFeatureInfos: number = 100;
  @observable catalogIndexUrl: string | undefined = undefined;
  @observable regionMappingDefinitionsUrl: string | undefined = undefined;
  @observable regionMappingDefinitionsUrls: string[] = [
    "build/TerriaJS/data/regionMapping.json"
  ];
  @observable proj4ServiceBaseUrl: string | undefined = "proj4def/";
  @observable corsProxyBaseUrl: string | undefined = "proxy/";
  @observable proxyableDomainsUrl: string | undefined = "proxyabledomains/";
  @observable serverConfigUrl: string | undefined = "serverconfig/";
  @observable shareUrl: string | undefined = "share";
  @observable feedbackUrl: string | undefined = undefined;
  @observable initFragmentPaths: string[] = ["init/"];
  @observable storyEnabled: boolean = true;
  @observable showStorySaveInstructions: boolean | undefined = false;
  @observable interceptBrowserPrint: boolean | undefined = true;
  @observable tabbedCatalog: boolean | undefined = false;
  @observable useCesiumIonTerrain: boolean | undefined = true;
  @observable cesiumTerrainUrl: string | undefined = undefined;
  @observable cesiumTerrainAssetId: number | undefined = undefined;
  @observable cesiumIonAccessToken: string | undefined = undefined;
  @observable useCesiumIonBingImagery: boolean | undefined = undefined;
  @observable cesiumIonOAuth2ApplicationID: number | undefined = undefined;
  @observable cesiumIonLoginTokenPersistence: string | undefined = "page";
  @observable cesiumIonAllowSharingAddedAssets: boolean | undefined = false;
  @observable bingMapsKey: string | undefined = undefined;
  @observable hideTerriaLogo: boolean | undefined = false;
  @observable brandBarElements: string[] | undefined = undefined;
  @observable brandBarSmallElements: string[] | undefined = undefined;
  @observable displayOneBrand: number | undefined = 0;
  @observable disableMyLocation: boolean | undefined = undefined;
  @observable disableSplitter: boolean | undefined = undefined;
  @observable disablePedestrianMode: boolean | undefined = false;
  @observable keepCatalogOpen: boolean = false;
  @observable experimentalFeatures: boolean | undefined = undefined;
  @observable magdaReferenceHeaders: MagdaReferenceHeaders | undefined =
    undefined;
  @observable locationSearchBoundingBox: number[] | undefined = undefined;
  @observable googleAnalyticsKey: string | undefined = undefined;
  @observable googleAnalyticsOptions: unknown = undefined;
  @observable errorService: ErrorServiceOptions | undefined = undefined;
  @observable globalDisclaimer: any = undefined;
  @observable showWelcomeMessage: boolean | undefined = false;
  @observable theme: any = {};
  @observable welcomeMessageVideo: any = {
    videoTitle: "Getting started with the map",
    videoUrl: "https://www.youtube-nocookie.com/embed/FjSxaviSLhc",
    placeholderImage: "https://img.youtube.com/vi/FjSxaviSLhc/maxresdefault.jpg"
  };
  @observable storyVideo: StoryVideoSettings | undefined = {
    videoUrl: "https://www.youtube-nocookie.com/embed/fbiQawV8IYY"
  };
  @observable showInAppGuides: boolean | undefined = false;
  @observable helpContent: HelpContentItem[] | undefined = [];
  @observable helpContentTerms: Term[] | undefined = defaultTerms;
  @observable languageConfiguration: LanguageConfiguration | undefined =
    undefined;
  @observable customRequestSchedulerLimits: Record<string, number> | undefined =
    undefined;
  @observable persistViewerMode: boolean | undefined = true;
  @observable openAddData: boolean | undefined = false;
  @observable feedbackPreamble: string | undefined =
    "translate#feedback.feedbackPreamble";
  @observable feedbackPostamble: string | undefined = undefined;
  @observable feedbackMinLength: number | undefined = 0;
  @observable leafletMaxZoom: number = 18;
  @observable leafletAttributionPrefix: string | undefined = undefined;
  @observable extraCreditLinks: ICredit[] | undefined = [
    {
      text: "map.extraCreditLinks.dataAttribution",
      url: "https://terria.io/attributions"
    },
    {
      text: "map.extraCreditLinks.termsOfUse",
      url: "https://terria.io/demo-terms"
    }
  ];
  @observable printDisclaimer: { url: string; text: string } | undefined =
    undefined;
  @observable storyRouteUrlPrefix: string | undefined = undefined;
  @observable enableConsoleAnalytics: boolean | undefined = undefined;
  @observable relatedMaps: RelatedMap[] | undefined = [];
  @observable plugins: Record<string, any> | undefined = undefined;
  @observable aboutButtonHrefUrl: string | null | undefined = "about.html";
  @observable searchBarConfig:
    | ModelPropertiesFromTraits<SearchBarTraits>
    | undefined = undefined;
  @observable
  searchProviders: ModelPropertiesFromTraits<SearchProviderTraits>[] = [];

  constructor() {
    makeObservable(this);
  }

  /**
   * Merges `partial` into this config. Only fields present in
   * `ConfigParameters` are accepted; `undefined` values do not overwrite
   * existing values.
   */
  @action
  apply(partial: Partial<ConfigParameters>): void {
    (Object.entries(partial) as [keyof ConfigParameters, unknown][]).forEach(
      ([key, value]) => {
        if (key in this && value !== undefined) {
          (this as any)[key] = value;
        }
      }
    );
  }
}

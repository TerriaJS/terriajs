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

type OnlyProps<T> = {
  [K in keyof T as T[K] extends (...args: never) => unknown ? never : K]: T[K];
};

export type ConfigParameters = OnlyProps<TerriaConfig>;

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
  /**
   * TerriaJS uses this name whenever it needs to display the name of the
   * application.
   */
  @observable appName: string = "TerriaJS App";
  /**
   * The email address shown when things go wrong.
   */
  @observable supportEmail: string = "info@terria.io";
  /**
   * The maximum number of "feature info" boxes that can be displayed when
   * clicking a point.
   */
  @observable defaultMaximumShownFeatureInfos: number = 100;
  /**
   * URL of the JSON file that contains index of catalog.
   */
  @observable catalogIndexUrl: string | undefined = undefined;
  /**
   * If this is defined, it will override `regionMappingDefinitionsUrls`
   * @deprecated - please use regionMappingDefinitionsUrls array instead.
   */
  @observable regionMappingDefinitionsUrl: string | undefined = undefined;
  /**
   * URLs of the JSON file that defines region mapping for CSV files. First
   * matching region will be used (in array order)
   */
  @observable regionMappingDefinitionsUrls: string[] = [
    "build/TerriaJS/data/regionMapping.json"
  ];
  /**
   * URL of Proj4 projection lookup service (part of TerriaJS-Server).
   */
  @observable proj4ServiceBaseUrl: string | undefined = "proj4def/";
  /**
   * URL of CORS proxy service (part of TerriaJS-Server)
   */
  @observable corsProxyBaseUrl: string | undefined = "proxy/";
  /**
   * @deprecated
   */
  @observable proxyableDomainsUrl: string | undefined = "proxyabledomains/";
  @observable serverConfigUrl: string | undefined = "serverconfig/";
  @observable shareUrl: string | undefined = "share";
  /**
   * URL of the service used to send feedback.  If not specified, the "Give
   * Feedback" button will not appear.
   */
  @observable feedbackUrl: string | undefined = undefined;
  /**
   * An array of base paths to use to try to use to resolve init fragments in
   * the URL.  For example, if this property is `[ "init/",
   * "http://example.com/init/"]`, then a URL with `#test` will first try to
   * load `init/test.json` and, if that fails, next try to load
   * `http://example.com/init/test.json`.
   */
  @observable initFragmentPaths: string[] = ["init/"];
  /**
   * Whether the story is enabled. If false story function button won't be
   * available.
   */
  @observable storyEnabled: boolean = true;
  /**
   * Whether to show the saving instructions message in the story builder panel.
   * Defaults to false.
   */
  @observable showStorySaveInstructions: boolean | undefined = false;
  /**
   * True (the default) to intercept the browser's print feature and use a
   * custom one accessible through the Share panel.
   */
  @observable interceptBrowserPrint: boolean | undefined = true;
  /**
   * True to create a separate explorer panel tab for each top-level catalog
   * group to list its items in.
   */
  @observable tabbedCatalog: boolean | undefined = false;
  /**
   * True to use Cesium World Terrain from Cesium ion. False to use terrain from
   * the URL specified with the `"cesiumTerrainUrl"` property. If this property
   * is false and `"cesiumTerrainUrl"` is not specified, the 3D view will use a
   * smooth ellipsoid instead of a terrain surface. Defaults to true.
   */
  @observable useCesiumIonTerrain: boolean | undefined = true;
  /**
   * The URL to use for Cesium terrain in the 3D Terrain viewer, in quantized
   * mesh format. This property is ignored if "useCesiumIonTerrain" is set to
   * true.
   */
  @observable cesiumTerrainUrl: string | undefined = undefined;
  /**
   * The Cesium Ion Asset ID to use for Cesium terrain in the 3D Terrain viewer.
   * `cesiumIonAccessToken` will be used to authenticate. This property is
   * ignored if "useCesiumIonTerrain" is set to true.
   */
  @observable cesiumTerrainAssetId: number | undefined = undefined;
  /**
   * The access token to use with Cesium ion. If `"useCesiumIonTerrain"` is true
   * and this property is not specified, the Cesium default Ion key will be
   * used. It is a violation of the Ion terms of use to use the default key in a
   * deployed application.
   */
  @observable cesiumIonAccessToken: string | undefined = undefined;
  /**
   * True to use Bing Maps from Cesium ion (Cesium World Imagery). By default,
   * Ion will be used, unless the `bingMapsKey` property is specified, in which
   * case that will be used instead. To disable the Bing Maps layers entirely,
   * set this property to false and set `bingMapsKey` to null.
   */
  @observable useCesiumIonBingImagery: boolean | undefined = undefined;
  /**
   * The OAuth2 application ID to use to allow login to Cesium ion on the "Add
   * Data" panel. The referenced application must be configured on Cesium ion
   * with a Redirect URI of `[TerriaMap Base
   * URL]/build/TerriaJS/cesium-ion-oauth2.html`. For example, if users access
   * your TerriaJS application at `https://example.com/AwesomeMap` then the
   * Redirect URI must be exactly
   * `https://example.com/AwesomeMap/build/TerriaJS/cesium-ion-oauth2.html`.
   */
  @observable cesiumIonOAuth2ApplicationID: number | undefined = undefined;
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
  @observable cesiumIonLoginTokenPersistence: string | undefined = "page";
  /**
   * Whether or not Cesium ion assets added via the "Add Data" panel will be
   * shared with others via share links. If true, users will be asked to select
   * a Cesium ion token when adding assets, and this choice must be made
   * carefully to avoid exposing more Cesium ion assets than intended. If false
   * (the default), the user's login token will be used, which is safe because
   * this token will not be shared with others.
   */
  @observable cesiumIonAllowSharingAddedAssets: boolean | undefined = false;
  /**
   * A [Bing Maps API
   * key](https://msdn.microsoft.com/en-us/library/ff428642.aspx) used for
   * requesting Bing Maps base maps and using the Bing Maps geocoder for
   * searching. It is your responsibility to request a key and comply with all
   * terms and conditions.
   */
  @observable bingMapsKey: string | undefined = undefined;
  @observable hideTerriaLogo: boolean | undefined = false;
  /**
   * An array of strings of HTML that fill up the top left logo space (see
   * `brandBarSmallElements` or `displayOneBrand` for small screens).
   */
  @observable brandBarElements: string[] | undefined = undefined;
  /**
   * An array of strings of HTML that fill up the top left logo space - used for
   * small screens.
   */
  @observable brandBarSmallElements: string[] | undefined = undefined;
  /**
   * Index of which `brandBarElements` to show for mobile header. This will be
   * used if `this.brandBarSmallElements` is undefined.
   */
  @observable displayOneBrand: number | undefined = 0;
  /**
   * True to disable the "Centre map at your current location" button.
   */
  @observable disableMyLocation: boolean | undefined = undefined;
  @observable disableSplitter: boolean | undefined = undefined;

  @observable disablePedestrianMode: boolean | undefined = false;
  /**
   * Keep catalog open when adding / removing items
   */
  @observable keepCatalogOpen: boolean = false;
  @observable experimentalFeatures: boolean | undefined = undefined;
  @observable magdaReferenceHeaders: MagdaReferenceHeaders | undefined =
    undefined;
  @observable locationSearchBoundingBox: number[] | undefined = undefined;
  /**
   * A Google API key for [Google Analytics](https://analytics.google.com).  If
   * specified, TerriaJS will send various events about how it's used to Google
   * Analytics.
   */
  @observable googleAnalyticsKey: string | undefined = undefined;

  /**
   * Options for Google Analytics
   */
  @observable googleAnalyticsOptions: unknown = undefined;

  /**
   * Error service provider configuration.
   */
  @observable errorService: ErrorServiceOptions | undefined = undefined;

  @observable globalDisclaimer: any = undefined;
  /**
   * True to display welcome message on startup.
   */
  @observable showWelcomeMessage: boolean | undefined = false;

  // TODO: make themeing TS
  /** Theme overrides, this is applied in StandardUserInterface and merged in
   *  order of highest priority: `StandardUserInterface.jsx` `themeOverrides`
   *  prop -> `theme` config parameter (this object) -> default `terriaTheme`
   *  (see `StandardTheme.jsx`)
   */
  @observable theme: any = {};
  /**
   * Video to show in welcome message.
   */
  @observable welcomeMessageVideo: any = {
    videoTitle: "Getting started with the map",
    videoUrl: "https://www.youtube-nocookie.com/embed/FjSxaviSLhc",
    placeholderImage: "https://img.youtube.com/vi/FjSxaviSLhc/maxresdefault.jpg"
  };
  /**
   * Video to show in Story Builder.
   */
  @observable storyVideo: StoryVideoSettings | undefined = {
    videoUrl: "https://www.youtube-nocookie.com/embed/fbiQawV8IYY"
  };
  /**
   * True to display in-app guides.
   */
  @observable showInAppGuides: boolean | undefined = false;
  /**
   * The content to be displayed in the help panel.
   */
  @observable helpContent: HelpContentItem[] | undefined = [];
  @observable helpContentTerms: Term[] | undefined = defaultTerms;
  /**
   *
   */
  @observable languageConfiguration: LanguageConfiguration | undefined =
    undefined;

  /**
   * Custom concurrent request limits for domains in Cesium's RequestScheduler.
   * Cesium's default is 6 per domain (the maximum allowed by browsers unless
   * the server supports http2). For servers supporting http2 try 12-24 to have
   * more parallel requests. Setting this too high will undermine Cesium's
   * prioritised request scheduling and important data may load slower. Format
   * is {"domain_without_protocol:port": number}.
   */
  @observable customRequestSchedulerLimits: Record<string, number> | undefined =
    undefined;

  /**
   * Whether to load persisted viewer mode from local storage.
   */
  @observable persistViewerMode: boolean | undefined = true;

  /**
   * Whether to open the add data explorer panel on load.
   */
  @observable openAddData: boolean | undefined = false;

  /**
   * Text showing at the top of feedback form.
   */
  @observable feedbackPreamble: string | undefined =
    "translate#feedback.feedbackPreamble";

  /**
   * Text showing at the bottom of feedback form.
   */
  @observable feedbackPostamble: string | undefined = undefined;
  /**
   * Minimum length of feedback comment.
   */
  @observable feedbackMinLength: number | undefined = 0;
  /**
   * Maximum zoom level for Leaflet map
   */
  @observable leafletMaxZoom: number = 18;
  /**
   * If undefined, then Leaflet's default attribution will be used
   */
  @observable leafletAttributionPrefix: string | undefined = undefined;
  /**
   * Extra links to show in the credit line at the bottom of the map (currently
   * only the Cesium map).
   */
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
  /**
   * Configurable discalimer that shows up in print view
   */
  @observable printDisclaimer: { url: string; text: string } | undefined =
    undefined;
  /**
   * Prefix to which `:story-id` is added to fetch JSON for stories when using
   * /story/:story-id routes. Should end in /
   */
  @observable storyRouteUrlPrefix: string | undefined = undefined;

  /**
   * For Console Analytics
   */
  @observable enableConsoleAnalytics: boolean | undefined = undefined;

  @observable relatedMaps: RelatedMap[] | undefined = [];

  /**
   * Optional plugin configuration
   */
  @observable plugins: Record<string, any> | undefined = undefined;

  @observable aboutButtonHrefUrl: string | null | undefined = "about.html";

  /**
   * The search bar allows requesting information from various search services
   * at once.
   */
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
  update(partial: Partial<ConfigParameters>): void {
    (Object.entries(partial) as [keyof TerriaConfig, unknown][]).forEach(
      ([key, value]) => {
        if (key in this && value !== undefined) {
          (this as any)[key] = value;
        }
      }
    );
  }
}

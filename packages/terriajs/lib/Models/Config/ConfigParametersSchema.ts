import * as z from "zod";
import { HelpContentItemSchema } from "../../ReactViewModels/defaultHelpContent";
import { defaultTerms, TermSchema } from "../../ReactViewModels/defaultTerms";
import { LanguageConfigurationSchema } from "../Internationalization";
import { RelatedMapSchema } from "../RelatedMaps";
import { SearchBarConfigSchema } from "../SearchProviders/SearchBarModel";

/**
 * Zod schema for all TerriaJS configuration parameters — validation only.
 *
 * No `.default()` calls here. Defaults live in `CONFIG_DEFAULTS` and are loaded
 * into the `defaults` stratum at startup. Keeping them separate means:
 *  - Schema transforms that rename keys work correctly with `parseInput` (which
 *    uses `schema.partial()` so transformed output keys aren't filtered out by
 *    an input-key comparison)
 *  - Defaults are visible as a plain object, easy to inspect and override
 *  - The schema stays a plain `ZodObject` — `schema.shape` and
 *    `schema.partial()` remain accessible without `ZodEffects` unwrapping
 *  - Defaults don't leak between stratum levels. If defaults were defined in
 *    the schema, then the defaults would be applied at every stratum level,
 *    which is not what we want.
 *
 * **Authoring convention:**
 *  - Fields that always have a value → plain type (e.g. `z.string()`)
 *  - Fields that can be absent → `.optional()`
 */
export const ConfigParametersSchema = z.object({
  // ── Identity ────────────────────────────────────────────────────────
  /**
   * TerriaJS uses this name whenever it needs to display the name of the
   * application.
   */
  appName: z.string(),
  /**
   * The email address shown when things go wrong.
   */
  supportEmail: z.string(),

  // ── Feature limits ──────────────────────────────────────────────────
  /**
   * The maximum number of "feature info" boxes that can be displayed when
   * clicking a point.
   */
  defaultMaximumShownFeatureInfos: z.number(),
  /** Maximum zoom level for Leaflet map */
  leafletMaxZoom: z.number(),
  /** If undefined, then Leaflet's default attribution will be used */
  leafletAttributionPrefix: z.string().optional(),

  // ── URLs ─────────────────────────────────────────────────────────────
  /**
   * URL of the JSON file that contains index of catalog.
   */
  catalogIndexUrl: z.string().optional(),
  /**
   * @deprecated - please use regionMappingDefinitionsUrls array instead. If
   * this is defined, it will override `regionMappingDefinitionsUrls`
   */
  regionMappingDefinitionsUrl: z.string().optional(),
  /**
   * URLs of the JSON file that defines region mapping for CSV files. First
   * matching region will be used (in array order)
   */
  regionMappingDefinitionsUrls: z.array(z.string()),
  /**
   * URL of Proj4 projection lookup service (part of TerriaJS-Server).
   */
  proj4ServiceBaseUrl: z.string(),
  /**
   * URL of CORS proxy service (part of TerriaJS-Server)
   */
  corsProxyBaseUrl: z.string(),
  /** @deprecated */
  proxyableDomainsUrl: z.string(),
  /** URL to TerriaJS-server config. Defaults to `serverconfig/`. */
  serverConfigUrl: z.string(),
  /**
   * URL of the service used to generate share links. This defaults to `share`
   * if not specified, which maps to TerriaJS Server `share` endpoint.
   */
  shareUrl: z.string(),
  shareRequestHeaders: z
    .function({
      // eslint-disable-next-line zod/no-promise-schema
      output: z.promise(z.record(z.string(), z.string()))
    })
    .optional(),
  /**
   * Base URL of the client application used to generate share links. If not
   * specified, the current page base URI will be used. For example, if
   * `shareClientBaseUrl` is `http://example.com/`, then a share link will be
   * generated as `http://example.com/#share=...`.
   */
  shareClientBaseUrl: z.string().optional(),
  /**
   * URL of the service used to send feedback.  If not specified, the "Give
   * Feedback" button will not appear.
   */
  feedbackUrl: z.string().optional(),
  feedbackRequestHeaders: z
    .function({
      // eslint-disable-next-line zod/no-promise-schema
      output: z.promise(z.record(z.string(), z.string()))
    })
    .optional(),
  /**
   * Prefix to which `:story-id` is added to fetch JSON for stories when using
   * /story/:story-id routes. Should end in /
   */
  storyRouteUrlPrefix: z.string().optional(),
  aboutButtonHrefUrl: z.string().nullable(),

  /**
   * An array of base paths to use to try to use to resolve init fragments in
   * the URL.  For example, if this property is `[ "init/",
   * "http://example.com/init/"]`, then a URL with `#test` will first try to
   * load `init/test.json` and, if that fails, next try to load
   * `http://example.com/init/test.json`.
   */
  initFragmentPaths: z.array(z.string()),

  // ── Feature flags ──────────────────────────────────────────────────────
  /**
   * Whether the story is enabled. If false story function button won't be
   * available.
   */
  storyEnabled: z.boolean(),
  /**
   * Whether to show the saving instructions message in the story builder panel.
   * Defaults to false.
   */
  showStorySaveInstructions: z.boolean(),
  /**
   * True (the default) to intercept the browser's print feature and use a
   * custom one accessible through the Share panel.
   */
  interceptBrowserPrint: z.boolean(),
  /**
   * True to create a separate explorer panel tab for each top-level catalog
   * group to list its items in.
   */
  tabbedCatalog: z.boolean(),
  experimentalFeatures: z.boolean().optional(),
  /**
   * True to disable the "Centre map at your current location" button.
   */
  disableMyLocation: z.boolean().optional(),
  /**
   * True to disable the "Splitter" button.
   */
  disableSplitter: z.boolean().optional(),
  /**
   * True to disable the "Pedestrian mode" button.
   */
  disablePedestrianMode: z.boolean(),
  /**
   * Keep catalog open when adding / removing items
   */
  keepCatalogOpen: z.boolean(),
  hideTerriaLogo: z.boolean(),
  /**
   * Whether to load persisted viewer mode from local storage.
   */
  persistViewerMode: z.boolean(),
  /**
   * Whether to open the add data explorer panel on load.
   */
  openAddData: z.boolean(),
  showWelcomeMessage: z.boolean(),
  /**
   * True to display in-app guides.
   */
  showInAppGuides: z.boolean(),
  /**
   * For Console Analytics
   */
  enableConsoleAnalytics: z.boolean().optional(),
  /**
   * True to disable the mobile interface.
   */
  disableMobileInterface: z.boolean(),
  /**
   * True to disable the share panel.
   */
  disableSharePanel: z.boolean(),
  /**
   * True to disable the share embed panel.
   */
  disableShareEmbed: z.boolean(),
  /**
   * True to disable user added data.
   */
  disableUserAddedData: z.boolean(),
  /**
   * Zoom preview map on previewed item
   */
  zoomMapOnPreviewedItem: z.boolean(),

  // ── Branding ──────────────────────────────────────────────────────────────
  /**
   * An array of strings of HTML that fill up the top left logo space (see
   * `brandBarSmallElements` or `displayOneBrand` for small screens).
   */
  brandBarElements: z.array(z.string()).optional(),
  /**
   * An array of strings of HTML that fill up the top left logo space - used for
   * small screens.
   */
  brandBarSmallElements: z.array(z.string()).optional(),
  /**
   * Index of which `brandBarElements` to show for mobile header. This will be
   * used if `this.brandBarSmallElements` is undefined.
   */
  displayOneBrand: z.number(),

  // ── Cesium Ion ─────────────────────────────────────────────────────────────
  /**
   * True to use Cesium World Terrain from Cesium ion. False to use terrain from
   * the URL specified with the `"cesiumTerrainUrl"` property. If this property
   * is false and `"cesiumTerrainUrl"` is not specified, the 3D view will use a
   * smooth ellipsoid instead of a terrain surface. Defaults to true.
   */
  useCesiumIonTerrain: z.boolean(),
  /**
   * The URL to use for Cesium terrain in the 3D Terrain viewer, in quantized
   * mesh format. This property is ignored if "useCesiumIonTerrain" is set to
   * true.
   */
  cesiumTerrainUrl: z.string().optional(),
  /**
   * The Cesium Ion Asset ID to use for Cesium terrain in the 3D Terrain viewer.
   * `cesiumIonAccessToken` will be used to authenticate. This property is
   * ignored if "useCesiumIonTerrain" is set to true.
   */
  cesiumTerrainAssetId: z.number().optional(),
  /**
   * The access token to use with Cesium ion. If `"useCesiumIonTerrain"` is true
   * and this property is not specified, the Cesium default Ion key will be
   * used. It is a violation of the Ion terms of use to use the default key in a
   * deployed application.
   */
  cesiumIonAccessToken: z.string().optional(),
  /**
   * True to use Bing Maps from Cesium ion (Cesium World Imagery). By default,
   * Ion will be used, unless the `bingMapsKey` property is specified, in which
   * case that will be used instead. To disable the Bing Maps layers entirely,
   * set this property to false and set `bingMapsKey` to null.
   */
  useCesiumIonBingImagery: z.boolean().optional(),
  /**
   * The OAuth2 application ID to use to allow login to Cesium ion on the "Add
   * Data" panel. The referenced application must be configured on Cesium ion
   * with a Redirect URI of `[TerriaMap Base
   * URL]/build/TerriaJS/cesium-ion-oauth2.html`. For example, if users access
   * your TerriaJS application at `https://example.com/AwesomeMap` then the
   * Redirect URI must be exactly
   * `https://example.com/AwesomeMap/build/TerriaJS/cesium-ion-oauth2.html`.
   */
  cesiumIonOAuth2ApplicationID: z.number().optional(),
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
  cesiumIonLoginTokenPersistence: z.string(),
  /**
   * Whether or not Cesium ion assets added via the "Add Data" panel will be
   * shared with others via share links. If true, users will be asked to select
   * a Cesium ion token when adding assets, and this choice must be made
   * carefully to avoid exposing more Cesium ion assets than intended. If false
   * (the default), the user's login token will be used, which is safe because
   * this token will not be shared with others.
   */
  cesiumIonAllowSharingAddedAssets: z.boolean(),

  /**
   * Whether or not to disable the default Cesium ion token. If true, the user
   * will be asked to select a Cesium ion token when adding assets.
   */
  cesiumIonDisableDefaultToken: z.boolean(),

  // ── Maps / imagery ───────────────────────────────────────────────────────
  /**
   * A [Bing Maps API
   * key](https://msdn.microsoft.com/en-us/library/ff428642.aspx) used for
   * requesting Bing Maps base maps and using the Bing Maps geocoder for
   * searching. It is your responsibility to request a key and comply with all
   * terms and conditions.
   */
  bingMapsKey: z.string().optional(),
  locationSearchBoundingBox: z.array(z.number()).optional(),

  // ── Feedback ─────────────────────────────────────────────────────────────
  /**
   * Text showing at the top of feedback form.
   */
  feedbackPreamble: z.string(),
  /**
   * Text showing at the bottom of feedback form.
   */
  feedbackPostamble: z.string().optional(),
  /**
   * Minimum length of feedback comment.
   */
  feedbackMinLength: z.number(),

  // ── Analytics ─────────────────────────────────────────────────────────────
  /**
   * A Google API key for [Google Analytics](https://analytics.google.com).  If
   * specified, TerriaJS will send various events about how it's used to Google
   * Analytics.
   */
  googleAnalyticsKey: z.string().nullable().optional(),
  /**
   * Options for Google Analytics
   */
  googleAnalyticsOptions: z.unknown().nullable().optional(),

  // ── Complex / opaque types ───────────────────────────────────────────────
  /** Theme overrides, this is applied in StandardUserInterface and merged in
   *  order of highest priority: `StandardUserInterface.jsx` `themeOverrides`
   *  prop -> `theme` config parameter (this object) -> default `terriaTheme`
   *  (see `StandardTheme.jsx`)
   */
  theme: z.record(z.string(), z.unknown()).optional(),
  /**
   * Video to show in welcome message.
   */
  welcomeMessageVideo: z.object({
    videoUrl: z.string(),
    videoTitle: z.string().optional(),
    placeholderImage: z.string().optional()
  }),
  /**
   * Video to show in Story Builder.
   */
  storyVideo: z.looseObject({
    videoUrl: z.string()
  }),
  /**
   * The content to be displayed in the help panel.
   */
  helpContent: z.array(HelpContentItemSchema),
  helpContentTerms: z.array(TermSchema),
  languageConfiguration: LanguageConfigurationSchema.optional(),
  /**
   * Extra links to show in the credit line at the bottom of the map (currently
   * only the Cesium map).
   */
  extraCreditLinks: z.array(
    z.object({
      text: z.string(),
      url: z.string()
    })
  ),
  /**
   * Configurable discalimer that shows up in print view
   */
  printDisclaimer: z.object({ url: z.string(), text: z.string() }).optional(),
  relatedMaps: z.array(RelatedMapSchema),
  /**
   * Optional plugin configuration
   */
  plugins: z.record(z.string(), z.unknown()).optional(),
  /**
   * @deprecated
   * Headers forwarded for Magda reference resolution */
  magdaReferenceHeaders: z.record(z.string(), z.string()).optional(),
  /**
   * Custom concurrent request limits for domains in Cesium's RequestScheduler.
   * Cesium's default is 6 per domain (the maximum allowed by browsers unless
   * the server supports http2). For servers supporting http2 try 12-24 to have
   * more parallel requests. Setting this too high will undermine Cesium's
   * prioritised request scheduling and important data may load slower. Format
   * is {"domain_without_protocol:port": number}.
   */
  customRequestSchedulerLimits: z.record(z.string(), z.number()).optional(),

  // ── Search ─────────────────────────────────────────────────────────────

  /**
   * The search bar allows requesting information from various search services
   * at once.
   */
  searchBarConfig: SearchBarConfigSchema,
  searchProviders: z.array(z.unknown()),

  // ── Share ─────────────────────────────────────────────────────────────
  shortenShareUrls: z.boolean().optional(),

  alwaysShowTimeline: z.boolean().optional(),

  viewerMode: z.enum(["2d", "3d", "3dsmooth"]).optional()
});

/**
 * The resolved configuration type — derived from the schema.
 */
export type ConfigParameters = z.output<typeof ConfigParametersSchema>;

/**
 * Built-in application defaults for every required config parameter.
 *
 * Loaded into the `defaults` stratum of `TerriaConfig` at startup — higher
 * strata (underride, definition, override, user) override individual keys
 * without touching this object.  Optional fields that are absent here naturally
 * resolve to `undefined` when no other stratum provides them.
 */
export const CONFIG_DEFAULTS: ConfigParameters = {
  appName: "TerriaJS App",
  supportEmail: "info@terria.io",
  defaultMaximumShownFeatureInfos: 100,
  leafletMaxZoom: 18,

  regionMappingDefinitionsUrls: ["build/TerriaJS/data/regionMapping.json"],
  proj4ServiceBaseUrl: "proj4def/",
  corsProxyBaseUrl: "proxy/",
  proxyableDomainsUrl: "proxyabledomains/",
  serverConfigUrl: "serverconfig/",
  shareUrl: "share",
  aboutButtonHrefUrl: "about.html",

  initFragmentPaths: ["init/"],

  storyEnabled: true,
  showStorySaveInstructions: false,
  interceptBrowserPrint: true,
  tabbedCatalog: false,
  disablePedestrianMode: false,
  keepCatalogOpen: false,
  hideTerriaLogo: false,
  persistViewerMode: true,
  openAddData: false,
  showWelcomeMessage: false,
  showInAppGuides: false,

  useCesiumIonTerrain: true,
  cesiumIonLoginTokenPersistence: "page",
  cesiumIonAllowSharingAddedAssets: false,

  displayOneBrand: 0,

  feedbackPreamble: "translate#feedback.feedbackPreamble",
  feedbackMinLength: 0,

  theme: {},
  welcomeMessageVideo: {
    videoTitle: "Getting started with the map",
    videoUrl: "https://www.youtube-nocookie.com/embed/FjSxaviSLhc",
    placeholderImage: "https://img.youtube.com/vi/FjSxaviSLhc/maxresdefault.jpg"
  },

  storyVideo: {
    videoUrl: "https://www.youtube-nocookie.com/embed/fbiQawV8IYY"
  },
  helpContent: [],
  helpContentTerms: defaultTerms,
  extraCreditLinks: [
    {
      text: "map.extraCreditLinks.dataAttribution",
      url: "https://terria.io/attributions"
    },
    {
      text: "map.extraCreditLinks.termsOfUse",
      url: "https://terria.io/demo-terms"
    }
  ],
  relatedMaps: [],
  searchProviders: [],
  alwaysShowTimeline: false,
  searchBarConfig: SearchBarConfigSchema.parse({}), // Use Zod defaults for searchBarConfig
  disableMobileInterface: false,
  disableSharePanel: false,
  disableShareEmbed: false,
  disableUserAddedData: false,
  zoomMapOnPreviewedItem: false,
  cesiumIonDisableDefaultToken: false
};

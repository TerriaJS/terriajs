import { SplitDirection } from "terriajs-cesium";
import { z } from "zod";
import { defaultTerms, TermSchema } from "../ReactViewModels/defaultTerms";
import { HelpContentItemSchema } from "../ReactViewModels/defaultHelpContent";
import { LanguageConfigurationSchema } from "./Internationalization";
import { SearchBarConfigSchema } from "./SearchProviders/SearchBarModel";

/**
 * Zod schema for all TerriaJS configuration parameters — validation only.
 *
 * No `.default()` calls here. Defaults live in `CONFIG_DEFAULTS` and are
 * loaded into the `defaults` stratum at startup. Keeping them separate means:
 *  - Schema transforms that rename keys work correctly with `parseInput`
 *    (which uses `schema.partial()` so transformed output keys aren't filtered
 *    out by an input-key comparison)
 *  - Defaults are visible as a plain object, easy to inspect and override
 *  - The schema stays a plain `ZodObject` — `schema.shape` and
 *    `schema.partial()` remain accessible without `ZodEffects` unwrapping
 *
 * **Authoring convention:**
 *  - Fields that always have a value → plain type (e.g. `z.string()`)
 *  - Fields that can be absent → `.optional()`
 */
export const configSchema = z.object({
  // ── Identity ────────────────────────────────────────────────────────────────
  appName: z.string().describe("aaaa"),
  supportEmail: z.string(),

  // ── Feature limits ───────────────────────────────────────────────────────────
  defaultMaximumShownFeatureInfos: z.number(),
  leafletMaxZoom: z.number(),
  leafletAttributionPrefix: z.string().optional(),

  // ── URLs ─────────────────────────────────────────────────────────────────────
  catalogIndexUrl: z.string().optional(),
  /** @deprecated Use regionMappingDefinitionsUrls */
  regionMappingDefinitionsUrl: z.string().optional(),
  regionMappingDefinitionsUrls: z.array(z.string()),
  proj4ServiceBaseUrl: z.string(),
  corsProxyBaseUrl: z.string(),
  /** @deprecated */
  proxyableDomainsUrl: z.string(),
  serverConfigUrl: z.string(),
  shareUrl: z.string(),
  feedbackUrl: z.string().optional(),
  storyRouteUrlPrefix: z.string().optional(),
  aboutButtonHrefUrl: z.string().nullable(),

  // ── Init fragments ────────────────────────────────────────────────────────────
  initFragmentPaths: z.array(z.string()),

  // ── Feature flags ────────────────────────────────────────────────────────────
  storyEnabled: z.boolean(),
  tools: z.boolean(),
  showStorySaveInstructions: z.boolean(),
  interceptBrowserPrint: z.boolean(),
  tabbedCatalog: z.boolean(),
  experimentalFeatures: z.boolean().optional(),
  disableMyLocation: z.boolean().optional(),
  disableSplitter: z.boolean().optional(),
  disablePedestrianMode: z.boolean(),
  keepCatalogOpen: z.boolean(),
  hideTerriaLogo: z.boolean(),
  persistViewerMode: z.boolean(),
  openAddData: z.boolean(),
  showWelcomeMessage: z.boolean(),
  showInAppGuides: z.boolean(),
  enableConsoleAnalytics: z.boolean().optional(),
  ignoreErrors: z.boolean(),
  hideWorkbench: z.boolean(),
  hideExplorerPanel: z.boolean(),

  // ── Viewer / renderer ────────────────────────────────────────────────────────
  useNativeResolution: z.boolean(),
  baseMaximumScreenSpaceError: z.number(),
  showSplitter: z.boolean(),
  splitPosition: z.number(),
  splitPositionVertical: z.number(),
  /** SplitDirection enum from Cesium — stored as number */
  terrainSplitDirection: z.number(),
  depthTestAgainstTerrainEnabled: z.boolean(),

  // ── Cesium Ion ───────────────────────────────────────────────────────────────
  useCesiumIonTerrain: z.boolean(),
  cesiumTerrainUrl: z.string().optional(),
  cesiumTerrainAssetId: z.number().optional(),
  cesiumIonAccessToken: z.string().optional(),
  useCesiumIonBingImagery: z.boolean().optional(),
  cesiumIonOAuth2ApplicationID: z.number().optional(),
  cesiumIonLoginTokenPersistence: z.string(),
  cesiumIonAllowSharingAddedAssets: z.boolean(),

  // ── Maps / imagery ───────────────────────────────────────────────────────────
  bingMapsKey: z.string().optional(),
  locationSearchBoundingBox: z.array(z.number()).optional(),

  // ── Branding ─────────────────────────────────────────────────────────────────
  brandBarElements: z.array(z.string()).optional(),
  brandBarSmallElements: z.array(z.string()).optional(),
  displayOneBrand: z.number(),

  // ── Feedback ─────────────────────────────────────────────────────────────────
  feedbackPreamble: z.string(),
  feedbackPostamble: z.string().optional(),
  feedbackMinLength: z.number(),

  // ── Analytics ────────────────────────────────────────────────────────────────
  googleAnalyticsKey: z.string().optional(),
  googleAnalyticsOptions: z.unknown().optional(),

  // ── Complex / opaque types ───────────────────────────────────────────────────
  globalDisclaimer: z.any().optional(),
  /** Theme overrides merged with terriaTheme in StandardUserInterface */
  theme: z.any().optional(),
  welcomeMessageVideo: z.object({
    videoUrl: z.string(),
    videoTitle: z.string().optional(),
    placeholderImage: z.string().optional()
  }),
  storyVideo: z.looseObject({
    videoUrl: z.string()
  }),
  helpContent: z.array(HelpContentItemSchema),
  helpContentTerms: z.array(TermSchema),
  languageConfiguration: LanguageConfigurationSchema.optional(),
  extraCreditLinks: z.array(
    z.object({
      text: z.string(),
      url: z.string()
    })
  ),
  printDisclaimer: z.object({ url: z.string(), text: z.string() }).optional(),
  relatedMaps: z.array(z.unknown()),
  plugins: z.record(z.string(), z.unknown()).optional(),
  /** Headers forwarded for Magda reference resolution */
  magdaReferenceHeaders: z.record(z.string(), z.string()).optional(),
  /** Domain → concurrent request limit overrides for Cesium RequestScheduler */
  customRequestSchedulerLimits: z.record(z.string(), z.number()).optional(),

  // ── Search ───────────────────────────────────────────────────────────────────
  searchBarConfig: SearchBarConfigSchema,
  searchProviders: z.array(
    z.object({
      name: z
        .string()
        .default("unknown")
        .describe("Name of the search provider."),
      minCharacters: z
        .number()
        .or(z.undefined())
        .describe("Minimum number of characters required for search to start")
    })
  ),

  // ── Share ────────────────────────────────────────────────────────────────────
  shortenShareUrls: z.boolean().optional(),

  alwaysShowTimeline: z.boolean().optional(),

  viewerMode: z.enum(["2d", "3d", "3dsmooth"]).optional()
});

/**
 * The resolved configuration type — derived from the schema.
 */
export type ConfigParameters = z.output<typeof configSchema>;

/**
 * Built-in application defaults for every required config parameter.
 *
 * Loaded into the `defaults` stratum of `TerriaConfig` at startup —
 * higher strata (underride, definition, override, user) override individual
 * keys without touching this object.  Optional fields that are absent here
 * naturally resolve to `undefined` when no other stratum provides them.
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
  tools: false,
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
  ignoreErrors: false,
  hideWorkbench: false,
  hideExplorerPanel: false,

  useNativeResolution: false,
  baseMaximumScreenSpaceError: 2,
  showSplitter: false,
  splitPosition: 0.5,
  splitPositionVertical: 0.5,
  terrainSplitDirection: SplitDirection.NONE,
  depthTestAgainstTerrainEnabled: false,

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
  searchBarConfig: SearchBarConfigSchema.parse({}) // Use Zod defaults for searchBarConfig
};

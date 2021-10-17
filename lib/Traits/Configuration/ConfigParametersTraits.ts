import { MagdaReferenceHeaders } from "../../Models/Catalog/CatalogReferences/MagdaReference";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";
import { ErrorServiceOptionsTraits } from "./ErrorServiceOptionsTraits";
import { FeedbackTraits } from "./FeedbackTraits";
import { HelpContentTraits } from "./HelpContentTraits";
import { LanguageConfigurationTraits } from "./LanguageConfigurationTraits";
import { WelcomeMessageTraits } from "./WelcomeMessageTraits";

export class ExtraCreditLinksTraits extends ModelTraits {
  @primitiveTrait({
    name: "Credit url",
    type: "string",
    description: "Url for the credit."
  })
  url!: string;

  @primitiveTrait({
    name: "Credit text",
    type: "string",
    description: "Text to show in credits."
  })
  text!: string;
}

export class ConfigParametersTraits extends ModelTraits {
  @primitiveTrait({
    name: "App name",
    type: "string",
    description:
      "TerriaJS uses this name whenever it needs to display the name of the application."
  })
  appName: string = "TerriaJS App";

  @primitiveTrait({
    name: "Support email",
    type: "string",
    description: "The email address shown when things go wrong."
  })
  supportEmail: string = "info@terria.io";

  @primitiveTrait({
    name: "Default maximum shown feature infos",
    type: "number",
    description:
      'The maximum number of "feature info" boxes that can be displayed when clicking a point.'
  })
  defaultMaximumShownFeatureInfos: number = 100;

  @primitiveTrait({
    name: "Catalog index url",
    type: "string",
    description: "URL of the JSON file that contains index of catalog."
  })
  catalogIndexUrl?: string = undefined;

  @primitiveTrait({
    name: "Region mapping definitions url",
    type: "string",
    description:
      "URL of the JSON file that defines region mapping for CSV files."
  })
  regionMappingDefinitionsUrl: string =
    "build/TerriaJS/data/regionMapping.json";

  @primitiveTrait({
    name: "Conversion service base url",
    type: "string",
    description: "URL of OGR2OGR conversion service (part of TerriaJS-Server)."
  })
  conversionServiceBaseUrl: string = "convert/";

  @primitiveTrait({
    name: "Proj4 service base url",
    type: "string",
    description:
      "URL of Proj4 projection lookup service (part of TerriaJS-Server)."
  })
  proj4ServiceBaseUrl: string = "proj4def/";

  @primitiveTrait({
    name: "Cors proxy base url",
    type: "string",
    description: "URL of CORS proxy service (part of TerriaJS-Server)."
  })
  corsProxyBaseUrl: string = "proxy/";

  /**
   * @deprecated
   */
  @primitiveTrait({
    name: "Proxyable domains url",
    type: "string",
    description: ""
  })
  proxyableDomainsUrl: string = "proxyabledomains/";

  @primitiveTrait({
    name: "Server config url",
    type: "string",
    description: "URL of terriajs-server config (part of TerriaJS-Server)"
  })
  serverConfigUrl: string = "serverconfig/";

  @primitiveTrait({
    name: "Share url",
    type: "string",
    description: "URL of share service (part of TerriaJS-Server)"
  })
  shareUrl: string = "share";

  @primitiveTrait({
    name: "Feedback url",
    type: "string",
    description:
      'URL of the service used to send feedback. If not specified, the "Give Feedback" button will not appear.'
  })
  feedbackUrl?: string;

  @primitiveArrayTrait({
    name: "Init fragment paths",
    type: "string",
    description:
      'An array of base paths to use to try to use to resolve init fragments in the URL.  For example, if this property is `[ "init/", "http://example.com/init/"]`, then a URL with `#test` will first try to load `init/test.json` and, if that fails, next try to load `http://example.com/init/test.json`.'
  })
  initFragmentPaths: string[] = ["init/"];

  @primitiveTrait({
    name: "Story enabled",
    type: "boolean",
    description:
      "Whether the story is enabled. If false story function button won't be available."
  })
  storyEnabled: boolean = true;

  @primitiveTrait({
    name: "Intercept browser print",
    type: "boolean",
    description:
      "True (the default) to intercept the browser's print feature and use a custom one accessible through the Share panel."
  })
  interceptBrowserPrint?: boolean = true;

  @primitiveTrait({
    name: "Tabbed catalog",
    type: "boolean",
    description:
      "True to create a separate explorer panel tab for each top-level catalog group to list its items in."
  })
  tabbedCatalog: boolean = false;

  @primitiveTrait({
    name: "Use CesiumIon terrain",
    type: "string",
    description:
      'True to use Cesium World Terrain from Cesium ion. False to use terrain from the URL specified with the `"cesiumTerrainUrl"` property. If this property is false and `"cesiumTerrainUrl"` is not specified, the 3D view will use a smooth ellipsoid instead of a terrain surface. Defaults to true.'
  })
  useCesiumIonTerrain: boolean = true;

  @primitiveTrait({
    name: "Cesium terrain url",
    type: "string",
    description:
      'The URL to use for Cesium terrain in the 3D Terrain viewer, in quantized mesh format. This property is ignored if "useCesiumIonTerrain" is set to true.'
  })
  cesiumTerrainUrl?: string;

  @primitiveTrait({
    name: "Cesium terrain asset id",
    type: "string",
    description:
      'The Cesium Ion Asset ID to use for Cesium terrain in the 3D Terrain viewer. `cesiumIonAccessToken` will be used to authenticate. This property is ignored if "useCesiumIonTerrain" is set to true.'
  })
  cesiumTerrainAssetId?: number;

  @primitiveTrait({
    name: "CesiumIon access token",
    type: "string",
    description:
      'The access token to use with Cesium ion. If `"useCesiumIonTerrain"` is true and this property is not specified, the Cesium default Ion key will be used. It is a violation of the Ion terms of use to use the default key in a deployed application.'
  })
  cesiumIonAccessToken?: string;

  @primitiveTrait({
    name: "Use CesiumIon Bing imagery",
    type: "string",
    description:
      "True to use Bing Maps from Cesium ion (Cesium World Imagery). By default, Ion will be used, unless the `bingMapsKey` property is specified, in which case that will be used instead. To disable the Bing Maps layers entirely, set this property to false and set `bingMapsKey` to null."
  })
  useCesiumIonBingImagery?: boolean;

  @primitiveTrait({
    name: "Bing maps key",
    type: "string",
    description:
      "A [Bing Maps API key](https://msdn.microsoft.com/en-us/library/ff428642.aspx) used for requesting Bing Maps base maps and using the Bing Maps geocoder for searching. It is your responsibility to request a key and comply with all terms and conditions.",
    isNullable: true
  })
  bingMapsKey?: string | null;

  @primitiveTrait({
    name: "Hide Terria logo",
    type: "boolean",
    description: "Wheter to hide terria logo in credits."
  })
  hideTerriaLogo?: boolean;

  @primitiveArrayTrait({
    name: "Brand bar elements",
    type: "string",
    description:
      "An array of strings of HTML that fill up the top left logo space (see `brandBarSmallElements` or `displayOneBrand` for small screens)."
  })
  brandBarElements?: string[];

  @primitiveArrayTrait({
    name: "Brand bar small elements",
    type: "string",
    description:
      "An array of strings of HTML that fill up the top left logo space - used for small screens."
  })
  brandBarSmallElements?: string[];

  @primitiveTrait({
    name: "Display one brand",
    type: "number",
    description:
      "Index of which `brandBarElements` to show for mobile header. This will be used if `this.brandBarSmallElements` is undefined."
  })
  displayOneBrand: number = 0;

  @primitiveTrait({
    name: "Disable my location",
    type: "boolean",
    description:
      'True to disable the "Centre map at your current location" button.'
  })
  disableMyLocation: boolean = false;

  @primitiveTrait({
    name: "Disable splitter",
    type: "boolean",
    description: "True to disable the splitter tool."
  })
  disableSplitter: boolean = false;

  @primitiveTrait({
    name: "Disable pedestrian mode",
    type: "boolean",
    description: "True to disable the pedestrian tool."
  })
  disablePedestrianMode: boolean = false;

  @primitiveTrait({
    name: "Enable geojson MVT",
    type: "boolean",
    description:
      "Feature flag for experimental Geojson-Mapbox vector tiles. If falsy, all GeoJsonMixin items will render cesium primitives. If truthy, geojson-vt will be used to tile GeoJson into Mapbox vector-tiles."
  })
  enableGeojsonMvt: boolean = false;

  @primitiveTrait({
    name: "Experimental features",
    type: "boolean",
    description: "True to enable experimental features."
  })
  experimentalFeatures: boolean = false;

  @anyTrait({
    name: "MagdaReferenceHeaders",
    description: "True to disable the pedestrian tool."
  })
  magdaReferenceHeaders?: MagdaReferenceHeaders;

  @primitiveArrayTrait({
    name: "Location search bounding box",
    type: "number",
    description: "True to disable the pedestrian tool."
  })
  locationSearchBoundingBox?: number[];

  @primitiveTrait({
    name: "Google analytics key",
    type: "boolean",
    description:
      "A Google API key for [Google Analytics](https://analytics.google.com).  If specified, TerriaJS will send various events about how it's used to Google Analytics.",
    isNullable: true
  })
  googleAnalyticsKey?: string;

  @objectTrait({
    name: "Error service",
    type: ErrorServiceOptionsTraits,
    description: "Error service provider configuration."
  })
  errorService?: ErrorServiceOptionsTraits = undefined;

  @anyTrait({
    name: "Global disclaimer",
    description: ""
  })
  globalDisclaimer: any;

  @objectTrait({
    name: "Show welcome message",
    type: WelcomeMessageTraits,
    description: "True to display welcome message on startup."
  })
  welcomeMessage: WelcomeMessageTraits = new WelcomeMessageTraits();

  // TODO: make themeing TS
  @anyTrait({
    name: "Theme",
    description:
      "Theme overrides, this is applied in StandardUserInterface and merged in order of highest priority: `StandardUserInterface.jsx` `themeOverrides` prop -> `theme` config parameter (this object) -> default `terriaTheme` (see `StandardTheme.jsx`)"
  })
  theme: any = {};

  @primitiveTrait({
    name: "Show in app guides",
    type: "boolean",
    description: "True to display in-app guides."
  })
  showInAppGuides?: boolean = false;

  @objectTrait({
    name: "Help content",
    type: HelpContentTraits,
    description: "The content to be displayed in the help panel."
  })
  helpContent?: HelpContentTraits;

  @objectTrait({
    name: "Language configuration",
    type: LanguageConfigurationTraits,
    description: "Language configuration of TerriaJS.."
  })
  languageConfiguration?: LanguageConfigurationTraits;

  @anyTrait({
    name: "Custom request schedulerlimits",
    description:
      "Custom concurrent request limits for domains in Cesium's RequestScheduler. Cesium's default is 6 per domain (the maximum allowed by browsers unless the server supports http2). For servers supporting http2 try 12-24 to have more parallel requests. Setting this too high will undermine Cesium's prioritised request scheduling and important data may load slower. Format is {\"domain_without_protocol:port\": number}."
  })
  customRequestSchedulerLimits?: Record<string, number>;

  @primitiveTrait({
    name: "Persist viewer mode",
    type: "boolean",
    description: "Whether to load persisted viewer mode from local storage."
  })
  persistViewerMode: boolean = true;

  @primitiveTrait({
    name: "Open add data",
    type: "boolean",
    description: "Whether to open the add data explorer panel on load."
  })
  openAddData: boolean = false;

  @objectTrait({
    name: "Open add data",
    type: FeedbackTraits,
    description: "Whether to open the add data explorer panel on load."
  })
  feedback?: FeedbackTraits;

  @primitiveTrait({
    name: "Open add data",
    type: "boolean",
    description:
      "Extra links to show in the credit line at the bottom of the map (currently only the Cesium map)."
  })
  @objectArrayTrait({
    name: "Open add data",
    type: ExtraCreditLinksTraits,
    description: "Whether to open the add data explorer panel on load.",
    idProperty: "index"
  })
  extraCreditLinks?: ExtraCreditLinksTraits[] = [
    {
      text: "map.extraCreditLinks.dataAttribution",
      url: "about.html#data-attribution"
    },
    { text: "map.extraCreditLinks.disclaimer", url: "about.html#disclaimer" }
  ];
}

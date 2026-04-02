import URI from "urijs";
import { isJsonString, JsonArray, JsonObject } from "../Core/Json";
import loadJson5 from "../Core/loadJson5";
import Result from "../Core/Result";
import { TerriaErrorSeverity } from "../Core/TerriaError";
import { ProviderCoordsMap } from "../Map/PickedFeatures/PickedFeatures";
import { BaseMapsJson } from "./BaseMaps/BaseMapsModel";
import IElementConfig from "./IElementConfig";

export interface InitSourcePickedFeatures {
  providerCoords?: ProviderCoordsMap;
  pickCoords?: {
    lat: number;
    lng: number;
    height: number;
  };
  current?: {
    name?: string;
    hash?: number;
  };
  entities?: {
    name?: string;
    hash?: number;
  }[];
}

export type ViewModeJson = "3d" | "3dSmooth" | "2d";

/** Provides loose type hints for ModelJson */
export interface ModelJson extends JsonObject {
  localId?: string;
  name?: string;
  id?: string;
  type?: string;
  shareKeys?: string[];
  members?: (string | JsonObject)[];
}

export interface StoryData {
  title: string;
  text: string;
  id: string;
  shareData: ShareInitSourceData;
}
export interface ShareInitSourceData {
  version: string;
  /** Share data initSources can be a mix of initUrls (string) and initData (InitDataSource/JsonObject) */
  initSources: (InitSourceData | string)[];
}

export interface InitSourceData {
  stratum?: string;
  corsDomains?: string[];
  catalog?: JsonObject[];
  elements?: Map<string, IElementConfig>;
  stories?: StoryData[];
  viewerMode?: ViewModeJson;
  baseMaps?: BaseMapsJson;
  homeCamera?: JsonObject;
  /* Either a `CameraView` instance or a flag for focusing the camera on the workbench items */
  initialCamera?: JsonObject | { focusWorkbenchItems: boolean };
  showSplitter?: boolean;
  splitPosition?: number;
  workbench?: string[];
  timeline?: string[];
  models?: { [key: string]: ModelJson };
  previewedItemId?: string;
  pickedFeatures?: InitSourcePickedFeatures;
  /** These settings will override localStorage persistent settings. They are used for shares/stories */
  settings?: {
    baseMaximumScreenSpaceError?: number;
    useNativeResolution?: boolean;
    alwaysShowTimeline?: boolean;
    /** This is used to save basemap for shares/stories. Please use `InitSource.baseMaps.defaultBaseMapId` instead. */
    baseMapId?: string;
    terrainSplitDirection?: number;
    depthTestAgainstTerrainEnabled?: boolean;
    /** Check or uncheck "Share/Print -> Shorten the share URL using a web service".
     * See https://github.com/TerriaJS/terriajs/discussions/6848#discussioncomment-6798623 for a typical use case.
     * To disable the shortening url service, set it to false.
     */
    shortenShareUrls?: boolean;
  };
}

/**
 * An absolute or relative URL.
 */
interface InitSourceFromUrl extends InitSourceBase {
  initUrl: string;
}

export interface InitSourceFromData extends InitSourceBase {
  data: InitSourceData;
}

interface InitSourceFromDataPromise extends InitSourceBase {
  data: Promise<Result<InitSourceFromData | undefined>>;
}

interface InitSourceFromOptions extends InitSourceBase {
  options: InitSource[];
}

interface InitSourceBase {
  /** Name is only used for debugging purposes */
  name?: string;
  /** Severity to use for errors caught while loading/applying this initSource */
  errorSeverity?: TerriaErrorSeverity;
}

export type InitSource =
  | InitSourceFromUrl
  | InitSourceFromData
  | InitSourceFromOptions
  | InitSourceFromDataPromise;

export function isInitFromUrl(
  initSource: InitSource
): initSource is InitSourceFromUrl {
  return "initUrl" in initSource;
}

export function isInitFromData(
  initSource: InitSource
): initSource is InitSourceFromData {
  return (
    initSource &&
    "data" in initSource &&
    Object.prototype.toString.call(initSource.data) !== "[object Promise]"
  );
}

export function isInitFromDataPromise(
  initSource: any
): initSource is InitSourceFromDataPromise {
  return (
    initSource &&
    "data" in initSource &&
    Object.prototype.toString.call(initSource.data) === "[object Promise]"
  );
}

export function isInitFromOptions(
  initSource: InitSource
): initSource is InitSourceFromOptions {
  return "options" in initSource;
}

/**
 * Converts `config.initializationUrls` and `config.v7initializationUrls`
 * into an array of `InitSource` objects ready to be passed to
 * `terria.addInitSources()`.
 *
 * - `.json` URLs → `InitSourceFromUrl`
 * - Fragment names (no extension) → `InitSourceFromOptions` (tries each initFragmentPath)
 * - v7 URLs → `InitSourceFromDataPromise` (lazily converted via catalog-converter)
 */
export const buildInitSourcesFromConfig = (
  config: JsonObject,
  baseUri: URI,
  initFragmentPaths: string[]
): InitSource[] => {
  const initializationUrls: string[] = Array.isArray(config.initializationUrls)
    ? (config.initializationUrls as JsonArray).filter(isJsonString)
    : [];

  const initSources: InitSource[] = initializationUrls.map((url) => ({
    name: `Init URL from config ${url}`,
    errorSeverity: TerriaErrorSeverity.Error,
    ...generateInitFragmentSource(baseUri, initFragmentPaths, url)
  }));

  if (Array.isArray(config.v7initializationUrls)) {
    initSources.push(
      ...(config.v7initializationUrls as JsonArray)
        .filter(isJsonString)
        .map((v7initUrl) => ({
          name: `V7 Init URL from config ${v7initUrl}`,
          errorSeverity: TerriaErrorSeverity.Error,
          data: (async (): Promise<Result<InitSourceFromData | undefined>> => {
            try {
              const [{ convertCatalog }, catalog] = await Promise.all([
                import("catalog-converter"),
                loadJson5(v7initUrl)
              ]);
              const convert = convertCatalog(catalog, { generateIds: false });
              console.log(
                `WARNING: ${v7initUrl} is a v7 catalog - it has been upgraded to v8\nMessages:\n`
              );
              convert.messages.forEach(
                (message: { path: string[]; message: string }) =>
                  console.log(`- ${message.path.join(".")}: ${message.message}`)
              );
              return new Result({
                data: (convert.result as JsonObject | null) || {}
              } as InitSourceFromData);
            } catch (error) {
              return Result.error(error, {
                title: { key: "models.catalog.convertErrorTitle" },
                message: {
                  key: "models.catalog.convertErrorMessage",
                  parameters: { url: v7initUrl }
                }
              });
            }
          })()
        }))
    );
  }

  return initSources;
};

/**
 * Converts a single URL or fragment name into the appropriate InitSource shape:
 * - If the URL ends with `.json` → `InitSourceFromUrl` (resolved relative to baseUri)
 * - Otherwise → `InitSourceFromOptions` (one option per initFragmentPath, each resolved)
 */
export const generateInitFragmentSource = (
  baseUri: URI,
  initFragmentPaths: string[],
  url: string
): InitSource => {
  if (!url.toLowerCase().endsWith(".json")) {
    return {
      options: initFragmentPaths.map((fragmentPath) => ({
        initUrl: new URI(fragmentPath)
          .segment(url)
          .suffix("json")
          .absoluteTo(baseUri)
          .toString()
      }))
    };
  }
  return {
    initUrl: new URI(url).absoluteTo(baseUri).toString()
  };
};

export default InitSource;

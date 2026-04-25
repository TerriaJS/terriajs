import type { ShareResult } from "catalog-converter";
import URI from "urijs";
import JsonValue, {
  isJsonObject,
  isJsonString,
  JsonArray,
  JsonObject
} from "../Core/Json";
import loadJson5 from "../Core/loadJson5";
import Result from "../Core/Result";
import TerriaError, { TerriaErrorSeverity } from "../Core/TerriaError";
import { ProviderCoordsMap } from "../Map/PickedFeatures/PickedFeatures";
import { SHARE_VERSION } from "../ReactViews/Map/Panels/SharePanel/BuildShareLink";
import { BaseMapsJson } from "./BaseMaps/BaseMapsModel";
import { HashParams, parseHashParams } from "./HashParams";
import IElementConfig from "./IElementConfig";
import Terria from "./Terria";
import loadJson from "../Core/loadJson";

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
 * Converts raw share/start data (as loaded from the server or inline) into an
 * array of InitSource objects. Handles both v8 data and v7 data (via
 * catalog-converter).
 *
 */
export const convertStartData = async (
  startData: unknown,
  name: string,
  errorSeverity?: TerriaErrorSeverity,
  showConversionWarning?: (messages: ShareResult["messages"]) => void
): Promise<InitSource[]> => {
  if (!isJsonObject(startData, false)) return [];

  let v8Data: ShareInitSourceData | null;

  try {
    if (
      "version" in startData &&
      typeof startData.version === "string" &&
      startData.version.startsWith("0")
    ) {
      const { convertShare } = await import("catalog-converter");
      const result = convertShare(startData);
      if (result.converted) {
        showConversionWarning?.(result.messages);
      }
      v8Data = result.result;
    } else {
      const initSources = Array.isArray(startData.initSources)
        ? startData.initSources.filter(
            (s) => isJsonString(s) || isJsonObject(s)
          )
        : [];

      const version = isJsonString(startData.version)
        ? startData.version
        : SHARE_VERSION;

      v8Data = { version, initSources };
    }
  } catch (error) {
    throw TerriaError.from(error, {
      title: { key: "share.convertErrorTitle" },
      message: { key: "share.convertErrorMessage" }
    });
  }

  if (v8Data === null || !Array.isArray(v8Data.initSources)) return [];

  return v8Data.initSources.map((initSource) =>
    isJsonString(initSource)
      ? ({ name, initUrl: initSource, errorSeverity } as InitSource)
      : ({ name, data: initSource, errorSeverity } as InitSource)
  );
};

/**
 * Converts `config.initializationUrls` and `config.v7initializationUrls`
 * into an array of `InitSource` objects ready to be passed to
 * `terria.addInitSources()`.
 *
 * - `.json` URLs → `InitSourceFromUrl`
 * - Fragment names (no extension) → `InitSourceFromOptions` (tries each initFragmentPath)
 * - v7 URLs → `InitSourceFromDataPromise` (lazily converted via catalog-converter)
 */
export const buildInitSourcesFromConfig = (options: {
  initializationUrls?: JsonValue | undefined;
  v7initializationUrls?: JsonValue | undefined;
  baseUri: URI;
  initFragmentPaths: string[];
}): InitSource[] => {
  const initializationUrls: string[] = Array.isArray(options.initializationUrls)
    ? (options.initializationUrls as JsonArray).filter(isJsonString)
    : [];

  const initSources: InitSource[] = initializationUrls.map((url) => ({
    name: `Init URL from config ${url}`,
    errorSeverity: TerriaErrorSeverity.Error,
    ...generateInitFragmentSource(
      options.baseUri,
      options.initFragmentPaths,
      url
    )
  }));

  if (Array.isArray(options.v7initializationUrls)) {
    initSources.push(
      ...(options.v7initializationUrls as JsonArray)
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

const checkSegments = (urlSegments: string[], customRoute: string) => {
  // Accept /${customRoute}/:some-id/ or /${customRoute}/:some-id
  return (
    ((urlSegments.length === 3 && urlSegments[2] === "") ||
      urlSegments.length === 2) &&
    urlSegments[0] === customRoute &&
    urlSegments[1].length > 0
  );
};

export const buildInitSourcesFromStartData = async (
  start: HashParams["start"] | undefined
): Promise<InitSource[]> => {
  if (!start) return [];

  const initSourcesFromStart = await convertStartData(
    start,
    'Start data from hash `"#start"` value',
    TerriaErrorSeverity.Error
  );
  return initSourcesFromStart;
};

export const buildInitSourcesFromShare = async (
  shareToken: string | undefined,
  shareDataService: Terria["shareDataService"]
): Promise<InitSource[]> => {
  if (!shareToken || !shareDataService) return [];
  const shareProps = await shareDataService.resolveData(shareToken);
  const sources = await convertStartData(
    shareProps,
    `Start data from sharelink \`"${shareToken}"\``,
    TerriaErrorSeverity.Error
  );
  return sources;
};

export const buildInitSourcesFromUrlFragments = async (
  url: string,
  initFragments: HashParams["initFragments"],
  initFragmentPaths: string[]
): Promise<InitSource[]> => {
  const initSources: InitSource[] = [];

  initFragments?.forEach((fragment) => {
    const fragmentSource = generateInitFragmentSource(
      new URI(url).filename("").query("").hash(""),
      initFragmentPaths,
      fragment
    );
    initSources.push({
      name: `InitUrl from applicationURL hash ${fragment}`,
      errorSeverity: TerriaErrorSeverity.Error,
      ...fragmentSource
    });
  });

  return initSources;
};

export const buildInitSourcesFromSpaRoutes = async (
  url: string,
  storyRouteUrlPrefix: string | undefined
): Promise<InitSource[]> => {
  const initSources: InitSource[] = [];

  // SPA route: /catalog/:id and /story/:id
  const segments = url.split("/").filter((s) => s.length > 0);

  if (checkSegments(segments, "catalog")) {
    initSources.push({
      name: `Go to ${url}`,
      errorSeverity: TerriaErrorSeverity.Error,
      data: {
        previewedItemId: decodeURIComponent(segments[1])
      }
    } as InitSourceFromData & {
      name: string;
      errorSeverity: TerriaErrorSeverity;
    });
  } else if (
    checkSegments(segments, "story") &&
    storyRouteUrlPrefix !== undefined
  ) {
    let storyJson;
    try {
      storyJson = await loadJson(`${storyRouteUrlPrefix}${segments[1]}`);
    } catch (e) {
      throw TerriaError.from(e, {
        message: `Failed to fetch story "${segments[1]}"`
      });
    }
    const sources = await convertStartData(
      storyJson,
      `Start data from story "${segments[1]}"`,
      TerriaErrorSeverity.Error
    );
    initSources.push(...sources);
    // userProperties.set("playStory", "1");
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

export const updateInitSourcesFromUrl = async (
  url: string,
  baseUrl: string,
  terria: Terria
): Promise<void> => {
  const hashParams = parseHashParams(url);

  const fromUrl = await buildInitSourcesFromUrlFragments(
    url,
    hashParams.initFragments,
    terria.configParameters.initFragmentPaths
  );
  const fromStartData = await buildInitSourcesFromStartData(hashParams.start);
  const fromShare = await buildInitSourcesFromShare(
    hashParams.share,
    terria.shareDataService
  );

  const fromSpaRoutes = await buildInitSourcesFromSpaRoutes(
    url.replace(baseUrl, ""),
    terria.configParameters.storyRouteUrlPrefix
  );

  const initSources = [
    ...fromUrl,
    ...fromStartData,
    ...fromShare,
    ...fromSpaRoutes
  ];
  terria.addInitSources(initSources);
};

export default InitSource;

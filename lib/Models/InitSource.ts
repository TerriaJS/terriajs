import i18next from "i18next";
import { runInAction } from "mobx";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import URI from "urijs";
import isDefined from "../Core/isDefined";
import {
  isJsonObject,
  isJsonObjectArray,
  isJsonString,
  isJsonStringArray,
  JsonObject
} from "../Core/Json";
import loadJson from "../Core/loadJson";
import loadJson5 from "../Core/loadJson5";
import Result from "../Core/Result";
import TerriaError, { TerriaErrorSeverity } from "../Core/TerriaError";
import { ProviderCoordsMap } from "../Map/PickedFeatures/PickedFeatures";
import { SHARE_VERSION } from "../ReactViews/Map/Panels/SharePanel/BuildShareLink";
import { shareConvertNotification } from "../ReactViews/Notification/shareConvertNotification";
import { BaseMapsJson } from "./BaseMaps/BaseMapsModel";
import IElementConfig from "./IElementConfig";
import Terria from "./Terria";
import { TerriaConfig } from "./TerriaConfig";

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
  initSources: InitSourceData[];
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
  initialCamera?: JsonObject;
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

/** Create InitSources for initializationUrls (pushed to terria.initSources) */
export function addInitSourcesFromConfig(
  terria: Terria,
  baseUri: uri.URI,
  config: JsonObject | TerriaConfig
) {
  const initializationUrls: string[] = isJsonStringArray(
    config?.initializationUrls
  )
    ? config?.initializationUrls
    : [];
  const initSources: InitSource[] = initializationUrls.map(url => ({
    name: `Init URL from config ${url}`,
    errorSeverity: TerriaErrorSeverity.Error,
    ...generateInitializationUrl(
      baseUri,
      terria.configParameters.initFragmentPaths,
      url
    )
  }));

  // look for v7 catalogs -> push v7-v8 conversion to initSources
  if (isJsonStringArray(config?.v7initializationUrls)) {
    initSources.push(
      ...config.v7initializationUrls.map(v7initUrl => ({
        name: `V7 Init URL from config ${v7initUrl}`,
        errorSeverity: TerriaErrorSeverity.Error,
        data: (async () => {
          try {
            const [{ convertCatalog }, catalog] = await Promise.all([
              import("catalog-converter"),
              loadJson5(v7initUrl)
            ]);
            const convert = convertCatalog(catalog, { generateIds: false });
            console.log(
              `WARNING: ${v7initUrl} is a v7 catalog - it has been upgraded to v8\nMessages:\n`
            );
            convert.messages.forEach(message =>
              console.log(`- ${message.path.join(".")}: ${message.message}`)
            );
            return new Result({
              data: (convert.result as JsonObject | null) || {}
            });
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
  terria.initSources.push(...initSources);
}

/** Create InitSources from hash properties (pushed to terria.initSources) */
async function interpretHash(
  terria: Terria,
  hashProperties: any,
  userProperties: Map<string, any>,
  baseUri: uri.URI
) {
  if (isDefined(hashProperties.clean)) {
    runInAction(() => {
      terria.initSources.splice(0, terria.initSources.length);
    });
  }

  runInAction(() => {
    Object.keys(hashProperties).forEach(function(property) {
      if (["clean", "hideWelcomeMessage", "start", "share"].includes(property))
        return;
      const propertyValue = hashProperties[property];
      if (isDefined(propertyValue) && propertyValue.length > 0) {
        userProperties.set(property, propertyValue);
      } else {
        const initSourceFile = generateInitializationUrl(
          baseUri,
          terria.configParameters.initFragmentPaths,
          property
        );
        terria.initSources.push({
          name: `InitUrl from applicationURL hash ${property}`,
          errorSeverity: TerriaErrorSeverity.Error,
          ...initSourceFile
        });
      }
    });
  });

  if (isDefined(hashProperties.hideWelcomeMessage)) {
    terria.configParameters.showWelcomeMessage = false;
  }

  // a share link that hasn't been shortened: JSON embedded in URL (only works for small quantities of JSON)
  if (isDefined(hashProperties.start)) {
    try {
      const startData = JSON.parse(hashProperties.start);
      await addInitSourcesFromStartData(
        terria,
        startData,
        'Start data from hash `"#start"` value',
        TerriaErrorSeverity.Error,
        false // Hide conversion warning message - as we assume that people using #start are embedding terria.
      );
    } catch (e) {
      throw TerriaError.from(e, {
        message: { key: "models.terria.parsingStartDataErrorMessage" },
        importance: -1
      });
    }
  }

  // Resolve #share=xyz with the share data service.
  if (
    hashProperties.share !== undefined &&
    terria.shareDataService !== undefined
  ) {
    const shareProps = await terria.shareDataService.resolveData(
      hashProperties.share
    );

    await addInitSourcesFromStartData(
      terria,
      shareProps,
      `Start data from sharelink \`"${hashProperties.share}"\``
    );
  }
}

/** Push startData to terria.initSources */
export async function addInitSourcesFromStartData(
  terria: Terria,
  startData: unknown,
  /** Name for startData initSources - this is only used for debugging purposes */
  name: string,
  /** Error severity to use for loading startData init sources - if not set, TerriaError will be propagated normally */
  errorSeverity?: TerriaErrorSeverity,
  showConversionWarning = true
) {
  const containsStory = (initSource: InitSourceData) =>
    Array.isArray(initSource.stories) && initSource.stories.length;
  if (isJsonObject(startData, false)) {
    // Convert startData to v8 if necessary
    let startDataV8: ShareInitSourceData | null;

    try {
      if (
        // If startData.version has version 0.x.x - user catalog-converter to convert startData
        "version" in startData &&
        typeof startData.version === "string" &&
        startData.version.startsWith("0")
      ) {
        const { convertShare } = await import("catalog-converter");
        const result = convertShare(startData);

        // Show warning messages if converted
        if (result.converted && showConversionWarning) {
          terria.notificationState.addNotificationToQueue({
            title: i18next.t("share.convertNotificationTitle"),
            message: shareConvertNotification(result.messages)
          });
        }
        startDataV8 = result.result;
      } else {
        startDataV8 = {
          ...startData,
          version: isJsonString(startData.version)
            ? startData.version
            : SHARE_VERSION,
          initSources: isJsonObjectArray(startData.initSources)
            ? startData.initSources
            : []
        };
      }

      if (startDataV8 !== null && Array.isArray(startDataV8.initSources)) {
        runInAction(() => {
          terria.initSources.push(
            ...startDataV8!.initSources.map((initSource: unknown) => {
              return {
                name,
                data: isJsonObject(initSource, false) ? initSource : {},
                errorSeverity
              };
            })
          );
        });
        if (startDataV8.initSources.some(containsStory)) {
          terria.configParameters.showWelcomeMessage = false;
        }
      }
    } catch (error) {
      throw TerriaError.from(error, {
        title: { key: "share.convertErrorTitle" },
        message: { key: "share.convertErrorMessage" }
      });
    }
  }
}

export async function addInitSourcesFromUrl(terria: Terria, url: string) {
  const uri = new URI(url);
  const hash = uri.fragment();
  const hashProperties = queryToObject(hash);

  await interpretHash(
    terria,
    hashProperties,
    terria.userProperties,
    new URI(url)
      .filename("")
      .query("")
      .hash("")
  );

  if (!terria.appBaseHref.endsWith("/")) {
    console.warn(
      `Terria expected appBaseHref to end with a "/" but appBaseHref is "${terria.appBaseHref}". Routes may not work as intended. To fix this, try setting the "--baseHref" parameter to a URL with a trailing slash while building your map, or constructing the Terria object with an appropriate appBaseHref (with trailing slash).`
    );
  }

  // /catalog/ and /story/ routes
  if (url.startsWith(terria.appBaseHref)) {
    function checkSegments(urlSegments: string[], customRoute: string) {
      // Accept /${customRoute}/:some-id/ or /${customRoute}/:some-id
      return (
        ((urlSegments.length === 3 && urlSegments[2] === "") ||
          urlSegments.length === 2) &&
        urlSegments[0] === customRoute &&
        urlSegments[1].length > 0
      );
    }
    const pageUrl = new URL(url);
    // Find relative path from baseURI to documentURI excluding query and hash
    // then split into url segments
    // e.g. "http://ci.terria.io/main/story/1#map=2d" -> ["story", "1"]
    const segments = (pageUrl.origin + pageUrl.pathname)
      .slice(terria.appBaseHref.length)
      .split("/");
    if (checkSegments(segments, "catalog")) {
      terria.initSources.push({
        name: `Go to ${pageUrl.pathname}`,
        errorSeverity: TerriaErrorSeverity.Error,
        data: {
          previewedItemId: decodeURIComponent(segments[1])
        }
      });
      const replaceUrl = new URL(url);
      replaceUrl.pathname = new URL(terria.appBaseHref).pathname;
      history.replaceState({}, "", replaceUrl.href);
    } else if (
      checkSegments(segments, "story") &&
      isDefined(terria.configParameters.storyRouteUrlPrefix)
    ) {
      let storyJson;
      try {
        storyJson = await loadJson(
          `${terria.configParameters.storyRouteUrlPrefix}${segments[1]}`
        );
      } catch (e) {
        throw TerriaError.from(e, {
          message: `Failed to fetch story \`"${terria.appName}/${segments[1]}"\``
        });
      }
      await addInitSourcesFromStartData(
        terria,
        storyJson,
        `Start data from story \`"${terria.appName}/${segments[1]}"\``
      );
      runInAction(() => terria.userProperties.set("playStory", "1"));
    }
  }
}

function generateInitializationUrl(
  baseUri: uri.URI,
  initFragmentPaths: string[],
  url: string
): InitSource {
  if (url.toLowerCase().substring(url.length - 5) !== ".json") {
    return {
      options: initFragmentPaths.map(fragmentPath => {
        return {
          initUrl: new URI(fragmentPath)
            .segment(url)
            .suffix("json")
            .absoluteTo(baseUri)
            .toString()
        };
      })
    };
  }
  return {
    initUrl: new URI(url).absoluteTo(baseUri).toString()
  };
}

export default InitSource;

import { JsonObject } from "../Core/Json";
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

export default InitSource;

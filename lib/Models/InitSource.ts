import { JsonObject } from "../Core/Json";
import Result from "../Core/Result";
import { TerriaErrorSeverity } from "../Core/TerriaError";
import { ProviderCoordsMap } from "../Map/PickedFeatures/PickedFeatures";
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

export interface ModelJson extends JsonObject {
  localId?: string;
  name?: string;
  id?: string;
  type?: string;
  shareKeys?: string[];
  members?: string[];
}

export interface InitSourceData {
  stratum?: string;
  corsDomains?: string[];
  catalog?: JsonObject;
  elements?: Map<string, IElementConfig>;
  stories?: JsonObject[];
  viewerMode?: ViewModeJson;
  baseMaps?: JsonObject;
  homeCamera?: JsonObject;
  initialCamera?: JsonObject;
  showSplitter?: boolean;
  splitPosition?: number;
  workbench?: string[];
  timeline?: string[];
  models?: { [key: string]: ModelJson };
  previewedItemId?: string;
  pickedFeatures?: InitSourcePickedFeatures;
}
/**
 * An absolute or relative URL.
 */
interface InitSourceFromUrl {
  initUrl: string;
}

interface InitSourceFromData {
  data: InitSourceData;
}

type InitSourceFromDataPromise = {
  data: Promise<Result<InitSourceFromData | undefined>>;
};

interface InitSourceFromOptions {
  options: InitSource[];
}

type InitSource = {
  /** Name is only used for debugging purposes */
  name?: string;
  /** Severity to use for errors caught while loading/applying this initSource */
  errorSeverity?: TerriaErrorSeverity;
} & (
  | InitSourceFromUrl
  | InitSourceFromData
  | InitSourceFromOptions
  | InitSourceFromDataPromise
);

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

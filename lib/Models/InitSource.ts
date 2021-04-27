import { JsonObject } from "../Core/Json";
import Result from "../Core/Result";
import { TerriaErrorSeverity } from "../Core/TerriaError";

/**
 * An absolute or relative URL.
 */
interface InitUrl {
  initUrl: string;
}

interface InitData {
  data: JsonObject;
}

type InitDataPromise = {
  data: Promise<Result<InitData | undefined>>;
};

interface InitOptions {
  options: InitSource[];
}

export const INIT_SOURCE_DEFAULT_ERROR_SEVERITY = TerriaErrorSeverity.Error;

type InitSource = {
  /** Name is only used for debugging purposes */

  name?: string;
  /** Which severity should errors be displayed as (will default to INIT_SOURCE_DEFAULT_ERROR_SEVERITY) */
  errorSeverity?: TerriaErrorSeverity;
} & (InitUrl | InitData | InitOptions | InitDataPromise);

export function isInitUrl(initSource: InitSource): initSource is InitUrl {
  return "initUrl" in initSource;
}

export function isInitData(initSource: InitSource): initSource is InitData {
  return (
    initSource &&
    "data" in initSource &&
    Object.prototype.toString.call(initSource.data) !== "[object Promise]"
  );
}

export function isInitDataPromise(
  initSource: any
): initSource is InitDataPromise {
  return (
    initSource &&
    "data" in initSource &&
    Object.prototype.toString.call(initSource.data) === "[object Promise]"
  );
}

export function isInitOptions(
  initSource: InitSource
): initSource is InitOptions {
  return "options" in initSource;
}

export default InitSource;

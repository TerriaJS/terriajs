import { JsonObject } from "../Core/Json";
import Result from "../Core/Result";

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

type InitSource = { name?: string } & (
  | InitUrl
  | InitData
  | InitOptions
  | InitDataPromise
);

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

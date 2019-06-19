import { JsonObject } from "../Core/Json";

/**
 * An absolute or relative URL.
 */
interface InitUrl {
  initUrl: string;
}

interface InitData {
  data: JsonObject;
}

interface InitOptions {
  options: InitSource[];
}

type InitSource = InitUrl | InitData | InitOptions;

export function isInitUrl(initSource: InitSource): initSource is InitUrl {
  return "initUrl" in initSource;
}

export function isInitOptions(
  initSource: InitSource
): initSource is InitOptions {
  return "options" in initSource;
}

export default InitSource;

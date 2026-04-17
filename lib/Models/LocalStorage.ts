import { defined } from "terriajs-cesium";
import { TerriaConfig } from "./TerriaConfig";
import { untracked } from "mobx";

export class LocalStorage {
  constructor(private readonly _config: TerriaConfig) {}

  getItem(key: string): boolean | string | null {
    try {
      if (!defined(window.localStorage)) {
        return null;
      }
    } catch (_e) {
      // SecurityError can arise if 3rd party cookies are blocked in Chrome and we're served in an iFrame
      return null;
    }
    const appName = untracked(() => this._config.appName);
    const v = window.localStorage.getItem(appName + "." + key);
    if (v === "true") {
      return true;
    } else if (v === "false") {
      return false;
    }
    return v;
  }

  setItem(key: string, value: boolean | number | string): boolean {
    try {
      if (!defined(window.localStorage)) {
        return false;
      }
    } catch (_e) {
      // SecurityError can arise if 3rd party cookies are blocked in Chrome and we're served in an iFrame
      return false;
    }
    const appName = untracked(() => this._config.appName);
    window.localStorage.setItem(appName + "." + key, String(value));
    return true;
  }
}

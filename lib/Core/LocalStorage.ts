import isDefined from "./isDefined";

export class LocalStorage {
  constructor(private readonly _prefix: string) {}

  getItem(key: string): boolean | string | null {
    try {
      if (!isDefined(window.localStorage)) {
        return null;
      }
    } catch (_e) {
      // SecurityError can arise if 3rd party cookies are blocked in Chrome and we're served in an iFrame
      return null;
    }
    const prefix = this._prefix;
    const v = window.localStorage.getItem(prefix + "." + key);
    if (v === "true") {
      return true;
    } else if (v === "false") {
      return false;
    }
    return v;
  }

  setItem(key: string, value: boolean | number | string): boolean {
    try {
      if (!isDefined(window.localStorage)) {
        return false;
      }
    } catch (_e) {
      // SecurityError can arise if 3rd party cookies are blocked in Chrome and we're served in an iFrame
      return false;
    }
    const prefix = this._prefix;
    window.localStorage.setItem(prefix + "." + key, String(value));
    return true;
  }
}

import i18next from "i18next";
import { isJsonObject, JsonObject } from "../Core/Json";
import loadJson from "../Core/loadJson";
import loadWithXhr from "../Core/loadWithXhr";
import TerriaError from "../Core/TerriaError";
import { StartData } from "./InitSource";
import Terria from "./Terria";

export const DEFAULT_MAX_SHARE_SIZE_BYTES = 200 * 1024; // 200 KB
export const DEFAULT_MAX_SHARE_SIZE = "200kb";

export interface IShareDataService {
  /**
   * @deprecated Use the constructor instead. This method is kept for backwards compatibility.
   */
  init(params: {
    sharePrefix?: string;
    shareMaxRequestSize?: string;
    shareMaxRequestSizeBytes?: number;
  }): void;
  getShareToken: (shareData: StartData) => Promise<string>;
  resolveData: (token: string) => Promise<JsonObject>;

  get isUsable(): boolean;
  get shareMaxRequestSize(): string | undefined;
  get shareMaxRequestSizeBytes(): number | undefined;
}

interface ShareDataServiceOptions {
  terria: Terria;
  url?: string;
  sharePrefix?: string;
  shareMaxRequestSize?: string;
  shareMaxRequestSizeBytes?: number;
}

/**
 * Interface to the terriajs-server service for creating short share links.
 */
export default class ShareDataService implements IShareDataService {
  readonly terria: Terria;
  url: string | undefined;
  private _sharePrefix?: string;
  private _shareMaxRequestSize?: string;
  private _shareMaxRequestSizeBytes?: number;

  constructor(options: ShareDataServiceOptions) {
    this.terria = options.terria;
    this.url = options.url;
    this._sharePrefix = options.sharePrefix;
    this._shareMaxRequestSize = options.shareMaxRequestSize;
    this._shareMaxRequestSizeBytes = options.shareMaxRequestSizeBytes;
  }

  /**
   * @deprecated Use the constructor instead. This method is kept for backwards compatibility.
   */
  init(params: {
    sharePrefix?: string;
    shareMaxRequestSize?: string;
    shareMaxRequestSizeBytes?: number;
  }) {
    this.url ??= this.terria.configParameters.shareUrl ?? "share";
    this._sharePrefix ??= params.sharePrefix;

    this._shareMaxRequestSize ??=
      params.shareMaxRequestSize ?? DEFAULT_MAX_SHARE_SIZE;
    this._shareMaxRequestSizeBytes ??=
      params.shareMaxRequestSizeBytes ?? DEFAULT_MAX_SHARE_SIZE_BYTES;
  }

  get isUsable(): boolean {
    return (
      (this.url !== undefined && typeof this._sharePrefix === "string") ||
      this.url !== "share"
    );
  }

  get shareMaxRequestSize(): string | undefined {
    return this._shareMaxRequestSize;
  }

  get shareMaxRequestSizeBytes(): number | undefined {
    return this._shareMaxRequestSizeBytes;
  }

  /**
   * Allocates a share token using Terria Server, storing the provided data there.
   * @param shareData JSON to store.
   * @return A promise for the token (which can later be resolved at /share/TOKEN).
   */
  async getShareToken(shareData: StartData): Promise<string> {
    if (!this.isUsable || !this.url) {
      throw TerriaError.from("`ShareDataService` is not usable");
    }

    try {
      const result = await loadWithXhr({
        url: this.url,
        method: "POST",
        data: JSON.stringify(shareData),
        headers: {
          "Content-Type": "application/json",
          ...(await this.terria.configParameters.shareRequestHeaders?.())
        },
        responseType: "json"
      });
      const json = typeof result === "string" ? JSON.parse(result) : result;
      return json.id;
    } catch (error) {
      throw TerriaError.from(error, {
        title: i18next.t("models.shareData.generateErrorTitle"),
        message: i18next.t("models.shareData.generateErrorMessage"),
        importance: 1
      });
    }
  }

  async resolveData(token: string): Promise<JsonObject> {
    if (!this.isUsable) {
      throw TerriaError.from("`ShareDataService` is not usable");
    }

    try {
      const shareJson = await loadJson(this.url + "/" + token);

      if (!isJsonObject(shareJson, false)) {
        throw TerriaError.from(
          `Invalid server response for share ${
            this.url + "/" + token
          }\n\`${JSON.stringify(shareJson)}\``
        );
      }

      return shareJson;
    } catch (e: any) {
      const error: Error & { statusCode?: number } = e || {};
      if (error.statusCode === 404) {
        throw TerriaError.from(error, {
          title: i18next.t("models.shareData.shareNotFoundTitle"),
          message: i18next.t("models.shareData.shareNotFoundMessage"),
          importance: 1
        });
      }

      throw TerriaError.from(error, {
        title: i18next.t("models.shareData.expandErrorTitle"),
        message: i18next.t("models.shareData.expandErrorMessage", {
          appName: this.terria.appName
        }),
        importance: 1
      });
    }
  }
}

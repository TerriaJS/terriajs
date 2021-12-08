import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import { JsonObject } from "../Core/Json";
import loadJson from "../Core/loadJson";
import loadWithXhr from "../Core/loadWithXhr";
import TerriaError from "../Core/TerriaError";
import Terria from "./Terria";
import i18next from "i18next";

interface ShareDataServiceOptions {
  terria: Terria;
  url?: string;
}

/**
 * Interface to the terriajs-server service for creating short share links.
 * @param {*} options
 *
 * @alias ShareDataService
 * @constructor
 */
export default class ShareDataService {
  readonly terria: Terria;
  url: string | undefined;
  private _serverConfig: any;

  constructor(options: ShareDataServiceOptions) {
    this.terria = options.terria;
    this.url = options.url;
  }

  init(serverConfig: any) {
    this.url = defaultValue(
      this.url,
      defaultValue(this.terria.configParameters.shareUrl, "share")
    );

    this._serverConfig = serverConfig;
  }

  get isUsable(): boolean {
    return (
      (this.url !== undefined &&
        typeof this._serverConfig === "object" &&
        typeof this._serverConfig.newShareUrlPrefix === "string") ||
      this.url !== "share"
    );
  }

  /**
   * Allocates a share token using Terria Server, storing the provided data there.
   * @param shareData JSON to store.
   * @return A promise for the token (which can later be resolved at /share/TOKEN).
   */
  getShareToken(shareData: any): Promise<string> {
    if (!this.isUsable) {
      throw new DeveloperError("ShareDataService is not usable.");
    }

    return loadWithXhr({
      url: this.url,
      method: "POST",
      data: JSON.stringify(shareData),
      headers: { "Content-Type": "application/json" },
      responseType: "json"
    })
      .then((result: string | JsonObject) => {
        const json = typeof result === "string" ? JSON.parse(result) : result;
        return json.id;
      })
      .catch((error: any) => {
        console.log(error);
        this.terria.raiseErrorToUser(
          new TerriaError({
            title: i18next.t("models.shareData.generateErrorTitle"),
            message: i18next.t("models.shareData.generateErrorMessage")
          })
        );
      });
  }

  resolveData(token: string): Promise<JsonObject | undefined> {
    if (!this.isUsable) {
      throw new DeveloperError("ShareDataService is not usable because ###");
    }

    return loadJson(this.url + "/" + token).catch(() => {
      this.terria.raiseErrorToUser(
        new TerriaError({
          title: i18next.t("models.shareData.expandErrorTitle"),
          message: i18next.t("models.shareData.expandErrorMessage", {
            appName: this.terria.appName
          })
        })
      );

      return undefined;
    });
  }
}

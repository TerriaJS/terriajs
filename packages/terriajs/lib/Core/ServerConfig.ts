import i18next from "i18next";
import loadJson from "./loadJson";

import type { ServerConfigResponse } from "terriajs-server";

const DEFAULT_URL = "serverconfig/";

export interface IServerConfig {
  config: ServerConfigResponse | undefined;
  init(
    serverConfigUrl: string | undefined
  ): Promise<ServerConfigResponse | undefined>;
}

/**
 * Provides information about the configuration of the Terria server, by querying /serverconfig
 */
class ServerConfig implements IServerConfig {
  /**
   * Contains configuration information retrieved from the server. The attributes are defined by TerriaJS-Server but include:
   *   version: current version of server
   *   proxyAllDomains: whether all domains can be proxied
   *   allowProxyFrom: array of domains that can be proxied
   *   maxConversionSize: maximum size, in bytes, of files that can be uploaded to conversion service
   *   newShareUrlPrefix: if defined, the share URL service is active
   *   shareUrlPrefixes: object defining share URL prefixes that can be resolved
   *   additionalFeedbackParameters: array of additional feedback parameters that can be used
   */
  config: ServerConfigResponse | undefined = undefined;

  private _serverConfigUrl?: string;

  /**
   * Initialises the object by fetching the configuration from the server. Note
   * that if the request to get config from the proxy server fails, an error is
   * logged and nothing else happens.
   *
   * @param  serverConfigUrl Optional override URL.
   * @return Promise that resolves to the configuration object itself.
   */
  async init(
    serverConfigUrl: string | undefined
  ): Promise<ServerConfigResponse | undefined> {
    if (this.config !== undefined) {
      return Promise.resolve(this.config);
    }
    this._serverConfigUrl = serverConfigUrl ?? DEFAULT_URL;

    try {
      this.config = await loadJson(this._serverConfigUrl);
      return this.config;
    } catch {
      console.error(
        i18next.t("core.serverConfig.failedToGet", {
          serverConfigUrl: this._serverConfigUrl
        })
      );
    }
  }
}

export default ServerConfig;

import i18next from "i18next";
import loadJson from "./loadJson";

const DEFAULT_URL = "serverconfig/";

/**
 * Provides information about the configuration of the Terria server, by querying /serverconfig
 */
class ServerConfig {
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
  config: unknown;

  serverConfigUrl?: string;

  /**
   * Initialises the object by fetching the configuration from the server. Note
   * that if the request to get config from the proxy server fails, an error is
   * logged and nothing else happens.
   *
   * @param  serverConfigUrl Optional override URL.
   * @return Promise that resolves to the configuration object itself.
   */
  async init(serverConfigUrl: string) {
    if (this.config !== undefined) {
      return Promise.resolve(this.config);
    }
    this.serverConfigUrl = serverConfigUrl ?? DEFAULT_URL;

    try {
      this.config = await loadJson(this.serverConfigUrl);
      return this.config;
    } catch {
      console.error(
        i18next.t("core.serverConfig.failedToGet", {
          serverConfigUrl: this.serverConfigUrl
        })
      );
    }
  }
}

export default ServerConfig;

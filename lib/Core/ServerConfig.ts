import i18next from "i18next";
import loadJson from "./loadJson";

const DEFAULT_URL = "serverconfig/";

/**
 * Provides information about the configuration of the Terria server, by querying /serverconfig
 */
export class ServerConfig {
  /**
   * Contains configuration information retrieved from the server. The attributes are defined by TerriaJS-Server but include:
   *   version: current version of server
   *   proxyAllDomains: whether all domains can be proxied
   *   allowProxyFor: array of domains that can be proxied
   *   newShareUrlPrefix: if defined, the share URL service is active
   *   shareUrlPrefixes: object defining share URL prefixes that can be resolved
   *   additionalFeedbackParameters: array of additional feedback parameters that can be used
   */
  config:
    | {
        version: string;
        proxyAllDomains?: boolean;
        allowProxyFor?: string[];
        newShareUrlPrefix?: string;
        shareUrlPrefixes?: Record<string, string>;
        shareMaxRequestSize?: string;
        shareMaxRequestSizeBytes?: number;
        additionalFeedbackParameters?: {
          name: string;
          descriptiveLabel: string;
        }[];
      }
    | undefined = undefined;

  serverConfigUrl?: string;

  /**
   * Initialises the object by fetching the configuration from the server. Note
   * that if the request to get config from the proxy server fails, an error is
   * logged and nothing else happens.
   *
   * @param  serverConfigUrl Optional override URL.
   * @return Promise that resolves to the configuration object itself.
   */
  async init(serverConfigUrl: string = DEFAULT_URL) {
    if (this.config !== undefined) {
      return Promise.resolve(this.config);
    }
    this.serverConfigUrl = serverConfigUrl;

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

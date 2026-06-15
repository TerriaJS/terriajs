import URI from "urijs";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import { JsonObject, isJsonObject } from "../Core/Json";
import TerriaError from "../Core/TerriaError";
import loadJson5 from "../Core/loadJson5";

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/**
 * Default `StartOptions.loadConfig` implementation: fetches and parses the
 * config (JSON5) at `configUrl` and derives the base URI.
 *
 * @experimental - not ready for general consumption!
 */
export const defaultLoadConfig = async (
  configUrl: string,
  configUrlHeaders?: { [key: string]: string }
): Promise<{ config: JsonObject; baseUri: URI; configUrl: string }> => {
  const hashProperties =
    typeof window !== "undefined"
      ? queryToObject(new URI(window.location).fragment())
      : {};

  // If in development environment, allow usage of #configUrl to set Terria config URL
  if (IS_DEVELOPMENT) {
    if (hashProperties["configUrl"] && hashProperties["configUrl"] !== "")
      configUrl = hashProperties["configUrl"];
  }

  const baseUri = new URI(configUrl).filename("");

  const config = await loadJson5(configUrl, configUrlHeaders);
  if (!isJsonObject(config, false)) {
    throw new TerriaError({
      title: { key: "models.terria.loadConfigErrorTitle" },
      message: `Expected the config at ${configUrl} to be a JSON object`
    });
  }

  return {
    config,
    baseUri,
    configUrl
  };
};

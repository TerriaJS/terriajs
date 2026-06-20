import { keyFromSelector } from "i18next";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import URI from "urijs";
import { isJsonObject } from "../Core/Json";
import TerriaError from "../Core/TerriaError";
import loadJson5 from "../Core/loadJson5";
import type { LoadConfigResponse } from "./Terria";

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
): Promise<LoadConfigResponse> => {
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

  const raw = await loadJson5<LoadConfigResponse["config"]>(
    configUrl,
    configUrlHeaders
  );

  if (!isJsonObject(raw, false)) {
    throw new TerriaError({
      title: {
        key: keyFromSelector(($) => $.models.terria.loadConfigErrorTitle)
      },
      message: `Expected the config at ${configUrl} to be a JSON object`
    });
  }

  if (
    raw.parameters &&
    (typeof raw.parameters !== "object" ||
      raw.parameters === null ||
      Array.isArray(raw.parameters))
  ) {
    throw new TerriaError({
      title: { key: "models.terria.loadConfigErrorTitle" },
      message: `Config at "${configUrl}" has a "parameters" property that is not a JSON object.`
    });
  }

  return {
    config: {
      parameters: raw.parameters,
      initializationUrls: raw.initializationUrls,
      v7initializationUrls: raw.v7initializationUrls
    },
    baseUri
  };
};

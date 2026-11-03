import { keyFromSelector } from "i18next";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import URI from "urijs";
import * as z from "zod";
import TerriaError from "../Core/TerriaError";
import loadJson5 from "../Core/loadJson5";
import { ConfigFileSchema, LoadConfigResponse } from "./loadConfig";

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

  const raw = await loadJson5(configUrl, configUrlHeaders);

  const result = ConfigFileSchema.partial().safeParse(raw);
  if (!result.success) {
    throw new TerriaError({
      title: {
        key: keyFromSelector(($) => $.models.terria.loadConfigErrorTitle)
      },
      message: z.prettifyError(result.error)
    });
  }

  const config = result.data;

  return {
    config: {
      parameters: config.parameters ?? {},
      initializationUrls: config.initializationUrls,
      v7initializationUrls: config.v7initializationUrls
    },
    baseUri
  };
};

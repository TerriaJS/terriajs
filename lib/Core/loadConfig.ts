import { TerriaConfig } from "../Models/TerriaConfig";
import { JsonObject } from "./Json";
import loadJson5 from "./loadJson5";

/**
 * Fetches and parses a TerriaJS config file from the given URL.
 *
 * This is a pure fetch utility — it returns the raw config object.
 * Callers are responsible for applying the config to a Terria instance
 * via `terria.applyConfig(config.parameters)` and building init sources
 * via `buildInitSourcesFromConfig()`.
 */
export const loadConfig = async (
  configUrl: string,
  headers?: Record<string, string>
): Promise<TerriaConfig> => {
  const raw = await loadJson5(configUrl, headers);

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`Config at "${configUrl}" did not return a JSON object.`);
  }
  const config = new TerriaConfig();
  config.update(raw as Partial<TerriaConfig>);
  return config;
};

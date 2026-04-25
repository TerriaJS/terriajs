import { TerriaConfig } from "../Models/TerriaConfig";
import JsonValue from "./Json";
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
): Promise<{
  parameters: TerriaConfig;
  initializationUrls: JsonValue | undefined;
  v7initializationUrls: JsonValue | undefined;
}> => {
  const raw = await loadJson5(configUrl, headers);

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`Config at "${configUrl}" did not return a JSON object.`);
  }
  const parameters = new TerriaConfig();
  parameters.update(raw.parameters as Partial<TerriaConfig>);
  return {
    parameters,
    initializationUrls: raw.initializationUrls,
    v7initializationUrls: raw.v7initializationUrls
  };
};

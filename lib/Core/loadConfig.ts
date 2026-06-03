import { ConfigStrata } from "../Models/ConfigStrata";
import { TerriaConfig, createTerriaConfig } from "../Models/TerriaConfig";
import JsonValue from "./Json";
import loadJson5 from "./loadJson5";

/**
 * Fetches and parses a TerriaJS config file from the given URL.
 *
 * The parsed parameters are validated key-by-key against the config schema
 * and applied to the `definition` stratum of the returned `TerriaConfig`.
 * Only keys present in the file are stored — absent keys fall through to the
 * `defaults` stratum automatically.
 *
 * Callers can then layer additional strata on top (e.g. hash-param overrides
 * go to `ConfigStrata.user`) before passing the config to a Terria instance.
 *
 * This is a pure fetch utility — it returns the raw config object.
 * Callers are responsible for applying the config to a Terria instance
 * via `terria.applyConfig(config)` and building init sources
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

  if (
    raw.parameters &&
    (typeof raw.parameters !== "object" ||
      raw.parameters === null ||
      Array.isArray(raw.parameters))
  ) {
    throw new Error(
      `Config at "${configUrl}" has a "parameters" property that is not a JSON object.`
    );
  }

  const parameters = createTerriaConfig();
  // Validate only the keys present in the file — absent keys fall through to
  // the schema defaults.  Invalid values are silently dropped by update().
  parameters.update(ConfigStrata.definition, raw.parameters ?? {});

  return {
    parameters,
    initializationUrls: raw.initializationUrls,
    v7initializationUrls: raw.v7initializationUrls
  };
};

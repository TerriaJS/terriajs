import {
  CONFIG_DEFAULTS,
  ConfigParameters,
  configSchema
} from "./ConfigParametersSchema";
import { StratifiedConfig, createStratifiedConfig } from "./StratifiedConfig";
import CommonStrata from "./Definition/CommonStrata";
import { configStratumOrder } from "./ConfigStrata";
import z from "zod";

/**
 * The application configuration object.
 *
 * `TerriaConfig` is a `StratifiedConfig<typeof configSchema>` — the resolution
 * engine and the config surface are the same object.  There is no separate
 * wrapper class and no parallel observable store.
 *
 * Every property in `ConfigParameters` is exposed directly on the instance
 * via the Proxy in `StratifiedConfig`.  All reads go through the priority chain:
 *
 *   defaults  <  underride  <  definition  <  override  <  user
 *
 * @example
 * const config = createTerriaConfig();
 * config.update(ConfigStrata.definition, await loadJson5("config.json"));
 * config.setValue(ConfigStrata.user, "ignoreErrors", true);
 * config.appName;                        // resolved transparently
 * config.getProvidingStratum("appName"); // "definition" / "user" / …
 */
export type TerriaConfig<TSchema extends z.ZodObject = typeof configSchema> =
  StratifiedConfig<TSchema> & z.output<TSchema>;

/**
 * Re-export so callers that import ConfigParameters from this module continue
 * to work — the type is now derived from the schema.
 */
export type { ConfigParameters };

/**
 * Creates a fresh `TerriaConfig` pre-loaded with `CONFIG_DEFAULTS` in the
 * `defaults` stratum.  Higher strata (underride, definition, override, user)
 * override individual keys without touching the defaults object.
 *
 * Side effects (localStorage persistence, Cesium RequestScheduler limits)
 * are intentionally NOT wired here — callers set them up via MobX `reaction()`
 * so the config object stays a pure reactive store.
 */
export function createTerriaConfig(): TerriaConfig {
  const config = createStratifiedConfig(configSchema, configStratumOrder);
  config.update(CommonStrata.defaults, CONFIG_DEFAULTS);
  return config;
}

/**
 * Convenience re-export so call sites can do:
 *   import { TerriaConfig, ConfigStrata } from "./TerriaConfig";
 */
export { ConfigStrata } from "./ConfigStrata";

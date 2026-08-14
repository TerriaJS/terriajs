import {
  CONFIG_DEFAULTS,
  ConfigParametersSchema
} from "./ConfigParametersSchema";
import { ConfigParameters } from "./ConfigParameters";
import { StratifiedConfig, createStratifiedConfig } from "./StratifiedConfig";
import CommonStrata from "../Definition/CommonStrata";
import { configStratumOrder } from "./ConfigStrata";
import * as z from "zod";

/**
 * The application configuration object.
 *
 * `TerriaConfig` is a `StratifiedConfig<ConfigParameters>` — the resolution
 * engine and the config surface are the same object.  There is no separate
 * wrapper class and no parallel observable store.
 *
 * Every property in `ConfigParameters` is exposed directly on the instance
 * via the Proxy in `StratifiedConfig`.  All reads go through the priority chain:
 *
 *   defaults  <  underride  <  definition  < persistedStorage < override < url <  user
 *
 * @example
 * const config = createTerriaConfig();
 * config.update(ConfigStrata.definition, await loadJson5("config.json"));
 * config.setValue(ConfigStrata.user, "ignoreErrors", true);
 * config.appName;                        // resolved transparently
 * config.getProvidingStratum("appName"); // "definition" / "user" / …
 */
export type TerriaConfig = StratifiedConfig<ConfigParameters> &
  Readonly<ConfigParameters>;

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
export const createTerriaConfig = (
  schema: z.ZodObject = ConfigParametersSchema
): TerriaConfig => {
  const config = createStratifiedConfig(schema, configStratumOrder);
  const updateStatus = config.update(CommonStrata.defaults, CONFIG_DEFAULTS);
  if (typeof updateStatus !== "boolean") throw new Error(updateStatus);

  return config as unknown as TerriaConfig;
};

/**
 * Convenience re-export so call sites can do:
 *   import { TerriaConfig, ConfigStrata } from "./TerriaConfig";
 */
export { ConfigStrata } from "./ConfigStrata";

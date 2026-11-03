import {
  CONFIG_DEFAULTS,
  ConfigParametersSchema
} from "./ConfigParametersSchema";
import { ConfigParameters } from "./ConfigParameters";
import { DeepPartial, StratifiedConfig, mergeDeep } from "./StratifiedConfig";
import { ConfigStrata, configStratumOrder } from "./ConfigStrata";
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

type MissingFromSchema<TSchema extends z.ZodObject> = Exclude<
  keyof ConfigParameters,
  keyof z.output<TSchema>
>;
type MissingFromConfigParameters<TSchema extends z.ZodObject> = Exclude<
  keyof z.output<TSchema>,
  keyof ConfigParameters
>;

/**
 * `unknown` when `TSchema` produces exactly `ConfigParameters` — the same keys,
 * and values assignable both ways — otherwise an object type whose property
 * names the mismatch, so the call fails to compile and says why.
 */
type MatchesConfigParameters<TSchema extends z.ZodObject> = [
  MissingFromSchema<TSchema>
] extends [never]
  ? [MissingFromConfigParameters<TSchema>] extends [never]
    ? [z.output<TSchema>] extends [ConfigParameters]
      ? [ConfigParameters] extends [z.output<TSchema>]
        ? unknown
        : { "schema output does not match ConfigParameters": ConfigParameters }
      : { "schema output does not match ConfigParameters": ConfigParameters }
    : {
        "keys the schema adds but ConfigParametersExtensions does not declare": MissingFromConfigParameters<TSchema>;
      }
  : {
      "keys ConfigParametersExtensions declares but the schema does not validate": MissingFromSchema<TSchema>;
    };

/**
 * Creates a fresh `TerriaConfig` pre-loaded with `CONFIG_DEFAULTS` in the
 * `defaults` stratum.
 *
 * `schema` must produce exactly `ConfigParameters`. An app that augments
 * `ConfigParametersExtensions` must pass the schema extended with the same
 * fields, and the call fails to compile when the two drift apart — otherwise a
 * field declared on the type but missing from the schema would be rejected by
 * the strict schema at runtime and silently resolve to `undefined`.  Higher strata (underride, definition, override, user)
 * override individual keys without touching the defaults object.
 *
 * `defaults` optionally overrides the built-in `CONFIG_DEFAULTS` before they
 * are loaded. Overrides are deep-merged into the defaults (nested objects merge
 * recursively, arrays replace), so a caller can tweak a single nested field or
 * supply defaults for its own schema extensions (e.g. `hideLoginButton`)
 * without restating the whole object. Everything is optional.
 *
 * Side effects (localStorage persistence, Cesium RequestScheduler limits)
 * are intentionally NOT wired here — callers set them up via MobX `reaction()`
 * so the config object stays a pure reactive store.
 */
export const createTerriaConfig = <
  TSchema extends z.ZodObject = typeof ConfigParametersSchema
>(
  schema?: TSchema & MatchesConfigParameters<TSchema>,
  defaults?: DeepPartial<ConfigParameters>
): TerriaConfig => {
  // `schema`'s type proves it produces `ConfigParameters`, and the Proxy in
  // `StratifiedConfig` serves each of its keys as a property — the one fact
  // the compiler cannot see, as in `createStratifiedConfig`.
  const config = new StratifiedConfig<ConfigParameters>(
    schema ?? ConfigParametersSchema,
    configStratumOrder
  ) as TerriaConfig;
  const mergedDefaults =
    defaults === undefined
      ? CONFIG_DEFAULTS
      : mergeDeep(CONFIG_DEFAULTS, defaults);
  const updateStatus = config.update(ConfigStrata.defaults, mergedDefaults);
  if (typeof updateStatus !== "boolean") throw new Error(updateStatus);

  return config;
};

/**
 * Convenience re-export so call sites can do:
 *   import { TerriaConfig, ConfigStrata } from "./TerriaConfig";
 */
export { ConfigStrata } from "./ConfigStrata";

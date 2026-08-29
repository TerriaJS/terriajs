import { BaseStratumOrder } from "../Definition/StratumOrder";

/**
 * Strata levels for TerriaJS config, mirroring the model/catalog layer.
 *
 * Priority (lowest → highest):
 *   defaults < underride < definition < persistedStorage < override < url < user
 *
 * Usage:
 *   - defaults:    built-in application defaults
 *   - underride:   lower-than-definition overrides (library defaults for an app)
 *   - definition:  loaded from config.json
 *   - persistedStorage:  persisted storage overrides (localStorage, IndexedDB, etc.)
 *   - override:    programmatic app-level overrides applied after config load
 *   - user:        user preferences (URL hash params, localStorage)
 */
export enum ConfigStrata {
  defaults = "defaults",
  underride = "underride",
  definition = "definition",
  persistedStorage = "persistedStorage",
  override = "override",
  url = "url",
  user = "user"
}

/**
 * Config-specific stratum order — an independent `BaseStratumOrder` instance
 * that is separate from the global `StratumOrder` singleton used by the
 * model/catalog layer.
 *
 * Applications that want additional config strata (e.g. "localStorage",
 * "hashParams") register them here rather than polluting the global order:
 *
 * @example
 * configStratumOrder.addUserStratum("localStorage");
 * config.update("localStorage", loadFromLocalStorage());
 */
export class ConfigStratumOrder extends BaseStratumOrder {
  constructor() {
    super();
    this.initializeDefaultStratums();
  }

  initializeDefaultStratums(): this {
    this.addDefaultStratum(ConfigStrata.defaults);
    this.addDefinitionStratum(ConfigStrata.underride);
    this.addDefinitionStratum(ConfigStrata.definition);
    this.addDefinitionStratum(ConfigStrata.persistedStorage);
    this.addDefinitionStratum(ConfigStrata.override);
    this.addUserStratum(ConfigStrata.url);
    this.addUserStratum(ConfigStrata.user);

    return this;
  }
}

const configStratumOrder = new ConfigStratumOrder();

export { configStratumOrder };

import { observable, runInAction } from "mobx";
import { z } from "zod";
import { ConfigStratumOrder } from "./ConfigStrata";
import CommonStrata from "./Definition/CommonStrata";

/**
 * A generic, priority-layered config store backed by a Zod schema.
 *
 * **Schema responsibility:** validation only — no `.default()` calls on
 * schema fields.  Defaults live in a separate static object and are loaded
 * into the `defaults` stratum by the caller (e.g. `createTerriaConfig`).
 *
 * **Reactivity model:**
 * `_strata` is an `ObservableMap<string, observable object>`.
 *  - The outer map tracks which strata exist — reacts when a new stratum
 *    is first created.
 *  - Each stratum's value is a MobX observable object — property reads inside
 *    `get()` are tracked at the key level, so updating `appName` only
 *    re-runs reactions that read `appName`, not every key in that stratum.
 *  - Writes directly mutate the observable object (no spread) — spread +
 *    `_strata.set()` would invalidate all per-key observers on every write.
 *
 * **`parseInput` approach:**
 * Uses `schema.partial()` (cached at construction) so partial raw objects
 * don't fail validation on missing required fields.  After parsing, `undefined`
 * values are filtered out — what remains is exactly what the raw input
 * provided, including any keys produced by schema-level transforms.
 *
 * **Strata priority (lowest → highest):**
 *   defaults  <  underride  <  definition  <  override  <  user
 *
 * The walk order is determined by `stratumOrder` — a `BaseStratumOrder`
 * instance that can be shared across components or kept private to a single
 * config.  Callers register additional strata on the same instance before
 * calling `update()` with that stratum name.
 */
export class StratifiedConfig<TSchema extends z.ZodObject<any>> {
  /**
   * Outer map tracks which strata exist (coarse, ObservableMap).
   * Each value is a MobX observable object for fine-grained per-key reactivity.
   */
  private readonly _strata: Map<string, Partial<z.output<TSchema>>>;

  /**
   * Cached partial schema — all fields made optional so `safeParse` succeeds
   * on partial input without filling in defaults.
   */
  private readonly _partialSchema: z.ZodObject<any>;

  /**
   * The stratum ordering registry that determines resolution priority.
   * Exposed publicly so callers can register additional strata:
   * @example
   * config.stratumOrder.addUserStratum("localStorage");
   */
  readonly stratumOrder: ConfigStratumOrder;

  constructor(
    readonly schema: TSchema,
    stratumOrder: ConfigStratumOrder = new ConfigStratumOrder()
  ) {
    this._partialSchema = schema.partial();
    this.stratumOrder = stratumOrder;

    this._strata = observable.map<
      string,
      Partial<z.output<TSchema>>
    >() as never;

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (typeof prop !== "string")
          return Reflect.get(target, prop, receiver);
        if (prop in target) return Reflect.get(target, prop, receiver);
        if (prop in target.schema.shape)
          return target.get(prop as keyof z.output<TSchema>);
        return Reflect.get(target, prop, receiver);
      },
      has(target, prop) {
        return (
          prop in target ||
          (typeof prop === "string" && prop in target.schema.shape)
        );
      }
    }) as StratifiedConfig<TSchema>;
  }

  // ── Write API ────────────────────────────────────────────────────────────────

  /**
   * Validates `values` against the schema and writes the valid keys into
   * `stratum`, creating the stratum if it does not yet exist.
   *
   * Keys already in the stratum that are absent from `values` are preserved.
   * Keys with invalid types and keys not in the schema are silently dropped.
   *
   * Writes directly mutate the per-key observable — only reactions that read
   * an updated key are invalidated, not the entire stratum.
   */
  update(stratum: string, values: unknown): void {
    const validated = this.parseInput(values);
    runInAction(() => {
      const stratumObj = this._getOrCreateStratum(stratum) as Record<
        string,
        unknown
      >;
      for (const [key, value] of Object.entries(validated)) {
        stratumObj[key] = value;
      }
    });
  }

  /**
   * Sets a single key within `stratum` without disturbing any other key —
   * the per-property analogue of `setTrait()` in the model layer.
   *
   * Directly mutates the per-key observable — only reactions that read this
   * specific key are invalidated.
   *
   * @example
   * cfg.setValue(ConfigStrata.user, "ignoreErrors", true);
   */
  setValue<K extends keyof z.output<TSchema>>(
    stratum: string,
    key: K,
    value: z.output<TSchema>[K]
  ): void {
    runInAction(() => {
      const stratumObj = this._getOrCreateStratum(stratum) as Record<
        string,
        unknown
      >;
      stratumObj[key as string] = value;
    });
  }

  // ── Read API ─────────────────────────────────────────────────────────────────

  /**
   * Returns the observable partial stored at `stratum`, or `undefined` if
   * nothing has been set there yet.
   */
  getStratum(stratum: string): Partial<z.output<TSchema>> | undefined {
    return this._strata.get(stratum);
  }

  /**
   * Resolves `key` from the highest-priority stratum that has it defined,
   * walking from highest to lowest priority as determined by `stratumOrder`.
   *
   * Reads from the per-key observable inside each stratum — MobX tracks only
   * this specific key, not the whole stratum.
   *
   * Returns `undefined` only if no stratum (including `defaults`) provides the
   * key — which should not happen for required fields if the defaults stratum
   * is fully populated.
   */
  get<K extends keyof z.output<TSchema>>(key: K): z.output<TSchema>[K] {
    for (const [, stratumObj] of this.stratumOrder.sortTopToBottom(
      this._strata as unknown as Map<string, Partial<z.output<TSchema>>>
    )) {
      const value = stratumObj[key];
      if (value !== undefined) return value;
    }
    return undefined as z.output<TSchema>[K];
  }

  /**
   * Returns the name of the stratum that currently provides `key`'s value,
   * or `CommonStrata.defaults` when no stratum provides it at all.
   */
  getProvidingStratum<K extends keyof z.output<TSchema>>(key: K): string {
    for (const [stratumName, stratumObj] of this.stratumOrder.sortTopToBottom(
      this._strata
    )) {
      const value = stratumObj[key];
      if (value !== undefined) return stratumName;
    }
    return CommonStrata.defaults;
  }

  /**
   * Parses `raw` through `schema.partial()` in a single pass, then filters
   * out `undefined` values — what remains is exactly what the raw input
   * provided (including keys produced by schema-level transforms) with no
   * defaults injected for absent keys.
   *
   * If any present value fails schema validation the whole input is rejected
   * and `{}` is returned.  Used internally by `update()`.
   */
  parseInput(raw: unknown): Partial<z.output<TSchema>> {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return {};
    }
    const result = this._partialSchema.safeParse(raw);
    if (!result.success) return {};
    return Object.fromEntries(
      Object.entries(result.data).filter(([, value]) => value !== undefined)
    ) as Partial<z.output<TSchema>>;
  }

  /**
   * Returns a fully resolved snapshot of every schema key, each resolved
   * through the full strata chain.
   */
  resolveAll(): Partial<z.output<TSchema>> {
    return Object.fromEntries(
      Object.keys(this.schema.shape).map((key) => [
        key,
        this.get(key as keyof z.output<TSchema>)
      ])
    ) as Partial<z.output<TSchema>>;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Returns the observable object for `stratum`, creating an empty one if
   * it does not yet exist.  Must be called inside a `runInAction`.
   */
  private _getOrCreateStratum(stratum: string): Partial<z.output<TSchema>> {
    if (!this._strata.has(stratum)) {
      this._strata.set(stratum, observable({}));
    }
    return this._strata.get(stratum)!;
  }
}

/**
 * Creates a `StratifiedConfig` instance typed as
 * `StratifiedConfig<TSchema> & z.output<TSchema>` so TypeScript sees both the
 * config methods and the transparently-proxied property accesses without any
 * assertion at call sites.
 */
export function createStratifiedConfig<TSchema extends z.ZodObject<any>>(
  schema: TSchema,
  stratumOrder: ConfigStratumOrder = new ConfigStratumOrder()
): StratifiedConfig<TSchema> & z.output<TSchema> {
  return new StratifiedConfig(
    schema,
    stratumOrder
  ) as unknown as StratifiedConfig<TSchema> & z.output<TSchema>;
}

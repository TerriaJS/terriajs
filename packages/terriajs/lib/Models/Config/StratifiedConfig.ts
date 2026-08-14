import {
  get as getObservableValue,
  observable,
  runInAction,
  set as setObservableValue
} from "mobx";
import * as z from "zod";
import { ConfigStratumOrder } from "./ConfigStrata";

type ValidationState<T> =
  | {
      status: "VALID";
      data: T;
    }
  | {
      status: "INVALID";
      error: string;
    };

export type DeepPartial<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function mergeDeep<T>(base: T, patch: DeepPartial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch as T;

  return Object.fromEntries(
    Array.from(new Set([...Object.keys(base), ...Object.keys(patch)])).map(
      (key) => [
        key,
        Object.hasOwn(patch, key) ? mergeDeep(base[key], patch[key]) : base[key]
      ]
    )
  ) as T;
}

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
 *  - Each stratum's value is a MobX observable object. Dynamic property reads
 *    and writes use MobX's `get` and `set` APIs, so absent keys are observed
 *    without predeclaring every schema property.
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
 *   defaults  <  underride  <  definition  < persistedStorage < override < url <  user
 *
 * The walk order is determined by `stratumOrder` — a `BaseStratumOrder`
 * instance that can be shared across components or kept private to a single
 * config.  Callers register additional strata on the same instance before
 * calling `update()` with that stratum name.
 */
export class StratifiedConfig<T extends object> {
  /**
   * Outer map tracks which strata exist (coarse, ObservableMap).
   * Each value is a MobX observable object for fine-grained per-key reactivity.
   */
  private readonly _strata: Map<string, Partial<T>>;

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
    readonly schema: z.ZodObject,
    stratumOrder: ConfigStratumOrder = new ConfigStratumOrder()
  ) {
    this._partialSchema = schema.partial();
    this.stratumOrder = stratumOrder;

    this._strata = observable.map<string, Partial<T>>() as never;

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (typeof prop !== "string" || prop in target)
          return Reflect.get(target, prop, receiver);
        return target.get(prop as keyof T);
      },
      set() {
        return false;
      }
    }) as StratifiedConfig<T>;
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
  update(stratum: string, values: Partial<T>): string | true {
    const validated = this.parseInput(values);

    if (validated.status === "INVALID") return validated.error;

    runInAction(() => {
      const stratumObj = this._getOrCreateStratum(stratum) as Record<
        string,
        unknown
      >;
      for (const [key, value] of Object.entries(validated.data)) {
        setObservableValue(stratumObj, key, value);
      }
    });
    return true;
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
  setValue<K extends keyof T>(stratum: string, key: K, value: T[K]): void {
    runInAction(() => {
      const stratumObj = this._getOrCreateStratum(stratum) as Record<
        string,
        unknown
      >;
      setObservableValue(stratumObj, key as string, value);
    });
  }

  /**
   * Recursively merges a partial object into the currently resolved value and
   * writes the validated result to `stratum`. Arrays are replaced rather than
   * merged.
   *
   * The resolved value is materialized in the target stratum, so subsequent
   * changes to lower strata will remain masked by the copied fields.
   */
  mergeValue<K extends keyof T>(
    stratum: string,
    key: K,
    patch: DeepPartial<T[K]>
  ): string | true {
    return this.update(stratum, {
      [key]: mergeDeep(this.get(key), patch)
    } as never);
  }

  // ── Read API ─────────────────────────────────────────────────────────────────

  /**
   * Returns the observable partial stored at `stratum`, or `undefined` if
   * nothing has been set there yet.
   */
  getStratum(stratum: string): Partial<T> | undefined {
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
  get<K extends keyof T>(key: K): T[K] {
    for (const [, stratumObj] of this.stratumOrder.sortTopToBottom(
      this._strata as unknown as Map<string, Partial<T>>
    )) {
      const value = getObservableValue(stratumObj, key as string);
      if (value !== undefined) return value;
    }
    return undefined as T[K];
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
  parseInput(raw: unknown): ValidationState<Partial<T>> {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return {
        status: "INVALID",
        error: "Configuration needs to be an object"
      };
    }
    const result = this._partialSchema.safeParse(raw);
    if (!result.success) {
      return {
        status: "INVALID",
        error: z.prettifyError(result.error)
      };
    }
    return {
      status: "VALID",
      data: Object.fromEntries(
        Object.entries(result.data).filter(([, value]) => value !== undefined)
      ) as Partial<T>
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Returns the observable object for `stratum`, creating an empty one if it
   * does not yet exist. Must be called inside a `runInAction`.
   */
  private _getOrCreateStratum(stratum: string): Partial<T> {
    if (!this._strata.has(stratum)) {
      this._strata.set(stratum, observable({}));
    }
    return this._strata.get(stratum)!;
  }
}

/**
 * Creates a `StratifiedConfig` instance typed as
 * `StratifiedConfig<z.output<TSchema>> & Readonly<z.output<TSchema>>` so
 * TypeScript sees both the config methods and the transparently-proxied
 * property accesses without any assertion at call sites. The resolved shape is
 * inferred from the schema passed in.
 */
export function createStratifiedConfig<TSchema extends z.ZodObject>(
  schema: TSchema,
  stratumOrder: ConfigStratumOrder = new ConfigStratumOrder()
): StratifiedConfig<z.output<TSchema>> & Readonly<z.output<TSchema>> {
  return new StratifiedConfig<z.output<TSchema>>(
    schema,
    stratumOrder
  ) as unknown as StratifiedConfig<z.output<TSchema>> &
    Readonly<z.output<TSchema>>;
}

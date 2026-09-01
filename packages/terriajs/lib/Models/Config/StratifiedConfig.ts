import {
  get as getObservableValue,
  observable,
  remove as removeObservableValue,
  runInAction,
  set as setObservableValue
} from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import * as z from "zod";
import { ConfigStratumOrder } from "./ConfigStrata";

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
 * **Validation approach:**
 * Uses `schema.partial()` (cached at construction) so partial raw objects
 * don't fail validation on missing required fields.  Validation is *partial*:
 * a single invalid or unknown key never discards the rest — the valid keys are
 * applied and the offending keys are reported. This is done by parsing the
 * whole schema, dropping the keys named in the resulting `error.issues`, and
 * re-parsing the remainder — never by indexing into `schema.shape`, so
 * schema-level transforms are preserved.
 *
 * **Strata priority (lowest → highest):**
 *   defaults  <  underride  <  definition  < persistedStorage < override < url <  user
 *
 * The walk order is determined by `stratumOrder` — a `BaseStratumOrder`
 * instance that can be shared across components or kept private to a single
 * config.  Callers must register additional strata on that instance *before*
 * calling `update()`/`setValue()` with that stratum name — writing to an
 * unregistered stratum throws.
 */
export class StratifiedConfig<T extends object> {
  /**
   * Outer map tracks which strata exist (coarse, ObservableMap).
   * Each value is a MobX observable object for fine-grained per-key reactivity.
   */
  private readonly _strata: Map<string, Partial<T>>;

  /**
   * Cached deep-partial schema (`z.deepPartial`) — every object field, at every
   * depth, made optional so `safeParse` accepts a bare partial object without
   * requiring absent sub-fields. Object mode (`strict`/`loose`) is preserved, so
   * unknown-key handling is unchanged. Validation always goes through this whole
   * schema (never per-field `schema.shape` access), so field-level transforms
   * and refinements still apply.
   *
   * `z.deepPartial` also makes array *elements* optional and does not strip
   * `.default()`s; both are non-issues here because config schemas hold no
   * defaults (they live in the `defaults` stratum) and array values are replaced
   * wholesale on read rather than merged element-by-element.
   */
  private readonly _partialSchema: z.ZodType;

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
    this.stratumOrder = stratumOrder;
    this._partialSchema = z.deepPartial(schema);

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
   * Validates `values` key-by-key and writes the valid keys into `stratum`,
   * creating the stratum if it does not yet exist.
   *
   * Validation is deep-partial: each provided key is checked against its own
   * field schema with every nested field optional, so a bare partial object is
   * accepted and a single invalid or unknown key does not discard the rest.
   * Valid keys are applied; invalid keys are skipped and reported. Keys already
   * in the stratum that are absent from `values` are preserved, and a nested
   * object is stored exactly as given — the sub-fields it omits resolve from the
   * strata below on read (see {@link get}).
   *
   * Passing a key with an explicit `undefined` value removes that key from the
   * stratum, so the value resolves from the next-lower stratum — the only way
   * to "unset" an override and fall back to a default.
   *
   * @returns `true` if every provided key was valid, otherwise a string
   * describing the keys that were rejected (the valid keys are still applied).
   * @throws {DeveloperError} if `stratum` is not registered in `stratumOrder`.
   *
   * Writes directly mutate the per-key observable — only reactions that read
   * an updated key are invalidated, not the entire stratum.
   */
  update(stratum: string, values: DeepPartial<T>): string | true {
    this._assertStratumRegistered(stratum);

    const { data, errors } = this.parseInput(values);

    runInAction(() => {
      const stratumObj = this._getOrCreateStratum(stratum) as Record<
        string,
        unknown
      >;
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) {
          removeObservableValue(stratumObj, key);
        } else {
          setObservableValue(stratumObj, key, value);
        }
      }
    });
    return errors.length > 0 ? errors.join("\n") : true;
  }

  /**
   * Sets a single key within `stratum` without disturbing any other key —
   * the per-property analogue of `setTrait()` in the model layer.
   *
   * Validation runs through the same deep-partial schema as {@link update} on a
   * single-key object, so a valid single-key update is never blocked by
   * unrelated required fields and a bare partial object value is accepted. An
   * invalid value is rejected and nothing is written.
   *
   * Passing `undefined` removes the key from the stratum, so the value resolves
   * from the next-lower stratum — the per-key way to unset an override.
   *
   * @returns `true` if the value was valid and written, otherwise a string
   * describing why it was rejected.
   * @throws {DeveloperError} if `stratum` is not registered in `stratumOrder`.
   *
   * @example
   * cfg.setValue(ConfigStrata.user, "ignoreErrors", true);
   */
  setValue<K extends keyof T>(
    stratum: string,
    key: K,
    value: DeepPartial<T[K]> | undefined
  ): string | true {
    this._assertStratumRegistered(stratum);

    if (value === undefined) {
      runInAction(() => {
        const stratumObj = this._strata.get(stratum) as
          | Record<string, unknown>
          | undefined;
        if (stratumObj) removeObservableValue(stratumObj, key as string);
      });
      return true;
    }

    const { data, errors } = this.parseInput({ [key]: value });
    if (errors.length > 0) return errors.join("\n");
    if (!Object.hasOwn(data, key as string)) return true;

    runInAction(() => {
      const stratumObj = this._getOrCreateStratum(stratum) as Record<
        string,
        unknown
      >;
      if (data[key] === undefined) {
        removeObservableValue(stratumObj, key as string);
      } else {
        setObservableValue(stratumObj, key as string, data[key]);
      }
    });
    return true;
  }

  // ── Read API ─────────────────────────────────────────────────────────────────

  /**
   * Returns the observable deep-partial stored at `stratum`, or `undefined` if
   * nothing has been set there yet. A stratum holds only the (possibly nested)
   * fields written to it — the rest resolve from lower strata via {@link get}.
   */
  getStratum(stratum: string): DeepPartial<T> | undefined {
    return this._strata.get(stratum) as DeepPartial<T> | undefined;
  }

  /**
   * Resolves `key` across strata, walking from highest to lowest priority as
   * determined by `stratumOrder`.
   *
   * Resolution mirrors the model/catalog layer's `objectTrait`: a plain-object
   * value is deep-merged across every stratum that defines it, so each leaf
   * comes from the highest stratum that supplies *that leaf* and lower strata
   * fill in the rest. A partial object in a higher stratum therefore overrides
   * individual sub-properties without erasing the siblings a lower stratum
   * defines. Non-object values (scalars, arrays, functions, `null`) are not
   * merged — the highest-priority defined value wins wholesale, like a
   * `primitiveTrait`. Arrays nested inside merged objects are likewise replaced,
   * never concatenated (see {@link mergeDeep}).
   *
   * Reads the per-key observable inside each stratum — MobX tracks only this
   * specific key. For object values every contributing stratum's key is read,
   * so a change to an unmasked lower-stratum leaf still triggers reactions.
   *
   * Returns `undefined` only if no stratum (including `defaults`) provides the
   * key — which should not happen for required fields if the defaults stratum
   * is fully populated.
   */
  get<K extends keyof T>(key: K): T[K] {
    return this._resolve(key);
  }

  /**
   * Resolves `key` exactly like {@link get} — deep-merging object values per
   * leaf — but only from the strata *below* `targetStratum`; the target stratum
   * and everything above it are ignored. Answers "what would this key resolve to
   * without this stratum's override?", e.g. so a caller can store only the
   * leaves that actually differ from the app-provided baseline. Works whether or
   * not `targetStratum` itself has been written yet.
   */
  getBelowStratum<K extends keyof T>(key: K, targetStratum: string): T[K] {
    const priority = this.stratumOrder.priorities.get(targetStratum);
    if (priority === undefined) return undefined as T[K];
    return this._resolve(key, (p) => p < priority);
  }

  /**
   * Resolves `key` exactly like {@link get} — deep-merging object values per
   * leaf — but only from the strata *above* `targetStratum`; the target stratum
   * and everything below it are ignored. Answers "what has been set on top of
   * this stratum?", e.g. to persist only the user-controlled value without
   * freezing the app defaults that sit below it.
   */
  getAboveStratum<K extends keyof T>(key: K, targetStratum: string): T[K] {
    const priority = this.stratumOrder.priorities.get(targetStratum);
    if (priority === undefined) return undefined as T[K];
    return this._resolve(key, (p) => p > priority);
  }

  /**
   * Shared resolver for {@link get}, {@link getBelowStratum} and
   * {@link getAboveStratum}. Walks strata highest → lowest; `includePriority`,
   * when given, restricts the walk to strata whose priority it accepts. A
   * plain-object value is deep-merged across the contributing strata (the
   * highest stratum that defines a leaf wins it); any non-object value wins
   * wholesale.
   */
  private _resolve<K extends keyof T>(
    key: K,
    includePriority?: (priority: number) => boolean
  ): T[K] {
    const objectLayers: unknown[] = [];
    for (const [stratum, stratumObj] of this.stratumOrder.sortTopToBottom(
      this._strata as unknown as Map<string, Partial<T>>
    )) {
      if (includePriority) {
        const priority = this.stratumOrder.priorities.get(stratum);
        if (priority === undefined || !includePriority(priority)) continue;
      }
      const value = getObservableValue(stratumObj, key as string);
      if (value === undefined) continue;
      if (!isPlainObject(value)) {
        // A non-object value wins wholesale. One appearing below already-
        // collected object layers cannot contribute leaves, so stop the walk.
        if (objectLayers.length === 0) return value as T[K];
        break;
      }
      objectLayers.push(value);
    }
    if (objectLayers.length === 0) return undefined as T[K];
    // objectLayers is ordered highest → lowest; fold from the lowest upward so
    // each higher stratum patches the accumulated result and wins per leaf.
    return objectLayers.reduceRight((base, patch) =>
      mergeDeep(base, patch)
    ) as T[K];
  }

  /**
   * Validates `raw` through the cached deep-partial schema (`z.deepPartial`) and
   * returns the valid keys plus any validation errors, without ever indexing
   * into `schema.shape`.
   *
   * Validation is partial: a single invalid or unknown key does not discard the
   * rest. On a fully valid parse the transformed keys are returned as-is — an
   * explicit `undefined` is preserved (it signals the caller wants to clear the
   * key), and absent keys are never injected. On failure the
   * offending top-level keys are identified from `error.issues` and dropped,
   * and the remainder is re-parsed so every recoverable key is still applied.
   *
   * Because the whole schema is used, field-level transforms are preserved.
   * Object-level (cross-field) refinements can flag a key-less error; when the
   * remainder still fails to re-parse, no keys are applied and the error is
   * reported. Used internally by {@link update} and {@link setValue}.
   */
  parseInput(raw: unknown): { data: Partial<T>; errors: string[] } {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return { data: {}, errors: ["Configuration needs to be an object"] };
    }

    const result = this._partialSchema.safeParse(raw);
    if (result.success) {
      return { data: result.data as Partial<T>, errors: [] };
    }

    const errors = [z.prettifyError(result.error)];
    const invalidKeys = new Set<string>();
    for (const issue of result.error.issues) {
      if (issue.code === "unrecognized_keys") {
        for (const key of issue.keys) invalidKeys.add(key);
      } else if (typeof issue.path[0] === "string") {
        invalidKeys.add(issue.path[0]);
      }
    }

    const remainder = Object.fromEntries(
      Object.entries(raw).filter(([key]) => !invalidKeys.has(key))
    );
    const recovered = this._partialSchema.safeParse(remainder);
    return {
      data: recovered.success ? (recovered.data as Partial<T>) : {},
      errors
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Throws if `stratum` has no registered priority in `stratumOrder`. Writing
   * to an unregistered stratum would otherwise create it in `_strata` and make
   * every later `get()` throw when it walks the ordering — so fail fast at the
   * write site with an actionable message.
   */
  private _assertStratumRegistered(stratum: string): void {
    if (!this.stratumOrder.priorities.has(stratum)) {
      throw new DeveloperError(
        `Stratum "${stratum}" is not registered in stratumOrder. ` +
          `Register it first, e.g. config.stratumOrder.addUserStratum("${stratum}").`
      );
    }
  }

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

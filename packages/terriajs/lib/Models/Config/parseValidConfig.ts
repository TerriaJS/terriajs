import * as z from "zod";

/** A single rejected configuration value. */
export interface ConfigIssue {
  /**
   * Dotted path of the rejected value, e.g. `appName` or
   * `searchBarConfig.minCharacters`. Empty for an error that belongs to the
   * configuration as a whole rather than to one value.
   */
  path: string;
  message: string;
}

export interface ValidConfigResult<T> {
  /** The keys that passed validation. */
  data: T;
  /** One entry per rejected value; empty when everything was applied. */
  issues: ConfigIssue[];
  /** The first parse's error as formatted by `z.prettifyError`; `""` when it passed. */
  message: string;
}

/** Removes `path` from `value`, copying only along the path. */
function omitPath(value: unknown, path: readonly string[]): unknown {
  if (typeof value !== "object" || value === null) return value;
  const [key, ...rest] = path;
  const entries = Object.entries(value as Record<string, unknown>).flatMap(
    ([entryKey, entryValue]) => {
      if (entryKey !== key) return [[entryKey, entryValue] as const];
      if (rest.length === 0) return [];
      return [[entryKey, omitPath(entryValue, rest)] as const];
    }
  );
  return Object.fromEntries(entries);
}

/**
 * The path of the value an issue rejects. An `unrecognized_keys` issue names
 * its keys separately from its path, and a path that runs through an array
 * index is truncated at the array itself, because array values are replaced
 * wholesale rather than merged per element (see `StratifiedConfig.get`).
 */
function rejectedPaths(issue: z.core.$ZodIssue): string[][] {
  const path = issue.path.map(String);
  const arrayIndex = issue.path.findIndex(
    (segment) => typeof segment === "number"
  );
  if (arrayIndex >= 0) return [path.slice(0, arrayIndex)];
  if (issue.code === "unrecognized_keys") {
    return issue.keys.map((key) => [...path, key]);
  }
  return [path];
}

/** The values a failed parse rejected, as paths to remove and as issues. */
function rejectedValues(error: z.ZodError): {
  paths: string[][];
  issues: ConfigIssue[];
} {
  const rejected = error.issues.flatMap((issue) =>
    rejectedPaths(issue).map((path) => ({ path, message: issue.message }))
  );
  return {
    paths: rejected.map(({ path }) => path).filter((path) => path.length > 0),
    issues: rejected.map(({ path, message }) => ({
      path: path.join("."),
      message
    }))
  };
}

/**
 * Parses `raw` against `schema`, keeping every value that validates and
 * reporting the ones that do not.
 *
 * Parses at most twice. When the first parse fails, every value it rejected is
 * removed and the rest is parsed again, so an invalid or unknown leaf does not
 * discard the valid leaves beside it or any other key. A value whose path runs
 * through an array index removes that whole array, matching the
 * replace-wholesale semantics of array config values. If the second parse
 * also fails - a whole-object refinement, or one that only fails once a value
 * is gone - nothing is applied, so every key resolves from the strata below.
 *
 * Only the first parse is reported: it describes what is wrong with the input.
 * The second parse only decides whether the remainder is usable.
 *
 * The caller decides what a rejected value means: `StratifiedConfig` writes
 * the valid part and returns the issues, and its own callers choose whether to
 * log them or surface them to the user.
 */
export function parseValidConfig<T>(
  schema: z.ZodType,
  raw: unknown
): ValidConfigResult<Partial<T>> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    const message = "Configuration needs to be an object";
    return { data: {} as Partial<T>, issues: [{ path: "", message }], message };
  }

  const first = schema.safeParse(raw);
  if (first.success) {
    return { data: first.data as Partial<T>, issues: [], message: "" };
  }

  const rejected = rejectedValues(first.error);
  const remainder = rejected.paths.reduce<unknown>(omitPath, raw);
  const second = schema.safeParse(remainder);

  return {
    data: second.success ? (second.data as Partial<T>) : ({} as Partial<T>),
    issues: rejected.issues,
    message: z.prettifyError(first.error)
  };
}

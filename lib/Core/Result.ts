import isDefined from "./isDefined";
import TerriaError, {
  TerriaErrorOptions,
  TerriaErrorOverrides,
  parseOverrides
} from "./TerriaError";
import { NotUndefined } from "./TypeModifiers";
import Terria from "../Models/Terria";

/**
 * The Result class is similar to Option type/object in Scala/Rust.
 * It wraps up some `value` and `error` - so that a function can return both simulateously.
 *
 * This is similar to the https://www.npmjs.com/package/neverthrow package
 *
 * ## Simple usage:
 *
 * ```ts
 *  function someFn(someArg): Result<string | undefined> {
 *    if (someArg) {
 *      return new Result('success')
 *    }
 *    return new Result(undefined, TerriaError.from("SOME ERROR"))
 *  }
 *  ```
 *
 * ### This can now be used in a few different ways:
 *
 * #### Ignore error and just return value
 *
 * ```ts
 * const value = someFn(someArg).ignoreError()
 * ```
 *
 * #### Catch error, do something with it and then return value
 *
 * ```ts
 * const value = someFn(someArg).catchError((error) => doSomethingWithError(error))
 * ```
 *
 * #### Throw error OR return value
 *
 * ```ts
 * const value = someFn(someArg).throwIfError()
 * ```
 * #### Throw if value is undefined, otherwise return value
 *
 * ```ts
 * const value = someFn(someArg).throwIfUndefined()
 * ```
 *
 * ## `TerriaErrorOverrides`:
 *
 * `TerriaErrorOverrides` can be provided when creating a `new Result()`, and also when using `throwIfError()` or `throwIfUndefined`.
 * This allows you to add more context to TerriaErrors.
 *
 * ### Simple usage:
 *
 * ```ts
 *  function someFn(someArg): Result<string | undefined> {
 *    if (someArg) {
 *      return new Result('success')
 *    }
 *    return new Result(undefined, TerriaError.from("Some error inside function"))
 *  }
 *
 *  const value = someFn(someArg).throwIfError("Some error outside of function")
 *  ```
 *
 * This will now throw a chain of TerriaErrors - which provides a good stack trace:
 *
 * ```json
 *  {
 *    ...,
 *    message: "Some error outside of function",
 *    originalError: {
 *      ...,
 *      message: "Some error inside function"
 *    }
 *  }
 * ```
 */
export default class Result<T = undefined> {
  /** Convenience constructor to return a Result with an error.
   *
   * This accepts same arguments as `TerriaError.from`
   */
  static error(
    error: unknown,
    overrides?: TerriaErrorOverrides
  ): Result<undefined> {
    return new Result(undefined, TerriaError.from(error, overrides));
  }

  /** Convenience constructor to return a Result with no value (and potentially an error) */
  static none(error?: unknown, overrides?: TerriaErrorOverrides) {
    return error ? Result.error(error, overrides) : new Result(undefined);
  }

  /** Combine array of Results.
   * The new Result will have an error if at least one error has occurred in array of results
   * The value will be array of result values.
   *
   */
  static combine<U>(
    results: Result<U>[],
    errorOverrides: TerriaErrorOverrides
  ): Result<U[]> {
    return new Result(
      results.map((r) => r.value),
      TerriaError.combine(
        results.map((r) => r.error),
        errorOverrides
      )
    );
  }

  private readonly value: T;
  private readonly _error?: TerriaError;

  constructor(value: T, error?: TerriaErrorOptions | TerriaError) {
    this.value = value;
    this._error = error
      ? // Create TerriaError if error is TerriaErrorOptions
        error instanceof TerriaError
        ? error
        : new TerriaError(error)
      : undefined;
  }

  get error(): TerriaError | undefined {
    return this._error;
  }

  /** Returns value regardless if an error occurred */
  ignoreError(): T {
    return this.value;
  }

  /** Apply callback function if an error occurred, and then return value */
  catchError(callback: (error: TerriaError) => void): T {
    if (this._error) callback(this._error);
    return this.value;
  }

  /** Log error to console if one has occurred, and then return value.
   *
   * @param errorOverrides can be used to add error context
   */
  logError(errorOverrides?: TerriaErrorOverrides) {
    if (this._error) TerriaError.from(this._error, errorOverrides).log();
    return this.value;
  }

  /** Raise error if one has occurred, and then return value.
   *
   * @param errorOverrides can be used to add error context
   * @param forceRaiseToUser true to force show error to user
   */
  raiseError(
    terria: Terria,
    errorOverrides?: TerriaErrorOverrides,
    forceRaiseToUser?: boolean
  ): T {
    if (this._error)
      terria.raiseErrorToUser(this.error, errorOverrides, forceRaiseToUser);
    return this.value;
  }

  /** Throw error if one occurred, otherwise return value.
   *
   * @param errorOverrides can be used to add error context
   */
  throwIfError(errorOverrides?: TerriaErrorOverrides): T {
    if (this._error) throw TerriaError.from(this._error, errorOverrides);

    return this.value;
  }

  /** Throw error if value is undefined (regardless of if an error has occurred), otherwise return value.
   *
   * @param errorOverrides will be used to create error if value is undefined
   */
  throwIfUndefined(errorOverrides?: TerriaErrorOverrides): NotUndefined<T> {
    if (isDefined(this.value)) return this.value as NotUndefined<T>;

    // If value is undefined, throw error
    throw this._error
      ? TerriaError.from(this._error, errorOverrides)
      : new TerriaError({
          message: "Unhandled required Result exception",
          ...parseOverrides(errorOverrides)
        });
  }

  pushErrorTo(errors: TerriaError[], errorOverrides?: TerriaErrorOverrides) {
    if (this._error) errors.push(TerriaError.from(this._error, errorOverrides));
    return this.value;
  }

  /** Clone this `Result` and apply `TerriaErrorOverrides` if there is an error */
  clone(errorOverrides: TerriaErrorOverrides): Result<T> {
    if (this._error)
      return new Result(
        this.value,
        TerriaError.from(this._error, errorOverrides)
      );
    return new Result(this.value);
  }
}

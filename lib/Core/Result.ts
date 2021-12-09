import isDefined from "./isDefined";
import TerriaError, {
  TerriaErrorOptions,
  TerriaErrorOverrides,
  parseOverrides
} from "./TerriaError";
import { NotUndefined } from "./TypeModifiers";
import Terria from "../Models/Terria";

/**
 * This file (the Result class) is inspired by / adapted from the https://www.npmjs.com/package/neverthrow package
 *
 * Neverthrow license (https://github.com/supermacro/neverthrow/blob/master/LICENSE)
 *
 * MIT License
 *
 * > Copyright (c) 2019 Giorgio Delgado
 * >
 * > Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * > The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * > THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * The Result class is similar to Option type/object in Scala/Rust.
 * It wraps up some `value` and `error` - so that a function can return both simulateously.
 *
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
      results.map(r => r.value),
      TerriaError.combine(
        results.map(r => r.error),
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
    if (this._error)
      console.error(TerriaError.from(this._error, errorOverrides).toError());
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

  /** Throw error if one occurred OR value is undefined, otherwise return value
   *
   * @param errorOverrides will be used to create error if value is undefined
   */
  throwIfUndefined(errorOverrides?: TerriaErrorOverrides): NotUndefined<T> {
    if (this._error) throw TerriaError.from(this._error, errorOverrides);
    if (isDefined(this.value)) return this.value as NotUndefined<T>;

    // If value is undefined, throw a new TerriaError using errorOverrides
    throw new TerriaError({
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

  /** Maps a Result<T> to Result<U> by applying a function to a contained value, leaving the error value untouched. */
  map<U>(fn: (value: T) => U): Result<U> {
    return new Result(fn(this.value), this.error);
  }

  /** Async version of map - maps a Result<T> to Result<U> by applying a function to a contained value, leaving the error value untouched. */
  async mapAsync<U>(fn: (value: T) => Promise<U>): Promise<Result<U>> {
    return new Result(await fn(this.value), this.error);
  }
}

import isDefined from "./isDefined";
import TerriaError, {
  TerriaErrorOptions,
  TerriaErrorOverrides
} from "./TerriaError";
import { NotUndefined } from "./TypeModifiers";

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
  /** Convenience constructor  to return a Result with an error */
  static error(error: TerriaErrorOptions | TerriaError): Result<undefined> {
    return new Result(
      undefined,
      // Create TerriaError if error is TerriaErrorOptions
      error instanceof TerriaError ? error : new TerriaError(error)
    );
  }

  static none() {
    return new Result(undefined);
  }

  /** Convenience constructor  to return a new Result with a vaule and/or error */
  static return<U>(
    value: U,
    error?: TerriaErrorOptions | TerriaError
  ): Result<U> {
    return new Result(
      value,
      error
        ? // Create TerriaError if error is TerriaErrorOptions
          error instanceof TerriaError
          ? error
          : new TerriaError(error)
        : undefined
    );
  }

  constructor(
    private readonly value: T,
    private readonly _error?: TerriaError
  ) {}

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
    if (typeof errorOverrides === "string") {
      errorOverrides = { message: errorOverrides };
    }
    throw new TerriaError({
      message: "Unhandled required Result exception",
      ...errorOverrides
    });
  }
}

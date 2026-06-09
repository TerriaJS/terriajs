# Result object and Error Handling

## Result object

The Result class is similar to Option type/object in Scala/Rust.
It wraps up some `value` and `error` - so that a function can return both simulateously.

This is similar to the https://www.npmjs.com/package/neverthrow package

See `lib\Core\Result.ts` for more documentation.

### Simple usage

```ts
function someFn(someArg: boolean): Result<string | undefined> {
  if (someArg) {
    return new Result("success");
  }
  return new Result(undefined, TerriaError.from("SOME ERROR"));
}
```

#### This can now be used in a few different ways

##### Ignore error and just return value

```ts
const value = someFn(true).ignoreError();
// value = "success"

const value = someFn(false).ignoreError();
// value = undefined
```

##### Catch error, do something with it and then return value

```ts
const value = someFn(someArg).catchError((error) =>
  doSomethingWithError(error)
);
```

##### Throw error OR return value

```ts
const value = someFn(someArg).throwIfError();
```

##### Throw if value is undefined, otherwise return value

```ts
const value = someFn(someArg).throwIfUndefined();
```

##### Raise error to user if error, and return value

```ts
const value = someFn(someArg).raiseError(terria);
```

### `TerriaErrorOverrides`

`TerriaErrorOverrides` can be provided when creating a `new Result()`, and also methods which act on errors (eg `raiseError`, `throwIfError`, ...)

This allows you to add more context to TerriaErrors.

Valid `TerriaErrorOverrides` include:

- String values - eg `"Some error message"`
- JSON representation of `TerriaError` - eg `{"title": "Error title", "message": "Some error message"}`

#### Simple usage

```ts
function someFn(someArg): Result<string | undefined> {
  if (someArg) {
    return new Result("success");
  }
  // Here we create a TerriaError with message "Some Error inside result"
  return new Result(undefined, TerriaError.from("Some error inside result"));
}

// Here we add `TerriaErrorOverrides` in throwIfError.
// This is equivalent to calling `createParentError()` on the error inside inside result.
// Eg. error.createParentError("Some error outside of result")
const value = someFn(someArg).throwIfError("Some error outside of result");
```

This will now throw a chain of TerriaErrors - which provides a good stack trace:

```json
{
  ...,
  message: "Some error outside of result",
  originalError: {
    ...,
    message: "Some error inside result"
  }
}
```

### Convenience functions

There are a few convenience functions and methods to make `Result` a bit easier to use.

#### `Result.error()`

This accepts same arguments as `TerriaError.from` and will create a new `Result` object with an error

#### `Result.none()`

This also accepts same arguments as `TerriaError.from` - but all arguments are optional. It will create a Result with no value (and potentially an error - if arguments are defined)

#### `Result.combine()`

Combines an array of `Result` objects into a single `Result` - also accepts same arguments as `TerriaError.from`.

## TerriaError object

Represents an error that occurred in a TerriaJS module, especially an asynchronous one that cannot be raised by throwing an exception because no one would be able to catch it.

See `lib\Core\TerriaError.ts` for more documentation.

### TerriaErrorSeverity

`TerriaErrorSeverity` enum values can be `Error` or `Warning`.

- Errors with severity `Error` are presented to the user. `Warning` will just be printed to console.
- By default, errors will use `Error`
- `TerriaErrorSeverity` will be copied through nested `TerriaErrors` on creation (eg if you call `TerriaError.from()` on a `Warning` then the parent error will also be `Warning`)
- Loading models from share links or stories will use `Warning` if the model is **not in the workbench**, otherwise it will use `Error`.

#### Example of severity propagation

Say we have this error with severity `Warning`:

```ts
const error = {
  message: "some message",
  severity: TerriaErrorSeverity.Warning
};
```

And then we call:

```ts
error.createParentError("some higher message");
```

It will return a new TerriaError with the same severity - `Warning` - **not** the default severity `Error`.

```ts
{
  "message": "some higher message",
  "severity": TerriaErrorSeverity.Warning
  "orginalError": {
    "message": "some message",
    "severity": TerriaErrorSeverity.Warning
  }
}
```

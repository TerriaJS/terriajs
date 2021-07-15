# Result object and Error Handling

## Result object

The Result class is similar to Option type/object in Scala/Rust.
It wraps up some `value` and `error` - so that a function can return both simulateously.

This is similar to the https://www.npmjs.com/package/neverthrow package

### Simple usage

```ts
function someFn(someArg: boolean): Result<string | undefined> {
  if (someArg) {
    return new Result('success')
  }
  return new Result(undefined, TerriaError.from("SOME ERROR"))
}
```

#### This can now be used in a few different ways

##### Ignore error and just return value

```ts
const value = someFn(true).ignoreError()
// value = "success"

const value = someFn(false).ignoreError()
// value = undefined
```

##### Catch error, do something with it and then return value

```ts
const value = someFn(someArg).catchError((error) => doSomethingWithError(error))
```

##### Throw error OR return value

```ts
const value = someFn(someArg).throwIfError()
```

##### Throw if value is undefined, otherwise return value

```ts
const value = someFn(someArg).throwIfUndefined()
```

### `TerriaErrorOverrides`

`TerriaErrorOverrides` can be provided when creating a `new Result()`, and also when using `throwIfError()` or `throwIfUndefined`.
This allows you to add more context to TerriaErrors.

#### Simple usage

```ts
function someFn(someArg): Result<string | undefined> {
  if (someArg) {
    return new Result('success')
  }
  // Here we create a TerriaError with message "Some Error inside result"
  return new Result(undefined, TerriaError.from("Some error inside result"))
}

// Here we add `TerriaErrorOverrides` in throwIfError.
// This is equivalent to calling `createParentError()` on the error inside inside result.
// Eg. error.createParentError("Some error outside of result")
const value = someFn(someArg).throwIfError("Some error outside of result")
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

## TerriaError object

### TerriaErrorSeverity

Add TerriaErrorSeverity enum, values can be Error or Warning.

    Errors with severity Error are presented to the user. Warning will just be printed to console.
    By default, errors will use Warning
    The folloring errors will use Error severity.
        Loading map config
        Loading/Applying init source (excluding shareData and stories)
        Invalid model object (fails to parse as JSON)
        Loading models if it is in the workbench
        Loading catalog items in the workbench
    TerriaError.shouldRaiseToUser will look at all error severity in the entire tree of errors, and use the highest one.
        For example, if all errors in a tree are Warning, but there is one error with Error severity, the entire tree will be "raised to the user".

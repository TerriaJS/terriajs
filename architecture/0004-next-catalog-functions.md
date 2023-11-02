# 2. _Next_ Catalog Functions

Date: 2020-11-03

## Status

Accepted

## Context

### Intro

Catalog functions have function parameters, which are rendered as a form. The user then creates catalog function jobs with the form.

Catalog function jobs take those parameters, perform some unit of work (usually on a server), download results, and show results as catalog items - all job state is handled by catalog function job (eg starting, polling, error handling...)

### What do we need

- To make share work
  - Save catalog function state (specifically `FunctionParameter` state) - so values entered by user in form are saved
  - Save catalog function job state - so jobs can be shared and recovered (regardless of `jobStatus` - inactive, running, finished...)
- Create simple Mixin for `CatalogFunction` and `CatalogFunctionJob` to make creating catalog functions easier
- Typescript everything
- Remove WPS specifics from `FunctionParameters`

## Decision

We decided on the following structure:

### FunctionParameters

Similar to `SelectableDimensions`, but is a class instead of interface, and it wraps up interaction with `CatalogFunctionMixin's` `parameters` trait - it has a `setValue` and `clearValue` method which sets `catalogFunction.parameters[functionParameter.id]`

A few examples of function parameters:

- `DateTimeParameter`
- `StringParameter`
- `PolygonParameter`

`CatalogFunctionMixin` function parameters are defined in the implementation's `get functionParameters(): FunctionParameter[]`

Function parameters should be stateless other than the `parameters` trait (or other traits attached to the `CatalogFunctionMixin`, as they may be deleted and re-created as other observable/computed properties change.

For more info see CatalogFunctionMixin#functionParameters

### CatalogFunctionMixin

Extends `CatalogMemberMixin` - adds the following:

#### `parameters:JsonValue` trait

Contains values for `functionParameters`.

#### `functionParameters`

```ts
@computed
abstract get functionParameters(): FunctionParameter[];
```

Function parameters are rendered as `ParameterEditors`, their values directly map to the `parameters` trait. When a `FunctionParameter` value is modified, it will automatically update `parameters` trait.

When a job is created, the `parameters` are copied across automatically (see `CatalogFunctionMixin#submitJob`)

#### `createJob()`

```ts
protected abstract createJob(id: string): Promise<CatalogFunctionJobMixin>
```

Note: `name` and `parameters` traits are automatically copied across when submitted (see `CatalogFunctionMixin#submitJob`)
All user-configured job parameters should be in the `parameters` trait, this is the ensure that function parameter state behaves correctly, and that values can be easily copied across jobs.

Other job traits can be set in this function, as long as they aren't related to function parameters - for example the `url` and `processIdentier` trait for WPS are copied from the WPSCatalogFunction.

#### `submitJob()`

```ts
 async submitJob(): Promise<CatalogFunctionJobMixin>
```

Submit job:

- create new job - see `CatalogFunctionMixin#createJob`
- sets job traits (`name`, `parameters`, `jobStatus`, ...)
- invokes job see `CatalogFunctionJobMixin#invoke`
- adds to workbench/models (in user added data)
- returns new job

### CatalogFunctionJobMixin

Extends `AutoRefreshTraits` (to handle polling for job results), `CatalogFunctionTraits` (which only contains `parameters` trait) and adds the following:

#### `logs: string[]` trait

For log messages

#### `jobStatus: "inactive" | "running" | "error" | "finished"` trait

`jobStatus` should not be modified outside of `CatalogFunctionJobMixin`

#### `_invoke()`

```ts
protected abstract async _invoke(): Promise<boolean>;
```

Must be implemented.

Returns `true` for FINISHED, `false` for RUNNING (will then call `pollForResults`)

#### `invoke()`

This wraps up `_invoke()` and handles changes to `jobStatus` and `refreshEnabled` based on return value of `_invoke()`

#### `pollForResults()`

```ts
async pollForResults(): Promise<boolean>
```

Called every `refreshInterval`. Usually here you would poll a server for job status (for example WPS)

This returns`true` if job has finished, `false` otherwise (which will continue polling).  
If the job "fails" - `setOnError(message:string)` is called

This behaves like AutoRefreshMixin's `refreshData` (implemented in `CatalogFunctionJobMixin`)

#### `onJobFinish()`

```ts
private async onJobFinish(addToWorkbench = this.inWorkbench)
```

This handles downloading job results, it can be triggered three ways:

- `_invoke()` returns `true` (see CatalogFunctionJobMixin#invoke)
- `pollForResults()` returns `true` (see CatalogFunctionJobMixin#refreshData)
- on `loadMetadata` if `jobStatus` is "finished", and `!downloadedResults` (see CatalogFunctionJobMixin#forceLoadMetadata)

#### `downloadResults()`

```ts
    abstract async downloadResults(): Promise<
      CatalogMemberMixin.Instance[] | void
    >;
```

Called in `onJobFinish()`
returns catalog members which are added to the workbench

#### `results`

```ts
results: CatalogMemberMixin.Instance[]
```

Job result `CatalogMembers` - set from calling `CatalogFunctionJobMixin#downloadResults` (in `CatalogFunctionJobMixin#onJobFinish`)

#### Job history

Jobs are added to the My Data tab when submitted - they act like Catalog Groups - all results are members of the `CatalogFunctionJob`

## Consequences

This is a large change from v7 CatalogFunctions, and there are quite a few assumptions about how the new structure will be used.

We will find bugs and it will need refining as we use it more.

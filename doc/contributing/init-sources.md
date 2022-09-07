## `InitSource`

Init sources contain information used to load a Terria instance - for example `catalog`, `homeCamera` etc.

See [Initialization file](../customizing/initialization-files.md) for JSON structure. This document outlines `InitSource` for developers

### Types of `InitSource`

In order they are applied:

- URL to [Initialization file](../customizing/initialization-files.md) specified in [`initializationUrls` in Client-side config](../customizing/client-side-config.md#intializationurls)
- Init fragment paths, for example
  - `#simple` - will be resolved using [`initFragmentPaths` in Client-side config](../customizing/client-side-config.md#parameters)
  - `#https://some.url/config.json`
- Start data - `#start=ShareData`
  - Note: uses [`ShareData`](../customizing/client-side-config.md#sharedata) format - which is slightly different from [Initialization file](../customizing/initialization-files.md) format
  - See [`StartData` examples](#startdata-examples)

Any number of `InitSources` can be specified

When they are applied, some properties may overwrite each other - for example `workbench`. Other properties will be merged - for example `catalog`.

### Example

We have the following map URL

- `http://ci.terria.io/main/#https://some.url/config.json`

Which loads `http://ci.terria.io/main` with the following [Client-side config](../customizing/client-side-config.md):

- `http://ci.terria.io/main/config.json`

The config has :

- `initializationUrls = ["simple"] `
- `initFragmentPaths = undefined` (default is `["init/"]`)

So the init URL then resolves to:

- `http://ci.terria.io/main/init/simple.json`

Then, as the URL has fragment path (`#https://some.url/config.json`), another `InitSource` is created:

- `https://some.url/config.json`

Terria will then load both `InitSources` in order:

1. `http://ci.terria.io/main/init/simple.json`
2. `https://some.url/config.json`

### Secondary types

These are also treated as `InitSources` - but don't provide ability to set init JSON or URL to init JSON

- `#share=shareId`
- `/catalog/:id` route
- `/story/:shareId` route (same as `#share=shareId`, but will automatically start story)

### `StartData` examples

http://ci.terria.io/main/#start={%22version%22:%228.0.0%22,%22initSources%22:[%22https://some.url/config.json%22]}

Uses JSON:

```json
{
  "version": "8.0.0",
  "initSources": ["https://some.url/config.json"]
}
```

Or you can include Init JSON instead of URL

http://ci.terria.io/main/#start={%22version%22:%228.0.0%22,%22initSources%22:[{%22catalog%22:[]}]}

```json
{
  "version": "8.0.0",
  "initSources": [
    {
      "catalog": []
    }
  ]
}
```

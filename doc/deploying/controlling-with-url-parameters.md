# Controlling Terria with URL parameters

Many aspects of TerriaJS (and hence TerriaMap, NationalMap, and others) can be configured by the end user by passing URL parameters. Combine them like this:

- The base URL, then a `#`
- Then the first parameter
- Then repeatedly: a `&`, and the next parameter

For example: [http://nationalmap.gov.au#test&map=2d](http://nationalmap.gov.au#test&map=2d)

### Display parameters

| Parameter            | Meaning                                                                                                                                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clean`              | Don't load the default [init/catalog file](../customizing/initialization-files.md) for this site.                                                                                                                                                                                                                |
| `map=2d`             | Use the 2D (Leaflet) map, instead of the default.                                                                                                                                                                                                                                                                |
| `map=3d`             | Use the 3D (Cesium) map, instead of the default.                                                                                                                                                                                                                                                                 |
| `map=3dSmooth`       | Use the 3D (Cesium) map without terrain, instead of the default.                                                                                                                                                                                                                                                 |
| `playStory=1`        | Automatically start playing the map's Story, if there is one.                                                                                                                                                                                                                                                    |
| `hideWorkbench=1`    | Collapse the workbench (left side) panel, useful for embedding. Also automatically plays a story, if there is one.                                                                                                                                                                                               |
| `mode=preview`       | Operate in "preview mode", which mostly means not showing a warning if the screen is `small`                                                                                                                                                                                                                     |
| `share=`...          | Load a map view previously saved using the "Share" function with URL shortening.                                                                                                                                                                                                                                 |
| `start=`...          | Load a map view previously saved without URL shortening. The argument is a URL-encoded JSON structure defined using an internal format described below.                                                                                                                                                          |
| `<initfile>`         | Load [init/catalog file](../customizing/initialization-files.md) as described below. This can be a URL to an init file - or an "init fragment" (eg `simple` - which resolves to `init/simple.json`). See `initFragmentPaths` in [client side config parameters](../customizing/client-side-config.md#parameters) |
| `hideWelcomeMessage` | Forces the welcome message not to be displayed.                                                                                                                                                                                                                                                                  |
| `ignoreErrors=1`     | Ignore **all** error messages.                                                                                                                                                                                                                                                                                   |
| `configUrl=`...      | Overwrite Terria config URL in **dev environment only**.                                                                                                                                                                                                                                                         |

### Catalog files (init files)

Any unrecognised parameter (eg `foo` or `http://foo.com/bar.json`) is treated as an "Init Source".
These can be [Init Fragments](../customizing/client-side-config.md#init-fragment) (eg `foo`) or [Init URLs](../customizing/client-side-config.md#init-url) (eg `http://foo.com/bar.json`)

[Init fragments](../customizing/client-side-config.md#init-fragment) are resolved using Client-side config [`parameters.initFragmentPaths`](../customizing/client-side-config.md#parameters) (which defaults to `"init/"`). For example, `foo` would become `init/foo.json`

Multiple catalog files can be loaded this way, and will be combined. Files are loaded in order provided.

**Note:** relative URLs (and relative init fragments) in hash are resolved using **base URL of the map** - where as relative URLs in Client-side config [`initializationUrls`](../customizing/client-side-config.md#intializationurls) and resolved using **base URL of config URL**

For example, http://nationalmap.gov.au#test will load init file http://nationalmap.gov.au/init/test.json

Full Init file docs are [available here](../customizing/initialization-files.md)

### Start data (`ShareData`)

Full `ShareData` docs are [available here](../customizing/initialization-files.md#sharedata)

The `start=` parameter essentially embeds an entire init/catalog file in the URL. The format is:

```
{
    "version": "8.0.0",
    "initSources": [
        "init/nm.json",
        "init/test.json",
        ...
        {
            "catalog": [
            ...
            ]
        },
        {
            "homeCamera": {
                "west": ...,
                "south": ...,
                "east": ...,
                "north": -...
            },
            "viewerMode": "3d"
        }
    ]
    }
}
```

The exact structure changes as features are added. The best way to understand it is:

1. Adjust the view as desired
2. Generate a share link
3. URL-decode the share link (using a tool [such as this](http://www.url-encode-decode.com/)).

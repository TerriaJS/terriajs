Many aspects of TerriaJS (and hence TerriaMap, NationalMap, and others) can be configured by the end user by passing URL parameters. Combine them like this:

* The base URL, then a `#`
* Then the first parameter
* Then repeatedly: a `&`, and the next parameter

For example: [http://nationalmap.gov.au#test&map=2d](http://nationalmap.gov.au#test&map=2d)


### Display parameters

Parameter      | Meaning
---------------|--------
`clean`          | Don't load the default catalog files for this site.
`map=2d`         | Use the 2D (Leaflet) map, instead of the default.
`map=3d`         | Use the 3D (Cesium) map, instead of the default.
`map=3dSmooth`   | Use the 3D (Cesium) map without terrain, instead of the default.
`playStory=1`    | Automatically start playing the map's Story, if there is one.
`hideWorkbench=1` | Collapse the workbench (left side) panel, useful for embedding. Also automatically plays a story, if there is one.
`mode=preview`   | Operate in "preview mode", which mostly means not showing a warning if the screen is `small`  
`share=`...      | Load a map view previously saved using the "Share" function with URL shortening.
`start=`...      | Load a map view previously saved without URL shortening. The argument is a URL-encoded JSON structure defined using an internal format described below.
`<initfile>`     | Load catalog file as described below.
`hideWelcomeMessage` | Forces the welcome message not to be displayed.
`ignoreErrors=1` | Ignore **all** error messages.
`configUrl=`... | Overwrite Terria config URL in **dev environment only**.

### Catalog files (init files)

Any unrecognised parameter (eg `foo`) is treated as the name of a catalog file, loaded from the directory `wwwroot/init/foo.json`). Multiple catalog files can be loaded this way, and will be combined. Later files can override earlier ones.

Example: [http://nationalmap.gov.au#test](http://nationalmap.gov.au#test)

### Start data

The `start=` parameter essentially embeds an entire catalog file in the URL. The format is:

```
{
    "version": "0.0.05",
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
            "initialCamera": {
                "west": <lon>,
                "south": <lat>,
                "east": <lon>,
                "north": <lat>,
                "position": {
                    "x": ...,
                    "y": ...,
                    "z": ...
                },
                "direction": {
                    "x": ...,
                    "y": ...,
                    "z": ...
                },
                "up": {
                    "x": ...,
                    "y": ...,
                    "z": ...
                }
            },
            "homeCamera": {
                "west": ...,
                "south": ...,
                "east": ...,
                "north": -...
            },
            "baseMapName": "Positron (Light)",
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

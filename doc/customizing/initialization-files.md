A catalog in TerriaJS is defined in one or more "initialization files" (or init files).  In a default TerriaMap installation, the main init file is found in `wwwroot/init/terria.json`.

An init file is a [JSON file](https://en.wikipedia.org/wiki/JSON) with this basic structure:

```
{
    "catalog": [
        {
            "type": "group",
            "name": "My group",
            "items": [
            ...
            ]
        },
        ...
    ],
    "homeCamera": {
        "north": -8,
        "east": 158,
        "south": -45,
        "west": 109
    },
    "initialCamera": { ... },
    "corsDomains": [ "myserver.gov.au" ]
}
```

Key points:

* `catalog` is an array.
* Every element of that array must have a `type` (corresponding to a value recognised by TerriaJS) and a `name`.
* The three major categories of catalog member types are:
    - [Catalog Group](../connecting-to-data/catalog-groups.md): A group (folder) of items.  Different group types allow the contents to be manually specified or to be automatically determined by querying various types of server.
    - [Catalog Item](../connecting-to-data/catalog-items.md): Actual geospatial or chart data from a file or service, in various formats.
    - [Catalog Function](../connecting-to-data/catalog-functions.md): A parameterized service, such as a Web Processing Service (WPS).  The user supplies the parameters and gets back some result.

Most of the other properties of each layer depend on the specific type.  See the links above for details of each type.

### Using a catalog file

There are four ways to load a catalog file into a TerriaJS application:

1. Store it in Terria Map's `wwwroot/init` directory, and refer to it in the `initializationUrls` section of the [`config.json`](../customizing/client-side-config.md) file. It is loaded automatically when you visit the webpage.  This is how `wwwroot/init/terria.json` is loaded in the default TerriaMap setup.
2. Store it in Terria Maps's `wwwroot/init` directory, without adding it to config.json. Add the catalog file name (without `.json`) to the URL after `#`. For instance, `example.com/terria#mycatalog`. See [Controlling with URL Parameters](../deploying/controlling-with-url-parameters.md) for more information. This method is useful when developing a catalog that is not quite ready for public access, but it is helpful to show it to interested stakeholders.
3. Store it anywhere on the web (on a [CORS-enabled](../connecting-to-data/cross-origin-resource-sharing.md) server). Add the complete URL (including `.json`) to the URL, after `#`. For instance, `http://nationalmap.gov.au/#http://example.com/mycatalog.json`. This method is useful when developing services for a TerriaJS instance which you don't directly control, and for rapidly previewing changes which you can also share with people.
4. Store it locally, then drag and drop it into the Terria Map window.

All catalog files, however loaded, are merged together in TerriaJS. Any two items with the same name and place in the tree are combined. This means that if two catalog files each define a group called "Water", there will be only one "Water" group in Terria, containing the two sets of group members merged together.

### Editing catalog files

Catalog files can be edited three ways:

1. Using a desktop text editor. Be very careful to ensure that your file is valid JSON. This is more restrictive format than simple JavaScript, for instance. You can use [http://jsonlint.com/](http://jsonlint.com/).
2. Using a JSON-specific editor, such as [http://www.jsoneditoronline.org/](http://www.jsoneditoronline.org/). This has the advantage that your file will be valid JSON.
3. Using the TerriaJS Catalog Editor, currently available in a preview version at [http://terria.io/DataSourceEditor/](http://terria.io/DataSourceEditor/). This editor is not yet considered reliable, and may cause data corruption.

## Catalog file properties

### `corsDomains`

By default, TerriaJS proxies all requests within the proxy whitelist specified in the [Server-side Config](server-side-config.md), making the assumption that the servers do not support CORS. You can add hosts that are known to support CORS to this property to avoid proxying them.

`"corsDomains": [ "myserver.gov.au" ]`

See [Cross-Origin Resource Sharing](../connecting-to-data/cross-origin-resource-sharing.md) for more information.

### `homeCamera` and `initialCamera`

Maps have two camera positions, `homeCamera` and `initialCamera`. They are specified identically. All the examples here use `homeCamera`, but apply equally to both.

* `initialCamera`: the location when the map first displays
* `homeCamera`: where the camera goes when you click the "home" button between the zoom-in and zoom-out buttons.

#### Option 1: `north`, `south`, `east`, `west`

The bounding box method uses `north`, `east `,`south`, and `west`, in lat/lng decimal degrees.  The camera will be positioned in the center point of those bounds, looking toward the Earth's center, zoomed back enough to see to the edges of the bounds.

This is the only mode supported in 2D mode (Leaflet). Therefore, you should always include a bounding box, even if you also use another mode.

```
"homeCamera": {
    "north": -8,
    "east": 158,
    "south": -45,
    "west": 109
}
```

#### Option 2: `position`, `direction` and `up` 

This overrides Option 1.

You can specify `position`, `direction`, and `up` (as well as
`north`, `east `,`south`, and `west`). `position`, `direction` and `up`
need `x`, `y` and `z` keys specifying locations in
[ECEF](https://en.wikipedia.org/wiki/ECEF) metre coordinates, which
means the origin is the centre of the Earth, positive Z points to
the north pole, positive X points toward
["Null Island"](https://en.wikipedia.org/wiki/Null_Island) where the
equator intersects with 0 degrees longitude, and positive Y points at
(0, 90E) -- which is in the Indian Ocean south of the Bay of Bengal.

* `position`: where the camera is
* `direction`: where the camera is looking
* `up`: which way is "up", which determines how the camera is rotated

For most purposes positioning this way is difficult for normal
humans. To see an example, move the camera to some location, click the "share" button (and choose to not use the
URL shortner), then URL-decode the URL you get.

```
"homeCamera": {
    "west": 105.51019777628066,
    "south": -39.61110094535454,
    "east": 161.48980219597954,
    "north": -9.09249015267353,
    "position": {
        "x": -6685409.955422118,
        "y": 7044952.140379313,
        "z": -4828130.30167422
    },
    "direction": {
        "x": 0.6155666547559182,
        "y": -0.6486719065674744,
        "z": 0.4475516184561574
    },
    "up": {
        "x": -0.30807420442344124,
        "y": 0.3246424737331665,
        "z": 0.8942580996654569
    }
}
```

#### Option 3: `positionHeading` (like an aircraft)

Setting `positionHeading` is useful for when you're showing a view from an aircraft or
satellite, and overrides Options 1 and 2.

It has the following attributes:

 - `cameraLongitude`: longitude of camera
 - `cameraLatitude`: latitude of camera
 - `cameraHeight`: height of camera above earth's surface, probably in metres
 - `heading`: in degrees clockwise from north (90 is east)
 - `pitch`: how much the camera is tilted, in degrees down from horizontal (-90 is straight down)
 - `roll`: how much the camera is rotated left or right, in degrees

```
"homeCamera": {
    "positionHeading": {
        "cameraLongitude": 145,
        "cameraLatitude": -37,
        "cameraHeight": 1000,
        "heading": 0,
        "pitch": -70,
        "roll": 0,
    }
}
```

#### Option 4: `lookAt` (a feature)

`lookAt` is probably the most useful one for showing a feature on the
map, and overrides Options 1, 2, and 3.

It has these attributes:

 - `targetLongitude`: The longitude to look at
 - `targetLatitude`: The latitude to look at
 - `targetHeight`: in meters above the WGS84 ellipsoid (positive is up)
 - `heading`: in degrees clockwise from north
 - `pitch`: in degrees down from horizontal (so negative values mean you're looking at the sky)
 - `range`: in meters from the thing you're looking at

```
"homeCamera": {
    "lookAt": {
        "targetLongitude": 145,
        "targetLatitude": 37,
        "targetHeight": 0,
        "heading": 0,
        "pitch": -90,
        "range": 1000,
    }
}
``` 

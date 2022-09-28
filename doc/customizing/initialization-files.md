## Terria Initialization file (`InitSource`)

A catalog in TerriaJS is defined in one or more "initialization files" (or init files). In a default TerriaMap installation, the main init file is found in `wwwroot/init/simple.json`.

An init file is a [JSON file](https://en.wikipedia.org/wiki/JSON) with this basic structure:

```json
{
    "catalog": [
        {
            "type": "group",
            "name": "My group",
            "members": [
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
    "corsDomains": [ "myserver.gov.au" ],
    "baseMaps": {
      "items": [
        {
          "item": {
            "id": "basemap-darkmatter",
            "name": "Dark Matter",
              ...
          },
          "image": "/images/dark-matter.png"
        }
      ],
    },
    ...
}
```

Key points:

- `catalog` is an array.
- Every element of that array must have a `type` (corresponding to a value recognised by TerriaJS) and a `name`.
- The three major categories of catalog member types are:
  - [Catalog Group](../connecting-to-data/catalog-groups.md): A group (folder) of items. Different group types allow the contents to be manually specified or to be automatically determined by querying various types of server.
  - [Catalog Item](../connecting-to-data/catalog-items.md): Actual geospatial or chart data from a file or service, in various formats.
  - [(Docs not yet available) Catalog Function](../connecting-to-data/catalog-functions.md): A parameterized service, such as a Web Processing Service (WPS). The user supplies the parameters and gets back some result.

Most of the other properties of each layer depend on the specific type. See the links above for details of each type.

### Using an init file

There are four ways to load an init file into a TerriaJS application:

1. Store it in Terria Map's `wwwroot/init` directory, and refer to it in the `initializationUrls` section of the [`config.json`](../customizing/client-side-config.md) file. It is loaded automatically when you visit the webpage. This is how `wwwroot/init/terria.json` is loaded in the default TerriaMap setup.
2. Store it in Terria Maps's `wwwroot/init` directory, without adding it to config.json. Add the init file name (without `.json`) to the URL after `#`. For instance, `example.com/terria#mycatalog`. See [Controlling with URL Parameters](../deploying/controlling-with-url-parameters.md) for more information. This method is useful when developing a catalog that is not quite ready for public access, but it is helpful to show it to interested stakeholders.
3. Store it anywhere on the web (on a [CORS-enabled](../connecting-to-data/cross-origin-resource-sharing.md) server). Add the complete URL (including `.json`) to the URL, after `#`. For instance, `http://nationalmap.gov.au/#http://example.com/mycatalog.json`. This method is useful when developing services for a TerriaJS instance which you don't directly control, and for rapidly previewing changes which you can also share with people.
4. Store it locally, then drag and drop it into the Terria Map window.

All init files, however loaded, are merged together in TerriaJS. Any two items with the same name and place in the tree are combined. This means that if two init files each define a group called "Water", there will be only one "Water" group in Terria, containing the two sets of group members merged together.

### Editing init files

Init files can be edited two ways:

1. Using a desktop text editor. Be very careful to ensure that your file is valid JSON. This is more restrictive format than simple JavaScript, for instance. You can use [http://jsonlint.com/](http://jsonlint.com/).
2. Using a JSON-specific editor, such as [http://www.jsoneditoronline.org/](http://www.jsoneditoronline.org/). This has the advantage that your file will be valid JSON.

## Init file properties

| Name              | Required | Type                                                                                                                                                                                                  | Default | Description                                                                                                                                                                                                                                                                              |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corsDomains`     | no       | **string[]**                                                                                                                                                                                          |         | By default, TerriaJS proxies all requests within the proxy whitelist specified in the [Server-side Config](server-side-config.md), making the assumption that the servers do not support CORS. You can add hosts that are known to support CORS to this property to avoid proxying them. |
| `catalog`         | no       | [**`CatalogItem[]`**](../connecting-to-data/catalog-items.md), [**`CatalogGroup[]`**](../connecting-to-data/catalog-groups.md), [**`CatalogFunction[]`**](../connecting-to-data/catalog-functions.md) |         | An array of catalog items, groups and functions. Check example above.                                                                                                                                                                                                                    |
| `initialCamera`   | no       | [**`CameraPosition`**](#CameraPosition)                                                                                                                                                               |         | The location when the map first displays.                                                                                                                                                                                                                                                |
| `stories`         | no       | [**`Story[]`**](#story)                                                                                                                                                                               |         | An array of stories to be loaded.                                                                                                                                                                                                                                                        |
| `viewerMode`      | no       | **`"3d"`** or **`"3dSmooth"`** or **`"2D"`**                                                                                                                                                          | `"3d"`  | The id of the viewer mode to be shown initialy.                                                                                                                                                                                                                                          |
| `homeCamera`      | yes      | [**`CameraPosition`**](#CameraPosition)                                                                                                                                                               |         | Where the camera goes when you click the "home" button between the zoom-in and zoom-out buttons.                                                                                                                                                                                         |
| `baseMaps`        | no       | [**`baseMaps`**](#base-maps)                                                                                                                                                                          |         | The definition of the base maps to be shown to the user.                                                                                                                                                                                                                                 |
| `showSplitter`    | no       | **`boolean`**                                                                                                                                                                                         | `false` | Show splitter initally.                                                                                                                                                                                                                                                                  |
| `splitPosition`   | no       | **`number`**                                                                                                                                                                                          | `0.5`   | The position of splitter.                                                                                                                                                                                                                                                                |
| `workbench`       | no       | **`string[]`**                                                                                                                                                                                        |         | List of items ids to initially add to workbench.                                                                                                                                                                                                                                         |
| `previewedItemId` | no       | **`string`**                                                                                                                                                                                          |         | ID of the catalog member that is currently being previewed.                                                                                                                                                                                                                              |
| `settings`        | no       | [**`settings`**](#advanced-settings)                                                                                                                                                                  |         | Additional (more advanced) settings.                                                                                                                                                                                                                                                     |

### CameraPosition

#### Option 1: `north`, `south`, `east`, `west`

The bounding box method uses `north`, `east `,`south`, and `west`, in lat/lng decimal degrees. The camera will be positioned in the center point of those bounds, looking toward the Earth's center, zoomed back enough to see to the edges of the bounds.

This is the only mode supported in 2D mode (Leaflet). Therefore, you should always include a bounding box, even if you also use another mode.

| Name    | Required | Type         | Default | Description |
| ------- | -------- | ------------ | ------- | ----------- |
| `north` | yes      | **`number`** |         |             |
| `east`  | yes      | **`number`** |         |             |
| `south` | yes      | **`number`** |         |             |
| `west`  | yes      | **`number`** |         |             |

**Example**

```json
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

| Name        | Required | Type                              | Default | Description                                                    |
| ----------- | -------- | --------------------------------- | ------- | -------------------------------------------------------------- |
| `position`  | yes      | [**`Cartesian 3`**](#cartesian-3) |         | location of the camera.                                        |
| `direction` | yes      | [**`Cartesian 3`**](#cartesian-3) |         | The location camera is looking at.                             |
| `up`        | yes      | [**`Cartesian 3`**](#cartesian-3) |         | Which way is "up", which determines how the camera is rotated. |

For most purposes positioning this way is difficult for normal
humans. To see an example, move the camera to some location, click the "share" button (and choose to not use the
URL shortner), then URL-decode the URL you get.

**Example**

```json
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

Setting `positionHeading` is useful for when you're showing a view from an aircraft or satellite, and overrides Options 1 and 2.

| Name              | Required | Type         | Default | Description                                                                            |
| ----------------- | -------- | ------------ | ------- | -------------------------------------------------------------------------------------- |
| `cameraLongitude` | yes      | **`number`** |         | Longitude of camera                                                                    |
| `cameraLatitude`  | yes      | **`number`** |         | Latitude of camera                                                                     |
| `cameraHeight`    | yes      | **`number`** |         | Height of camera above earth's surface, probably in metres                             |
| `heading`         | yes      | **`number`** |         | In degrees clockwise from north (90 is east)                                           |
| `pitch`           | yes      | **`number`** |         | How much the camera is tilted, in degrees down from horizontal (-90 is straight down). |
| `roll`            | yes      | **`number`** |         | How much the camera is rotated left or right, in degrees.                              |

**Example**

```json
"homeCamera": {
    "positionHeading": {
        "cameraLongitude": 145,
        "cameraLatitude": -37,
        "cameraHeight": 1000,
        "heading": 0,
        "pitch": -70,
        "roll": 0
    }
}
```

#### Option 4: `lookAt` (a feature)

`lookAt` is probably the most useful one for showing a feature on the
map, and overrides Options 1, 2, and 3.

| Name              | Required | Type         | Default | Description                                                                                                         |
| ----------------- | -------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `targetLongitude` | yes      | **`number`** |         | The longitude to look at.                                                                                           |
| `targetLatitude`  | yes      | **`number`** |         | The latitude to look at.                                                                                            |
| `targetHeight`    | yes      | **`number`** |         | In meters above the WGS84 ellipsoid (positive is up).                                                               |
| `heading`         | yes      | **`number`** |         | In degrees clockwise from north.                                                                                    |
| `pitch`           | yes      | **`number`** |         | How much the camera is tilted, in degrees down from horizontal (so negative values mean you're looking at the sky). |
| `range`           | yes      | **`number`** |         | In meters from the thing you're looking at.                                                                         |

**Example**

```json
"homeCamera": {
    "lookAt": {
        "targetLongitude": 145,
        "targetLatitude": 37,
        "targetHeight": 0,
        "heading": 0,
        "pitch": -90,
        "range": 1000
    }
}
```

### Story

Definition of the story. This can be pretty complex to define for the standard user, the easiest way is to generate share url without url shortener.

| Name        | Required | Type                          | Default | Description         |
| ----------- | -------- | ----------------------------- | ------- | ------------------- |
| `id`        | yes      | **`string`**                  |         | Id of the story.    |
| `title`     | yes      | **`string`**                  |         | Title of the story. |
| `text`      | yes      | **`string`**                  |         | Text of the story.  |
| `shareData` | yes      | [**`ShareData`**](#sharedata) |         |                     |

#### ShareData

| Name          | Required | Type                         | Default   | Description                                                       |
| ------------- | -------- | ---------------------------- | --------- | ----------------------------------------------------------------- |
| `version`     | yes      | **`string`**                 | `"8.0.0"` | The version of share data.                                        |
| `initSources` | yes      | **`(string \| InitFile)[]`** |           | Array of Init URLs and/or [**`InitFile`**](#init-file-properties) |

### <a id="base-maps"></a>`baseMaps`

Definition of the base map model.

| Name                                          | Required | Type                               | Default                                                                                                           | Description                                                                                                                                                                                                                                                |
| --------------------------------------------- | -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| <a id="basemaps-items"></a>`items`            | no       | [**`basemapItem`**](#basemap-item) | [default list of basemaps](https://github.com/TerriaJS/terriajs/blob/main/lib/Models/BaseMaps/defaultBaseMaps.ts) | The array of the base maps to be shown to the user. It will be combined with default list. To override the default basemap definition specify the id of the default basemap and parameter that need to be overriden.                                       |
| `defaultBaseMapId`                            | no       | **`string`**                       |                                                                                                                   | The id of the baseMap user will see on the first mapLoad. The value must be an id of the catalog item from the [**`enabledBaseMaps`**](#enabledbasemaps) array.                                                                                            |
| `previewBaseMapId`                            | no       | **`string`**                       |                                                                                                                   | The id of the baseMap to be used as the base map in data preview. The value must be an id of the catalog item from the [**`enabledBaseMaps`**](#enabledbasemaps) array.                                                                                    |     |
| <a id="enabledbasemaps"></a>`enabledBaseMaps` | no       | **`string[]`**                     | _all_                                                                                                             | Array of base maps ids that is available to user. Use this do define order of the base maps in settings panel. Leave undefined to show all basemaps. The values must be an ids of the catalog item from the [**`baseMaps items`**](#basemaps-items) array. |

**Example**

```json
  "baseMaps": {
    "items": [
      {
        "item": {
          "id": "basemap-positron",
          "name": "Base map positron customized name",
        },
        "image": "build/TerriaJS/images/time-series-guide.jpg"
      },
      {
        "item": {
          "id": "test-basemap",
          "name": "Voyager with labels",
          "type": "open-street-map",
          "url": "https://basemaps.cartocdn.com/rastertiles/voyager_labels_under/",
          "attribution": "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
          "subdomains": ["a", "b", "c", "d"],
          "opacity": 1.0
        },
        "image": "build/TerriaJS/images/Australia.png"
      },
      {
        "item": "//Surface Geology",
        "image": "build/TerriaJS/images/Australia.png"
      }
    ],
    "defaultBaseMapId": "basemap-positron",
    "previewBaseMapId": "basemap-natural-earth-II"
  }
```

### <a id="basemap-item"></a>`baseMapItem`

Definition of the baseMap model.

| Name    | Required | Type                                                         | Default | Description                                                                                                                                             |
| ------- | -------- | ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `item`  | yes      | [**`Catalog Item`**](../connecting-to-data/catalog-items.md) |         | Catalog item defition to be used for the base map. It is also possible to reference an existing catalog item using its id (i.e. `"//Surface Geology"`). |
| `image` | yes      | **`string`**                                                 |         | Path to an image file of the baseMap image to be shown in Map Settings                                                                                  |

### Cartesian 3

| Name | Required | Type         | Default | Description      |
| ---- | -------- | ------------ | ------- | ---------------- |
| `x`  | yes      | **`number`** |         | The X component. |
| `y`  | yes      | **`number`** |         | The Y component. |
| `z`  | yes      | **`number`** |         | The Z component. |

### <a id="advanced-settings"></a>`settings`

Additional more advanced settings.

| Name                             | Required | Type          | Default | Description                                                                                                                                                         |
| -------------------------------- | -------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseMaximumScreenSpaceError`    | no       | **`number`**  | `2`     | Base ratio for maximumScreenSpaceError                                                                                                                              |
| `useNativeResolution`            | no       | **`boolean`** | `false` | Use the device's native resolution (sets cesium.viewer.resolutionScale to a ratio of devicePixelRatio)                                                              |
| `alwaysShowTimeline`             | no       | **`boolean`** | `false` | Always show the timeline                                                                                                                                            |
| `baseMapId`                      | no       | **`string`**  |         | Selected basemap ID. This is used to save basemap for shares/stories. Please use `InitSource.baseMaps.defaultBaseMapId` instead. (See [**`baseMaps`**](#base-maps)) |
| `terrainSplitDirection`          | no       | **`number`**  | `0`     | Which side of splitter terrain is on (-1 = left, 0 = both, 1 = right)                                                                                               |
| `depthTestAgainstTerrainEnabled` | no       | **`boolean`** | `false` | Enables "Terrain hides underground features"                                                                                                                        |

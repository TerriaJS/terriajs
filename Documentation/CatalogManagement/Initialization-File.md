## Catalog (init) files

A catalog in Terria is defined in one or more catalog files (also known as "init files"). Each is a [JSON file](https://en.wikipedia.org/wiki/JSON) with this basic structure:

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
    }
}
```

Key points:

* `catalog` is an array
* Every element of that array must have a `type` (corresponding to a value recognised by TerriaJS) and a `name`
* The three major categories of catalog member types are:
    - `group`: a manually defined grouping of layers
    - item types such as `geojson`, `wms`, `wfs` and `esri-mapServer`, which refer to one single layer
    - group types such as `ckan`, `wms-getCapabilities` and `esri-mapServer-group`

Most of the other properties of each layer depend on the specific type. We're working on generating documentation for each type. Meanwhile, you can look at the source code in Terria's [/Models](/Models) folder.

### Using a catalog file

There are four ways to load a catalog file into Terria:

1. Store it in Terria's `wwwroot/init` directory, and refer to it in the `initializationUrls` section of the [`config.json`](../Customizing/Config-JSON.md) file. It is loaded automatically when you visit the webpage.
2. Store it in Terria's `wwwroot/init` directory, without adding it to config.json. Add the catalog file name (without `.json`) to the URL after `#`. For instance, `example.com/terria#mycatalog`. See [TerriaJS URL parameters](../Customizing/TerriaJS-URL-parameters.md) for more information. This method is useful when developing catalog services which are not quite ready for public access, but for showing to interested stakeholders.
3. Store it anywhere on the web (on a CORS-enabled server). Add the complete URL (including `.json`) to the URL, after `#`. For instance, `nationalmap.gov.au/#http://example.com/mycatalog.json`. This method is useful when developing services for a Terria instance which you don't directly control, and for rapidly previewing changes which you can also share with people.
4. Store it locally, then drag and drop it into the Terria window.

If using method 3, please note:

- Files on Github, including Gist files, are not served with CORS. However, you can access them through a third-party service, rawgit.com. For instance, https://github.com/TerriaJS/terriajs/blob/master/wwwroot/test/init/test-tablestyle.json can be accessed as https://rawgit.com/TerriaJS/terriajs/master/wwwroot/test/init/test-tablestyle.json.

All catalog files, however loaded, are merged together in Terria. Any two items with the same name and place in the tree are combined. This means that if two catalog files each define a group called "Water", there will be only one "Water" group in Terria, containing the two sets of group members merged together.

### Editing catalog files

Catalog files can be edited three ways:

1. Using a desktop text editor. Be very careful to ensure that your file is valid JSON. This is more restrictive format than simple JavaScript, for instance. You can use http://jsonlint.com/ .
2. Using a JSON-specific editor, such as http://www.jsoneditoronline.org/. This has the advantage that your file will be valid JSON.
3. Using the Terria Catalog Editor, currently available in a preview version at http://nationalmap.gov.au/editor/ . This editor is not yet considered reliable, and may cause data corruption.

## Catalog file properties

### Setting camera positions

Maps have two camera positions, `homeCamera` and `initialCamera`. They are specified identically. All the examples here use `homeCamera`, but apply equally to both.

* `initialCamera`: the location when the map first displays
* `homeCamera`: where the camera goes when you click the "home" button between the zoom-in and zoom-out buttons.

#### Option 1: `north`, `south`, `east`, `west`

The bounding box method uses `north`, `east `,`south`, and `west`, in lat/lng decimal degrees.  The camera will be positioned
in the centre point of those bounds, looking toward the Earth's
centre, zoomed back enough to see to the edges of the bounds.

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

For most purposed positioning this way is difficult for normal
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

 - `targetLongitude`:
 - `targetLatitude`:
 - `targetHeight`:, in metres from sealevel (positive is up)
 - `heading`: in degrees clockwise from north
 - `pitch`: in degrees down from horizontal (so negative values mean you're looking at the sky)
 - `range`: in metres from the thing you're looking at

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

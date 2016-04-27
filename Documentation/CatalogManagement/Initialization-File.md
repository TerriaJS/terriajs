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

## Using a catalog file

There are four ways to load a catalog file into Terria:

1. Store it in Terria's `wwwroot/init` directory, and refer to it in the `initializationUrls` section of the [`config.json`](../Customizing/Config-JSON.md) file. It is loaded automatically when you visit the webpage.
2. Store it in Terria's `wwwroot/init` directory, without adding it to config.json. Add the catalog file name (without `.json`) to the URL after `#`. For instance, `example.com/terria#mycatalog`. See [TerriaJS URL parameters](../Customizing/TerriaJS-URL-parameters.md) for more information. This method is useful when developing catalog services which are not quite ready for public access, but for showing to interested stakeholders.
3. Store it anywhere on the web (on a CORS-enabled server). Add the complete URL (including `.json`) to the URL, after `#`. For instance, `nationalmap.gov.au/#http://example.com/mycatalog.json`. This method is useful when developing services for a Terria instance which you don't directly control, and for rapidly previewing changes which you can also share with people.
4. Store it locally, then drag and drop it into the Terria window.

If using method 3, please note:

- Files on Github, including Gist files, are not served with CORS. However, you can access them through a third-party service, rawgit.com. For instance, https://github.com/TerriaJS/terriajs/blob/master/wwwroot/test/init/test-tablestyle.json can be accessed as https://rawgit.com/TerriaJS/terriajs/master/wwwroot/test/init/test-tablestyle.json.

All catalog files, however loaded, are merged together in Terria. Any two items with the same name and place in the tree are combined. This means that if two catalog files each define a group called "Water", there will be only one "Water" group in Terria, containing the two sets of group members merged together.

## Editing catalog files

Catalog files can be edited three ways:

1. Using a desktop text editor. Be very careful to ensure that your file is valid JSON. This is more restrictive format than simple JavaScript, for instance. You can use http://jsonlint.com/ .
2. Using a JSON-specific editor, such as http://www.jsoneditoronline.org/. This has the advantage that your file will be valid JSON.
3. Using the Terria Catalog Editor, currently available in a preview version at http://nationalmap.gov.au/editor/ . This editor is not yet considered reliable, and may cause data corruption.
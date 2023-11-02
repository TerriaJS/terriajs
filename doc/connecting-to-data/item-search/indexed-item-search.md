# Indexed item search provider

The [IndexedItemSearchProvider](../../lib/Models/ItemSearchProviders/IndexedItemSearchProvider.ts) provides the ability to search a large dataset using a statically generated index. This is for example useful for searching buildings in a [cesium 3D tileset](../catalog-type-details/3d-tiles.md). We currently have an implementation for indexing and searching 3d-tiles using `IndexedItemSearchProvider`.

Read more about the [IndexedItemSearchProvider design](./indexed-item-search-provider-design-notes.md).

## Generating an index for your 3d tileset.

You can use the [terriajs-indexer](https://github.com/terriajs/terriajs-indexer) for generating an index for 3d-tiles that is searchable by Terria. You can follow the documentation on the repo to generate the index.

## Enabling the index in Terria.

After generating the index, enable it in Terria by configuring a search provider for the catalog item.

Below is sample catalog item configuration:

```
{
      "name": "Buildings 3D",
      "type": "3d-tiles",
      "url": "/Buildings3D/tileset.json",
      "search": {
        "providerType": "indexed",
        "providerOptions": {
          "indexRootUrl": "/Buildings3D-index/indexRoot.json"
        },
        "resultTemplate": "Building #{{OBJECTID}}"
        "parameters": [
           {
             id: "GEOSCAPE_ROOF_SLOPE",
             name: "Roof Slope"
           },
           {
             id: "GEOSCAPE_STREET_ADDRESS",
             queryOptions: {
               prefix: true,
               fuzzy: 2
             }
           }
        ]
      }
}
```

You can host the generated index anywhere, the above configuration assumes that you have added it to `terriamap/wwwroot`.

Search provider configuration:

`search: SearchableItemTraits`

- `providerType: "indexed"`
  - Required
  - A string identifying the search provider in the [ItemSearchProviders](../../../lib/Models/ItemSearchProviders/ItemSearchProviders.ts) registry. This should be `"indexed"` for `IndexedItemSearchProvider`.
- `providerOptions: any`
  - Required
  - Options for the indexed item search provider
    - `indexRootUrl: string`
      - Required
      - The URL of `indexRoot.json` file that was generted using `terriajs-indexer`.
- `resultTemplate: string`

  - Optional
  - A [Mustache](https://mustache.github.io/) formatted template string used to generate a title text for each result in the search results listing. The columns in `resultsData.csv` can be used as variables in the template string. If not provided, the text defaults to the ID of the feature.

- `parameters: SearchParameterTraits[]`
  - Optional
  - Additional configuration for each search parameter. This is given as an array of `SearchParameterTraits` indexed by the parameter ID.
  - `id: string`
    - Required
    - ID of the parameter
  - `name?: string`
    - Optional
    - A human readable name to assign to the parameter which will be shown to the user in the search form instead of the ID.
  - `queryOptions?: any`
    - Query options to be passed to the index when searching. Currently only `text` parameters accept `queryOptions`. For `text` parameter `queryOptions` is expected to be a valid [Minisearch Search Options](https://lucaong.github.io/minisearch/modules/_minisearch_.html#searchoptions-1) object.

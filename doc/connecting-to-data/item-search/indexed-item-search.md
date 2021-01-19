# Indexed item search provider

The [IndexedItemSearchProvider](../../lib/Models/ItemSearchProviders/IndexedItemSearchProvider.ts) provides the ability to search a large dataset using a statically generated index. This is for example useful for searching buildings in a [cesium 3D tileset](../catalog-type-details/3d-tiles.md). We currently have an implementation for indexing and searching 3d-tiles using `IndexedItemSearchProvider`.


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
        "options": {
          "indexRootUrl": "/Buildings3D-index/indexRoot.json"
        },
        "resultTemplate": "Building #{{OBJECTID}}"
      }
}
```

You can host the generated index anywhere, the above configuration assumes that you have added it to `terriamap/wwwroot`. 

The `resultTemplate` defines a template for the search results using the [Mustache](https://mustache.github.io/) format. Any properties in `data.csv` are made available as mustache variables.

Read more about the [IndexedItemSearchProvider design](./indexed-item-search-provider-design-notes.md).

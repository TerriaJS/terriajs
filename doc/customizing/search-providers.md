# Search providers

Terriajs supports 2 types of search providers

1. Catalog search provider
2. Location search providers

Each search provider can be configured using following options

| Name          | Required | Type       | Default                                     | Description                                                |
| ------------- | -------- | ---------- | ------------------------------------------- | ---------------------------------------------------------- |
| name          | no       | **string** | `unknown`                                   | Name of the search provider.                               |
| minCharacters | no       | **number** | `catalogParameters.searchBar.minCharacters` | Minimum number of characters required for search to start. |

## Catalog search provider

`type: catalog-search-provider`

Catalog search provider is used to find the desired dataset. Catalog search provider can be used with or without static catalog index JSON file. Without catalog index each catalog group and item will be dynamically fetched from remote servers in the moment of the search, and for bigger catalog this will cause poor performance of search. For example when having WMS-group in catalog searching in that catalog will cause catalog to issue `getCapabilities` request, wait for response and then perform the search. TerriaJS supports only search provider of type `catalog-search-provider`

### CatalogIndex

If your TerriaMap has many (>50) dynamic groups (groups which need to be loaded - for example CKAN, WMS-group...) it may be worth generating a static catalog index JSON file. This file will contain ID, name and description fields of all catalog items, which can be used to search through the catalog very quickly without needing to load dynamic references/groups (for example `MagdaReference` -> `WebMapServiceCatalogGroup` -> `WebMapServiceCatalogItem`).

The [flexsearch](https://github.com/nextapps-de/flexsearch) library is used to index and search the catalog index file.

**Note** NodeJS v10 is not supported, please use v12 or v14.

To generate the catalog index:

-   `yarn build-tools`
-   `node .\build\generateCatalogIndex.js config-url base-url` where

    -   `config-url` is URL to client-side-config file
    -   `base-url` is URL to terriajs-server (this is used to load `server-config` and to proxy requests)
    -   For example `node .\build\generateCatalogIndex.js http://localhost:3001/config.json http://localhost:3001`

-   This will output three files
    -   `catalog-index.json`
    -   `catalog-index-errors.json` with any error messages which occurred while loading catalog members
    -   `catalog-index-errors-stack.json` with errors stack
-   Set `catalogIndexUrl` config parameter to URL to `catalog-index.json`

This file will have to be re-generated manually every time the catalog structure changes - for example:

-   if items are renamed, or moved
-   dynamic groups are updated (for example, WMS server publishes new layers)

For more details see [/buildprocess/generateCatalogIndex.ts](/buildprocess/generateCatalogIndex.ts)

## Location search providers

Location search providers are used to search for locations on the map. TerriaJS currently supports two implementations of search providers:

-   [`BingMapsSearchProvider`](#bingmapssearchprovider) - implementation which in background uses Bing Map search API
-   [`CesiumIonSearchProvider`](#cesiumionsearchprovider) - implementation which in background use CesiumIon geocoding API
-   [`AustralianGazetteerSearchProvider`](#australiangazetteersearchprovider) - uses `WebFeatureServiceSearchProvider`

Each `LocationSearchProvider support following confing options

| Name                  | Required | Type        | Default | Description                                                                                                                      |
| --------------------- | -------- | ----------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| url                   | yes      | **string**  | `""`    | The URL of search provider.                                                                                                      |
| recommendedListLength | no       | **number**  | `5`     | Default amount of entries in the suggestion list.                                                                                |
| flightDurationSeconds | no       | **number**  | `1.5`   | Time to move to the result location.                                                                                             |
| isOpen                | no       | **boolean** | `true`  | True if the search results of this search provider are visible by default; otherwise, false (user manually open search results). |

### BingMapsSearchProvider

`type: bing-maps-search-provider`

Bing maps search provider is based on commercial API which is provided by BingMaps. To enable it, it is necessary to add an apropriate Bing Maps API key as config parameter. This search provider as results returns addresses and a place name locations.

| Name           | Required | Type        | Default                        | Description                                                                                                                                                                                                                                                                                                            |
| -------------- | -------- | ----------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`          | no       | **string**  | `configParameters.bingMapsKey` | The Bing Maps key.                                                                                                                                                                                                                                                                                                     |
| primaryCountry | no       | **string**  | `Australia`                    | Name of the country to prioritize the search results.                                                                                                                                                                                                                                                                  |
| `culture`      | no       | **string**  | `en-au`                        | Use the culture parameter to specify a culture for your request.The culture parameter provides the result in the language of the culture. For a list of supported cultures, see [Supported Culture Codes](https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes) |
| `mapCenter`    | no       | **boolean** | `true`                         | Whether the current location of the map center is supplied with search request                                                                                                                                                                                                                                         |

It provides a default value for `url: https://dev.virtualearth.net/`

**Example**

```json
{
  "id": "search-provider/bing-maps",
  "type": "bing-maps-search-provider",
  "name": "translate#viewModels.searchLocations",
  "url": "https://dev.virtualearth.net/",
  "flightDurationSeconds": 1.5,
  "minCharacters": 5,
  "isOpen": true
},
```

### CesiumIonSearchProvider

`type: cesium-ion-search-provider`

CesiumIon search provider is based on CesiumIon geocoding API provided by Cesium. To enable it it is necessary to add appropriate cesium API key as config parameter.

| Name  | Required | Type       | Default                                 | Description        |
| ----- | -------- | ---------- | --------------------------------------- | ------------------ |
| `key` | no       | **string** | `configParameters.cesiumIonAccessToken` | The CesiumIon key. |

It provides a default value for `url: https://api.cesium.com/v1/geocode/search/`

**Example**

```json
{
  "id": "search-provider/cesium-ion",
  "type": "cesium-ion-search-provider",
  "name": "translate#viewModels.searchLocations",
  "url": "https://api.cesium.com/v1/geocode/search/",
  "flightDurationSeconds": 1.5,
  "minCharacters": 5,
  "isOpen": true
},
```

### AustralianGazetteerSearchProvider

`type: australian-gazetteer-search-provider`

Australian gazzetteer search provider is based on web feature service that uses an official place names of Australia. It is based on `WebFeatureServiceProvider`.
It can be configured using following options

| Name                     | Required | Type       | Default     | Description                                   |
| ------------------------ | -------- | ---------- | ----------- | --------------------------------------------- |
| `searchPropertyName`     | yes      | **string** | `undefined` | Which property to look for the search text in |
| `searchPropertyTypeName` | yes      | **string** | `undefined` | Type of the properties to search              |

**Example**

```json
{
    "id": "search-provider/australian-gazetteer",
    "type": "australian-gazetteer-search-provider",
    "name": "translate#viewModels.searchPlaceNames",
    "url": "http://services.ga.gov.au/gis/services/Australian_Gazetteer/MapServer/WFSServer",
    "searchPropertyName": "Australian_Gazetteer:NameU",
    "searchPropertyTypeName": "Australian_Gazetteer:Gazetteer_of_Australia",
    "flightDurationSeconds": 1.5,
    "minCharacters": 3,
    "recommendedListLength": 3,
    "isOpen": false
}
```

### Implementing new location search provider

Implementing new location search provider is similar to implementing new `CatalogItems` and `CatalogGroups`. Each of them should be based on the usage of one of the mixins

-   `LocationSearchProviderMixin` - should be used for API based location search providers. Example of such search provider is `BingMapSearchProvider`.
-   `WebFeatureServiceSearchProviderMixin` - should be used for location search providers that will rely on data provided by `WebFeatureService`. Example of such search provider is `AustralianGazetteerSearchProvider`.

Each new `SearchProvider` should be registered inside `registerSearchProvider` so they can be properly upserted from json definition provider in config file.

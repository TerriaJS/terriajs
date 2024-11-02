This section explains how to get your own catalogs and data into a TerriaJS application.

Before beginning, it is very important to understand [Cross-Origin Resource Sharing](cross-origin-resource-sharing.md). Web browsers impose restrictions on how we're allowed to access data across hosts (e.g. accessing data on `data.gov.au` from a web site running at `nationalmap.gov.au`). Understanding these issues will avoid a lot of frustration while trying to add your data to a TerriaJS application.

Types of catalogs and data supported by TerriaJS

-   [Catalog Group](../connecting-to-data/catalog-groups.md): A group (folder) of items. Different group types allow the contents to be manually specified or to be automatically determined by querying various types of server. TerriaJS can use many different types of servers to populate a group, including CKAN, CSW, WMS, and more. For example, if you define a catalog group that points at a Web Map Service (WMS) server, TerriaJS will query the WMS `GetCapabilities` when the group is opened and fill the group with all of the layers advertised by the WMS server.
-   [Catalog Item](../connecting-to-data/catalog-items.md): Actual geospatial or chart data from a file or service, in various formats. TerriaJS supports WMS, KML, GeoJSON, ArcGIS MapServer, and many more files and services as catalog items.
-   [Catalog Function](../connecting-to-data/catalog-functions.md): A parameterized service, such as a Web Processing Service (WPS). The user supplies the parameters and gets back some result.
-   [Catalog Reference](../connecting-to-data/catalog-references.md): Resolves to a Catalog Group, Item or Function.
-   [Catalog Item Search](item-search.md): A mechanism for searching inside catalog items.

## Getting started with Catalog Items

-   [Tabular - CSV](#tabular---csv)
-   [Vector - GeoJSON](#vector---geojson)
-   [Vector - Shapefile](#vector---shapefile)
-   [Vector - Web Feature Service (WFS)](#vector---web-feature-service-wfs)
-   [Vector - ArcGis FeatureServer](#vector---arcgis-featureserver)
-   [Imagery - Web Map Service (WMS)](#imagery---web-map-service-wms)
-   [Imagery - ArcGis MapServer](#imagery---arcgis-mapserver)
-   [Imagery - ArcGis ImageServer](#imagery---arcgis-imageserver)
-   [Raster - Cloud optimized GeoTIFF (COG)](#raster---cloud-optimized-geotiff-cog)
-   [3D - Cesium 3D Tiles](#3d---cesium-3d-tiles)
-   [3D - Cesium 3D Terrain](#3d---cesium-3d-terrain)
-   [3D - ArcGis SceneServer](#3d---arcgis-sceneserver)

### Tabular - CSV

For what CSVs are supported - see [csv-geo-au](https://github.com/NICTA/nationalmap/wiki/csv-geo-au). Tabular data in Terria is very customisable, and can be difficult. We have an "Edit Style" tool to help with this - see [edit style](some-url)

```json
{
    "type": "csv",
    "url": "https://tiles.terria.io/static/auspost-locations.csv",
    "name": "Australia Post Locations",
    "id": "some unique ID"
}
```

### Vector - GeoJSON

[Documentation](catalog-type-details/geojson/README.md)

Terria has support for a limited number of CRSs, but GeoJSON _should_ be WGS84 (EPSG:4326).

#### Example

```json
{
    "type": "geojson",
    "url": "https://tiles.terria.io/terriajs-examples/geojson/bike_racks.geojson",
    "name": "geojson example"
}
```

### Vector - Shapefile

[Documentation](catalog-type-details/shp/README.md)

Shapefile must be zipped (can include `shp`, `dbf`, `prj`, and `cpg` properties)

```json
{
    "type": "shp",
    "name": "shp (shapefile) example",
    "url": "https://tiles.terria.io/terriajs-examples/shp/airports.zip"
}
```

### Vector - Web Feature Service (WFS)

[Documentation](catalog-type-details/wfs/README.md)

**Note** there is a feature limit of 1000. This can be adjusted using the `maxFeatures` property.

```json
{
    "type": "wfs",
    "name": "wfs example",
    "url": "https://warehouse.ausseabed.gov.au/geoserver/ows",
    "typeNames": "ausseabed:AHO_Reference_Surface__Broome__2023_0_5m_L0_Coverage"
}
```

### Vector - ArcGis FeatureServer

[Documentation](catalog-type-details/esri-featureServer/README.md)

**Note** there is a feature limit of 5000. This can be adjusted using the `maxFeatures` property.

```json
{
    "url": "https://services5.arcgis.com/OvOcYIrJnM97ABBA/arcgis/rest/services/Australian_Public_Hospitals_WFL1/FeatureServer/0",
    "type": "esri-featureServer",
    "name": "Australian Public Hospitals"
}
```

### Imagery - Web Map Service (WMS)

[Documentation](catalog-type-details/wms/README.md)

**Note** Web Mercator (EPSG:3857) and WGS84 (EPSG:4326) image tiles are supported.

```json
{
    "type": "wms",
    "name": "Mangrove Cover",
    "url": "https://ows.services.dea.ga.gov.au",
    "layers": "mangrove_cover_v2_0_2"
}
```

### Imagery - ArcGis MapServer

**Note** Web Mercator (EPSG:3857) and WGS84 (EPSG:4326) image tiles are supported.

```json
{
    "url": "https://services.ga.gov.au/gis/rest/services/GA_Surface_Geology/MapServer",
    "type": "esri-mapServer",
    "name": "Surface Geology"
}
```

### Imagery - ArcGis ImageServer

**Note** Web Mercator (EPSG:3857) and WGS84 (EPSG:4326) image tiles are supported.

```json
{
    "url": "https://sampleserver6.arcgisonline.com/arcgis/rest/services/CharlotteLAS/ImageServer",
    "type": "esri-imageServer",
    "name": "CharlotteLAS"
}
```

### Raster - Cloud optimized GeoTIFF (COG)

**Note** Web Mercator (EPSG:3857) and WGS84 (EPSG:4326) rasters are supported, we have experimental support for reprojection, but expect issues!

```json
{
    "name": "COG Test Uluru",
    "type": "cog",
    "url": "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/52/J/FS/2023/5/S2A_52JFS_20230501_0_L2A/TCI.tif"
}
```

### 3D - Cesium 3D Tiles

Cesium 3D Tiles can be a `url` to a 3d-tiles JSON file, or an `ionAssetId` to a Cesium Ion asset.

-   Cesium Ion can be used to host and transform a variety of 3D formats - including 3D Models (OBJ, FBX, ...), Point Clouds (LAS, XYZ) and Terrain (GeoTIFF, ASCII Image)
-   You can also set the `ionAccessToken` property to grant access to your Cesium Ion assets.

#### `ionAssetId`

```json
{
    "type": "3d-tiles",
    "ionAssetId": 69380,
    "name": "CoM Melbourne 3D Photo Mesh"
}
```

#### `url`

```json
{
    "type": "3d-tiles",
    "url": "https://tiles.terria.io/3d-tiles/photomesh/melbourne/tileset.json",
    "name": "CoM Melbourne 3D Photo Mesh"
}
```

### 3D - Cesium 3D Terrain

Cesium 3D Tiles can be a `url` to a directory of Cesium Terrain, or an `ionAssetId` to a Cesium Ion asset.

-   Cesium Ion can be used to host and transform a variety of 3D formats - including 3D Models (OBJ, FBX, ...), Point Clouds (LAS, XYZ) and Terrain (GeoTIFF, ASCII Image)
-   You can also set the `ionAccessToken` property to grant access to your Cesium Ion assets.

#### `ionAssetId`

```json
{
    "type": "cesium-terrain",
    "ionAssetId": 1,
    "name": "Cesium World Terrain"
}
```

#### `url`

```json
{
    "type": "cesium-terrain",
    "url": "https://storage.googleapis.com/vic-datasets-public/85b71982-f5fe-4093-b4e4-fd2e50198fba/v2",
    "name": "A Vic Terrain"
}
```

### 3D - ArcGis SceneServer

TODO add URL here and to example in traits

```json
{
    "type": "I3S",
    "name": "CoM Melbourne 3D Photo Mesh",
    "id": "some-unique-id"
}
```

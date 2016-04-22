(This page is under development)

*Region mapping* is the process of matching a value in a CSV file to a pre-defined boundary, such as a postcode, local government area or electorate. The allowed boundaries for a given TerriaJS instance are given in a file such as `wwwroot/data/regionMapping.json`.

## Basic methodology for distinction between files included in the repo and files in the data archive:

- All files included in the repo should work with any shapefile that defines a region map (a shapefile with only – or predominately – polygon geometry which define regions in features which can be uniquely identified by FID or some other identifier)
- Files from the archive are for serving nationalmap's specific region maps

# How to set up a vector tile server

Preparing shapefiles for region mapping with Tessera is a complex, time-consuming process. If you just want the standard region boundaries, don't follow the [vector-tile-server instructions](https://github.com/TerriaJS/vector-tile-server). Instead, do the following:

## Download and run vector-tile-server

1) Clone the server from Github:

```
git clone https://github.com/TerriaJS/vector-tile-server
cd vector-tile-server
```

2) Install dependencies of the server:

`npm install`

3) Extract the data folder (called `data2/`) from the provided archive (https://dl.dropboxusercontent.com/u/18091071/MVTResources.zip) into the root directory of the repo

```
wget https://dl.dropboxusercontent.com/u/18091071/MVTResources.zip
unzip MVTResources.zip
```

3) Generate the `regionMapping_out.json` config file:

`node setup.js regionMapping.json`

4) Run the server:

```
./server.sh
Listening at http://:::8000/
Adding mbtiles:///Users/stevebennett/odev/nicta/nationalmap/vector-tiles/vector-tile-server/data2/FID_TM_WORLD_BORDERS/store.mbtiles
Adding bridge:///Users/stevebennett/odev/nicta/nationalmap/vector-tiles/vector-tile-server/data2/FID_TM_WORLD_BORDERS/data.xml
Adding mbtiles:///Users/stevebennett/odev/nicta/nationalmap/vector-tiles/vector-tile-server/data2/FID_SA4_2011_AUST/store.mbtiles
Adding bridge:///Users/stevebennett/odev/nicta/nationalmap/vector-tiles/vector-tile-server/data2/FID_SA4_2011_AUST/data.xml
Adding mbtiles:///Users/stevebennett/odev/nicta/nationalmap/vector-tiles/vector-tile-server/data2/FID_SA2_2011_AUST/store.mbtiles
Adding bridge:///Users/stevebennett/odev/nicta/nationalmap/vector-tiles/vector-tile-server/data2/FID_SA2_2011_AUST/data.xml
```

5) Test the server using `SA2`, `SA4` and `WORLD_BORDERS` region maps. Other region types will use WMS (so you can compare the two easily).
  - ABS has 2011 Census data for testing WMS (`SA3`) and MVT (`SA2`, `SA4`)
  - The `test` init file has `Country Regions` and `Droughts by Country` which both use `WORLD_BORDERS`

### Useful command to fix absolute path config files:

Config files have absolute paths, so publishing to a server requires editing all config files (all `hybrid.json` and the server's `config.json`). Replacing all the `hybrid.json` can be done using the following:

```bash
find -name hybrid.json -exec sed -i .bak 's:/Users/Steve/Data61/vector-tile-server:/home/ubuntu/vector-tile-server:g' {} \;
```

## Test the server from a Terria map

1) Checkout `mapbox_vt_region_provider` branches of NationalMap and TerriaJS, and link them:

```
git clone -b mapbox_vt_region_provider https://github.com/NICTA/NationalMap
git clone -b mapbox_vt_region_provider https://github.com/TerriaJS/TerriaJS
cd NationalMap
ln -s ../../terriajs node_modules/terriajs
npm install
```

2) Rebuild NationalMap and run it

```
gulp
npm run
```

3) In a browser, go to `localhost:3001#test`, and load the "Test Data > Region Mapping (CSV) > 2011 Census AUST (SA4)" file.

## If you want to re-generate shapeindex files and mbtiles cache

1. Get the original geoserver shapefiles (or the reprojected ones in the data archive, just not the ones from GeoServer WFS requests as these have incorrect property type information)

2. Reproject the shapefiles to EPSG:3857

2. `npm list mapnik` and ensure mapnik is 3.5.0 or later (a `shapeindex` bug was fixed between `mapnik@3.4.16` & `mapnik@3.5.0`)

3. Generate shapeindexes `find . -name *.shp -print0 | xargs -0 ./node_modules/mapnik/lib/binding/{node-v47-darwin-x64 or similar}/shapeindex` (the folder which `shapeindex` is in changes depending on the specific platform and node version used, but the `shapeindex` binary works the same)

4. Run `save_tiles.js` from `setup.js`

# Method for adding custom region maps:

## Prepare the shapefiles

  * One shapefile should contain all the polygons.
  * There should be a `FID` (case-sensitive) attribute, numbering each polygon starting from 0. If no FID attribute is present, use ogr2ogr to add it:

    `ogr2ogr -f "ESRI Shapefile" precincts-fid.shp precincts.shp -sql 'select FID,* from precincts'`

    If you have several files to process, use a line like this:

    `for i in GCCSA IARE ILOC IREG SOS SOSR SUA UCL; do ogr2ogr -f "ESRI Shapefile" ${i}_2011_AUST_fid.shp ${i}_2011_AUST.shp -sql 'select FID,* from '"${i}_2011_AUST"; done`

  * There should be an attribute containing the identifiers you wish to match against (eg, for postcode boundaries, a `postcode` attribute containing the 4 digit codes themselves).
  * The projection should be EPSG:4326 (unprojected lat/long on WGS84).
  * **Why use EPSG:4326? Is this something that GeoServer works well with, or is it something WebMapService needs, or is it for convenience for Cesium, or something else?**
  * Vector tile server prefers the shapefile in EPSG:3857 (or at least I've written it to use that...)

## Add as a new layer

The Node-js script addRegionMap.js helps a user to add their own custom region map. Given a short json config file, it can generate all necessary server
configuration and fake "cached WFS" & regionMapping jsons for the TerriaJS client.

okcountiesRegionMapConfig.json:
```json
{
    "layerName": "okcounties",
    "shapefile": "okcounties.shp",
    "generateTilesTo": 12,
    "addFID": true,
    "server": "http://127.0.0.1:8000/okcounties/{z}/{x}/{y}.pbf",
    "serverSubdomains": [],

    "regionMappingEntries": {
        "okcounty": {
            "regionProp": "county",
            "aliases": [
                "okcounty"
            ],
            "description": "Oklahoma Counties"
        },
        "okcounty_name": {
            "regionProp": "name",
            "aliases": [
                "okcounty_name"
            ],
            "description": "Oklahoma Counties"
        }
    }
}
```

1. Write out a config similar to the above config
2. Run `node addRegionMap.js okcountiesRegionMapConfig.json`
3. Navigate (or `cd`) to `output_files`
4. Copy relevant region_map-LAYERNAME_VARIABLE.json to wwwroot/data/regionids of a Terria map (such as nationalmap)
5. Replace wwwroot/data/regionMapping.json with the contents of regionMapping-LAYERNAME.json, or copy and append the entries
6. Build and run the Terria map, and run the vector tile server

## Configure the regions in your TerriaJS-based map

Modify `wwwroot/data/regionMapping.json`. Add a section like this:

```json
"SA4": {
    "layerName":"region_map:FID_SA4_2011_AUST",
    "server": "http://geoserver.nationalmap.nicta.com.au/region_map/ows",
    "regionProp": "SA4_CODE11",
    "aliases": ["sa4_code", "sa4_code", "sa4"],
    "description": "Statistical Area Level 4"
},
```

* `"SA4"`: this identifier does not serve any machine-readable purpose outside this file.
* `layerName`: the WMS layer of your new regions, including the workspace.
* `server`: the URL of your GeoServer, up to and including `/ows`.
* `regionProp`: the name of the attribute containing region identifiers that will be matched against (case-sensitive)
* `aliases`: alias of CSV column header names that will be recognised as matching this kind of feature. Must be lowercase.
* `description`: May be used in GUI elements and error messages.

*Region mapping* is the process of matching a value in a CSV file to a pre-defined boundary, such as a postcode, local government area or electorate. The allowed boundaries for a given TerriaJS instance are given in a file such as `wwwroot/data/regionMapping.json`.

----

**WARNING: The following method is the old way of setting up region mapping. This method is deprecated and won't be supported in TerriaJS version 8. Version 8 is currently in alpha and the first stable relase v8.0.0 should be published in December 2020. See the [recommended method of setting up region mapping](./setting-up-a-region-mapping-server.md)**

----

## Prepare the shapefiles

  * One shapefile should contain all the polygons. 
  * There should be a `FID` (case-sensitive) attribute, numbering each polygon starting from 0. If no FID attribute is present, use ogr2ogr to add it: 

    `ogr2ogr -f "ESRI Shapefile" precincts-fid.shp precincts.shp -sql 'select FID,* from precincts'` 

    If you have several files to process, use a line like this:

    `for i in GCCSA IARE ILOC IREG SOS SOSR SUA UCL; do ogr2ogr -f "ESRI Shapefile" ${i}_2011_AUST_fid.shp ${i}_2011_AUST.shp -sql 'select FID,* from '"${i}_2011_AUST"; done`

  * There should be an attribute containing the identifiers you wish to match against (eg, for postcode boundaries, a `postcode` attribute containing the 4 digit codes themselves).
  * The projection should be EPSG:4326 (unprojected lat/long on WGS84).

## Set up GeoServer

2. Install GeoServer. The instance used by National Map is on AWS, available at geoserver.nationalmap.nicta.com.au.

3. Using the GeoServer web interface, create a data store of type `Directory of spatial files (shapefiles)`.

4. Upload the shapefile (.shp, .shx, .dbf and .qix) into the appropriate directory. For National Map's server, this is `/mnt/data/region_map/shape_files/`.

5. Create a style called `region_fid`. Paste the contents of [this Gist](https://gist.github.com/stevage/767779515f037e1d1427).

6. Under *Layers > Add a New Resource*, find the new shapefile name and click *Publish* 

7. Set these properties:
  * Declared SRS: EPSG:4326
  * Click "Compute from data" and "Compute from native bounds" to set the bounding box.
  * On the *Publishing* page, set `region_fid` as the *Default Style*

## Configure the regions in your TerriaJS-based map

Modify `wwwroot/data/regionMapping.json`. Add a section like this:

        "SA4": {
            "layerName":"region_map:FID_SA4_2011_AUST",
            "server": "http://geoserver.nationalmap.nicta.com.au/region_map/ows",
            "regionProp": "SA4_CODE11",
            "aliases": ["sa4_code", "sa4_code", "sa4"],
            "description": "Statistical Area Level 4"
        },

* `"SA4"`: this identifier does not serve any machine-readable purpose outside this file.
* `layerName`: the WMS layer of your new regions, including the workspace.
* `server`: the URL of your GeoServer, up to and including `/ows`.
* `regionProp`: the name of the attribute containing region identifiers that will be matched against (case-sensitive)
* `aliases`: alias of CSV column header names that will be recognised as matching this kind of feature. Must be lowercase.
* `description`: May be used in GUI elements and error messages.

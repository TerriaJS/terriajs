# Migration guide

A guide to upgrade a 7.x.x TerriaJS map to TerriaJS 8.0.0 and beyond. Please post on our [GitHub discussions forum](https://github.com/TerriaJS/terriajs/discussions) if you encounter problems or have suggestions for improving this.

## Removed features in version 8

There are a few features in v7 that we have removed. Some of these include:

- Internet Explorer 11 support (navigating to a map built with TerriaJS 8.0.0+ in IE11 will result in a completely blank page)
- GDAL conversion service - Shapefiles (.zip) are now supported in the frontend
- ABS ITT
- WMS region mapping
- Australian GNAF geocoding (and CSV batch geocoding) - we will be terminating our GNAF service as it is outdated
- Some specific `tableStyle` options
- Modifying styles for HTML elements within Terria's UI using custom CSS with `.tjs-xxxx` class selectors

Reach out to us if you are using these, we only know about the things we have seen.

## Migrating to version 8

To migrate to TerriaJS version 8 you'll need to update each of these:

- Your initialization files
- Custom basemaps or basemap thumbnails
- The TerriaMap code
- Other modifications you've done

### Upgrading initialization files using the catalog converter

The best way to upgrade your initialization files to TerriaJS version 8 is to run the files through our [catalog converter](https://catalog-converter.terria.io/).

If you want the converter as a command line tool with extra options (such as more control over ids) you can run the catalog converter CLI by installing from npm:

```
npm install -g catalog-converter
catalog-converter input-v7-init.json output-v8-init.json
catalog-converter --help # To see all options
```

Or [checkout the source code](https://github.com/TerriaJS/catalog-converter) to build & run it and/or contribute to it. (The source for the catalog converter UI can be found at [https://github.com/TerriaJS/catalog-converter-ui](https://github.com/TerriaJS/catalog-converter-ui)).

### Customising the selection of basemaps or basemap thumbnails

To customise the available basemaps or the thumbnails of basemaps in the basemap switcher, [add/edit the `baseMaps` property in your initialization files](../customizing/initialization-files.md#base-maps)

### Upgrading TerriaMap code by git merge

If you have set up your map in the standard way using a fork of [TerriaMap](https://github.com/TerriaJS/TerriaMap) you will be able to upgrade from TerriaJS version 7 to version 8 by merging in the `next` branch of TerriaMap. To do this, run the following `git` commands:

1.  Add TerriaMap as a remote:

        git remote add TerriaMap https://github.com/TerriaJS/TerriaMap
        git fetch TerriaMap

2.  Make a new branch to work on:

        git checkout -b upgrade-to-tjs-8

3.  Make sure you already have the tag `post-prettier` merged. In mid 2019 we reformatted our codebase with prettier. If the following command doesn't list your new branch, [follow these instructions to merge our reformatting commit without conflicts](https://docs-v7.terria.io/guide/getting-started/#prettier):

        git branch --contains post-prettier

4.  Merge in the latest from TerriaMap built on terriajs version 7 (this step can be skipped, but it might make the next merge easier):

        git merge TerriaMap/terriajs-v7

5.  Finally, merge in the latest TerriaMap built on terriajs version 8. If you completed the previous step, most conflicts in this stage should be resolved in favour of TerriaMap/main (the Incoming change):

        git merge TerriaMap/main

### Upgrading modifications

Let us know if you're stuck trying to upgrade something in [the TerriaJS discussions forum](https://github.com/TerriaJS/terriajs/discussions)

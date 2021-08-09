# Migration guide

A guide to upgrade a 7.x.x TerriaJS map to TerriaJS 8.0.0 and beyond

## Removed features

There are a few features in v7 that we have removed. Some of these include:

* Internet Explorer 11 support (navigating to a map built with TerriaJS 8.0.0+ in IE11 will result in a completely blank page)
* ABS ITT
* WMS region mapping
* Australian GNAF geocoding (and CSV batch geocoding) - we cannot dedicate the time to keep our GNAF service up to date, so we will be terminating it
* Some specific `tableStyle` options

Reach out to us if you are using these, we only know about the things we have seen.

## Catalog converter

The best way to upgrade to TerriaJS version 8 is to take your previous catalog and run it through our [catalog converter](https://catalog-converter.terria.io/)

[Checkout the source code](https://github.com/TerriaJS/catalog-converter) if you want the converter as a command line tool with extra options (such as more control over ids), or if you want to contribute to it. 

(And the source for the catalog converter UI can be found at [https://github.com/TerriaJS/catalog-converter-ui](https://github.com/TerriaJS/catalog-converter-ui)).

## Upgrading by git merge

If you set up your map in the standard way using a fork of [TerriaMap](https://github.com/TerriaJS/TerriaMap) you will be able to upgrade from TerriaJS version 7 to version 8 by merging in the `next` branch of TerriaMap. To do this, run the following `git` commands:

1. Add TerriaMap as a remote:
```sh
git remote add TerriaMap https://github.com/TerriaJS/TerriaMap
git fetch TerriaMap
```
2. Make a new branch to work on:
```sh
git checkout -b upgrade-to-tjs-8
```
3. Make sure you already have the tag `post-prettier` merged. In mid 2019 we reformatted our codebase with prettier. If the following command doesn't list your new branch, [follow these instructions to merge our reformatting commit without conflicts](https://docs-v7.terria.io/guide/getting-started/#prettier):
```sh
git branch --contains post-prettier # The output of this must include the new branch you've made
``` 
4. Merge in the latest from TerriaMap built on terriajs version 7 (this step can be skipped, but it might make the next merge easier):
```sh
git merge TerriaMap/master
```
5. And then merge in the latest TerriaMap built on terriajs version 8. If you completed the previous step, most conflicts in this stage should be resolved in favour of TerriaMap/next (the Incoming change):
```sh
git merge TerriaMap/next
```


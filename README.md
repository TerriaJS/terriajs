
TerriaJS
============

[![Build Status](https://travis-ci.org/NICTA/TerriaJS.svg?branch=master)](https://travis-ci.org/NICTA/TerriaJS)

TerriaJS is a library for building rich, web-based geospatial data explorers.  It uses [Cesium](https://cesiumjs.org) for a full 3D experience.  Think Google Earth, except it runs in a web browser without a plugin.  It also uses [Leaflet](http://leafletjs.com/) for a basic 2D experience on systems that can't run Cesium.

A live demo of an application built on TerriaJS can be found here:
[Australia's National Map](http://nationalmap.gov.au)

## Using TerriaJS in your application

```
npm install terriajs
```

TerriaJS is composed of a number of CommonJS modules, making it easy to incorporate only the parts you need into your application.  Building a TerriaJS application consists of three steps:

1. Build the code with [browserify](http://browserify.org/) (or a similar tool).
2. Build the CSS with [less](http://lesscss.org/).
3. Copy the runtime resources to a directory accessible from your application's web server.

The entire process can be easily automated using [gulp](http://gulpjs.com/).  See National Map's [gulpfile.js](https://github.com/NICTA/nationalmap/blob/master/gulpfile.js) for an example.

[index.js](https://github.com/NICTA/nationalmap/blob/master/index.js) requires-in various TerriaJS components and initializes the user interface.

[index.less](https://github.com/NICTA/nationalmap/blob/master/index.less) customizes various aspects of the appearance and `@import`s the less files for the TerriaJS components that the application uses.

All assets in `node_modules/terriajs/wwwroot` should be copied to `[your app's web root directory]/build/TerriaJS`.

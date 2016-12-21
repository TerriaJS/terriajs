## Getting Started

The easiest way to get started with TerriaJS is to use [TerriaMap](https://github.com/TerriaJS/TerriaMap).  TerriaMap is a full-featured application built on TerriaJS, ready to be customized with your own branding and catalog.  It is also a great starting point for more in-depth customization.

This guide explains how to build and run TerriaMap locally.  See [Deployment](../Deployment) to learn how to deploy it for use by others.

### Quick Start

If you've done this sort of thing before, you'll find it easy to clone and build TerriaMap with these quick instructions:

```bash
git clone https://github.com/TerriaJS/TerriaMap.git

cd TerriaMap

npm install && npm run build && npm start

# Open at http://localhost:3001
```

If you run into trouble or want more explanation, read on.

### Prerequisites

TerriaJS can be built and run on almost any macOS, Linux, or Windows system.  The following are required to build TerriaJS:

* [Node.js](https://nodejs.org) v5.10 or later.  v6.x and v7.x are also known to work, and later major versions are likely to work as well.  You can check your node version by running `node --version` on the command-line.
* [npm](https://www.npmjs.com/) v3.0 or later.  This is usually installed automatically alongside the above.  You can check your npm version by running `npm --version`.

The following components are optional:

* [GDAL](http://www.gdal.org/) - Used for the conversion service that transforms Esri Shapefiles and other more obscure formats into GeoJSON for display in TerriaJS.  This is _not_ required for formats that TerriaJS supports directly, including KML, GeoJSON, etc.

### Cloning TerriaMap

The latest version of TerriaMap is on [GitHub](https://github.com), and the preferred way to get it is by using `git`:

```bash
git clone https://github.com/TerriaJS/TerriaMap.git

cd TerriaMap
```

If you're unable to use git, you can also [download a ZIP file](https://github.com/TerriaJS/TerriaMap/archive/master.zip) and extract it somewhere on your system.  We recommend using git, though, because it makes it much easier to update to later versions in the future.

### Installing Dependencies

All of the dependencies required to build and run TerriaMap, other than the prerequisites listed above, are installed using `npm`:

```bash
npm install
```

The dependencies are installed in the `node_modules` subdirectory.  No global changes are made to your system.

### Building TerriaMap

Do a standard build of TerriaMap with:

```bash
npm run build
```

Or, you can create a minified release build with:

```bash
npm run build release
```

To watch for changes and automatically do an incremental build when any are detected, use:

```bash
npm run build watch
```

`npm run build` simply runs `gulp`, so you can use that directly if you prefer.

The full set of `gulp` tasks can be found on the [Development Environment](../Contributors/Development-environment#gulp-tasks) page.

### Keeping up with Updates

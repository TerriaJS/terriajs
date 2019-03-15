The easiest way to get started with TerriaJS is to use [TerriaMap](https://github.com/TerriaJS/TerriaMap).  TerriaMap is a full-featured application built on TerriaJS, ready to be customized with your own branding and catalog.  It is also a great starting point for more in-depth customization.

This guide explains how to build and run TerriaMap locally.  See [Deploying](deploying) to learn how to deploy it for use by others.

You may also be interested in how to [make your own map without writing any code](http://stevebennett.me/2015/07/02/your-own-personal-national-map-with-terriajs-no-coding-and-nothing-to-deploy/).

### Quick Start

If you've done this sort of thing before, you'll find it easy to clone and build TerriaMap with these quick instructions:

```bash
git clone https://github.com/TerriaJS/TerriaMap.git

cd TerriaMap

npm install && npm run gulp && npm start

# Open at http://localhost:3001
```

If you run into trouble or want more explanation, read on.

### Prerequisites

TerriaJS can be built and run on almost any macOS, Linux, or Windows system.  The following are required to build TerriaJS:

* The Bash command shell. On macOS or Linux you almost certainly already have this. On Windows, you can easily get it by installing [Git for Windows](https://gitforwindows.org/). In the instructions below, we assume you're using a Bash command prompt.
* [Node.js](https://nodejs.org) v8.0 or later.  v10.x is also known to work.  You can check your node version by running `node --version` on the command-line.
* [npm](https://www.npmjs.com/) v6.0 or later.  npm is usually installed automatically alongside the above.  You can check your npm version by running `npm --version`.

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
npm run gulp
```

Or, you can create a minified release build with:

```bash
npm run gulp release
```

To watch for changes and automatically do an incremental build when any are detected, use:

```bash
npm run gulp watch
```

`npm run gulp` simply runs `gulp`, so you can use that directly if you prefer (run `npm install -g gulp` to install it globally).

The full set of `gulp` tasks can be found on the [Development Environment](contributing/development-environment.md#terriamap-gulp-tasks) page.

### Running TerriaMap

TerriaMap includes a simple Node.js-based web server, called [terriajs-server](https://github.com/TerriaJS/terriajs-server).  To start it, run:

```bash
npm start
```

Then, open a web browser on `http://localhost:3001` to use TerriaMap.

### Keeping up with Updates

If you're building an application by using TerriaMap as a starting point, you will want to keep in sync as TerriaMap is improved and updated to use new versions of TerriaJS.  Forking the TerriaMap repo and using git to keep it in sync is outside the scope of this document, but GitHub has a [nice explanation](https://help.github.com/articles/fork-a-repo/).

After pulling new changes, you will need to run `npm install` again to pick up any changed dependencies and then build TerriaMap.  If you have problems building or running, it is sometimes helpful to remove and reinstall the dependencies from npm:

```bash
rm -rf node_modules
npm install
```

### Next Steps

Now that you have a working local build of TerriaMap, you may want to [customize it](customizing) or [deploy it](deploying) for others to use.

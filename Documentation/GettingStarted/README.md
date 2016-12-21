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

### Setting up your environment

### Building TerriaMap

### Keeping up with Updates

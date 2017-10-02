This page provides and overview of the TerriaJS architecture.

## Layers

TerriaJS has a number of subdirectories of the `lib` directory, each of which corresponds to a layer.  The layers are:

| Name | Purpose |
|------|---------|
| Core | Low-level utility classes and functions that don't depend on a UI toolkit (i.e. React) or a mapping library (i.e. Cesium or Leaflet). |
| Map | Classes and functions to work with or extend a mapping library (i.e. Cesium or Leaflet). This layer should not depend on a particular UI toolkit (i.e. React). |
| Models | This is heart of TerriaJS.  It knows how to communicate with 

## User interface

TerriaJS uses React for the 

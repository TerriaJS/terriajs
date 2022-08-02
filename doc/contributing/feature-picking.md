# Feature picking

How Terria handles picking features on a map.  

This document mainly serves as a guide to debug or extend feature picking functionality.

It is a work in progress

## Outline

1. Catalog item creates "mappable" items
    - Imagery provider
    - Cesium data sources
    - Terrain
    - Abstract primitive
1. Catalog item returns `mapItems` which are rendered by Leaflet or Cesium
1. User clicks on map
    - Cesium resolves features
    - Leaflet resolves features
    - `FeatureInfoUrlMixin.getFeaturesFromPickResult` is called if applicable
    - Feature highlight is created if applicable
1. Terria `PickedFeatures` is populated
2. Picked features appear in `FeatureInfoPanel`
    - Catalog item for each feature is resolved
    - Each catalog item renders `FeatureInfoCatalogItem`
    - Each feature in catalog item renders `FeatureInfoSection`
3. Feature info is rendered by `FeatureInfoSection`
    - Pre-processing/cleaning of feature properties
    - Setup Mustache template context data (eg custom expressions)
    - `FeatureInfoContext.featureInfoContext()` is called if applicable - and merged into Mustache template context
    - Feature info template is rendered
      - Mustache
      - parseCustomHtmlToReact

**Why is this so complicated?**

Because there is no explicit link between Terria model layer and map renderers (Cesium/Leaflet).

## Map renderer picking

[`Cesium.ts`](../../lib/Models/Cesium.ts) and [`Leaflet.ts`](../../lib/Models/Leaflet.ts) handle turning map renderer features into Terria [`PickedFeatures`](../../lib/Map/PickedFeatures/PickedFeatures.ts)

## Thoughts

When creating mappable items there are things you must do to ensure feature picking functions correctly:

- What is a feature?
  - Vector/cesium primitive
  - Pixel value
  - 3D tile
  - ...
- How is it picked/selected?
  - Does it require a network request? (eg WMS `GetFeatureInfo`)
- When a feature is picked, can it's owner (catalog item) be resolved?
  - Can it's underlying data be resolved (eg a row in a CSV)?
- What information is to be shown?
- Does the feature information require data that isn't stored in the feature itself?
  - Do additional network requests need to be made?
- Does the feature change over time?
  - How should this be handled when the timeline changes?
- How is the feature shared (in share link/story)?
  - Does geometry need to be saved - or is feature a product of a network request

This varies for each type of mappable item

## How features are resolved by map renderer

### Imagery provider

Most imagery providers are handled automatically like so:
1. Click on imagery provider
2. Network request is made by Cesium (`ImageryProvider.pickFeatures`)
3. Returns `ImageryLayerFeatureInfo`
4. [`featureDataToGeoJson`](../../lib/Map/PickedFeatures/featureDataToGeoJson.ts) will attempt to convert `ImageryLayerFeatureInfo` into geoJSON for feature highlighting

### Cesium data sources

Picking is handled differently by Cesium and Leaflet

For Cesium see `Cesium.pickVectorFeatures`. Leaflet is a bit more complicated - see `LeafletScene` and `LeafletVisualizer`.

### Terrain

Currently no feature picking is implemented

### Abstract primitive

Currently no feature picking is implemented

## How Terria specific info is attached to features

### `Feature`

`Feature` is a wrapper around a Cesium `Entity`

- `data` property contains `TerriaFeatureData`
- `_catalogItem`
- `imageryProvider`
- `loadingFeatureInfoUrl`
- `cesiumEntity`
- `cesiumPrimitive`


### `ImageryLayerFeatureInfo`

### Custom `buildFeatureFromPickResult`

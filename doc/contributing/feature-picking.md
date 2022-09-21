# Feature picking

How Terria handles picking features on a map.

This document mainly serves as a guide to debug or extend feature picking functionality.

It is a work in progress.

**Not included in doc**:

- How picked features are shared

## Related docs

- [Feature Info Template](/doc/connecting-to-data/customizing-data-appearance/feature-info-template.md)

## Outline

1. Catalog item creates "mappable" items:
   - [Cesium Imagery Provider](https://cesium.com/learn/cesiumjs/ref-doc/ImageryProvider.html)
   - [Cesium Data Source](https://cesium.com/learn/cesiumjs/ref-doc/DataSource.html)
   - [Cesium Terrain Provider](https://cesium.com/learn/cesiumjs/ref-doc/TerrainProvider.html)
   - [Cesium Abstract Primitive](https://cesium.com/learn/cesiumjs/ref-doc/Primitive.html)
1. Catalog item returns `mapItems` which are rendered by Leaflet or Cesium
1. User clicks on map
   - Cesium/Leaflet resolves features
   - `FeatureInfoUrlMixin.getFeaturesFromPickResult` is called if applicable
   - Feature highlight is created if applicable
1. Terria `PickedFeatures` is populated
1. Picked features appear in [`FeatureInfoPanel`](#featureinfopanel)
   - Catalog item for each feature is resolved
   - Each catalog item renders [`FeatureInfoCatalogItem`](#featureinfocatalogitem)
   - Each feature in catalog item renders [`FeatureInfoSection`](#featureinfosection)
1. Feature info is rendered by [`FeatureInfoSection`](#featureinfosection)
   - Pre-processing/cleaning of feature properties
   - Setup Mustache template context data (eg custom expressions)
   - `FeatureInfoContext.featureInfoContext()` is called if applicable - and merged into Mustache template context
   - Feature info template is rendered
     - Mustache
     - parseCustomHtmlToReact

**Why is this so complicated?**

Because there is no explicit link between Terria model layer and map renderers (Cesium/Leaflet).

## Thoughts

When creating mappable items there are things you must do to ensure feature picking functions correctly:

- What is a feature?
  - Vector/cesium primitive
  - Pixel value
  - 3D tile
  - ...
- How is it picked/selected?
  - Does it require a network request? (eg WMS `GetFeatureInfo`)
  - Will Cesium handle it automatically - or needs manual implementation
- When a feature is picked, can it's owner (catalog item) be resolved?
  - Can it's underlying data be resolved (eg a row in a CSV)?
- What feature information is to be shown to the user?
  - Is a feature info template needed?
- Does the feature information require data that isn't stored in the feature itself?
  - Do additional network requests need to be made?
- Does the feature change over time?
  - How should this be handled when the timeline changes?
- How is the feature shared (in share link/story)?
  - Does geometry need to be saved - or is feature a product of a network request

This varies for each type of mappable item. Cesium will give you some of them for free - depending on feature type.

## How features are resolved by map renderer

[`Cesium.ts`](../../lib/Models/Cesium.ts) and [`Leaflet.ts`](../../lib/Models/Leaflet.ts) handle turning map features into Terria [`PickedFeatures`](../../lib/Map/PickedFeatures/PickedFeatures.ts)

There is also common feature picking functionality in [`GlobeOrMap.ts`](/lib/Models/GlobeOrMap.ts)

### [Cesium Imagery Provider](https://cesium.com/learn/cesiumjs/ref-doc/ImageryProvider.html)

Most imagery providers are handled automatically by Cesium like so:

1. Click on imagery provider on map (Leaflet or Cesium)
2. Network request is made by Cesium (`ImageryProvider.pickFeatures`)
3. Returns `ImageryLayerFeatureInfo`
4. Convert into Terria [`Feature`](#terria-feature-object)
5. [`featureDataToGeoJson`](../../lib/Map/PickedFeatures/featureDataToGeoJson.ts) will attempt to convert [`Feature`](#terria-feature-object) into geoJSON for feature highlighting

### [Cesium Data Source](https://cesium.com/learn/cesiumjs/ref-doc/DataSource.html)

When picking features, Cesium will return an [`Entity`](https://cesium.com/learn/cesiumjs/ref-doc/Entity.html) or `EntityCollection` - which is converted into a Terria [`Feature`](#terria-feature-object) object (see [`Cesium.pickVectorFeatures`](/lib/Models/Cesium.ts))

Leaflet is a bit more complicated - as it doesn't natively support Cesium Data Sources - see [`LeafletScene`](/lib/Map/Leaflet/LeafletScene.ts) and [`LeafletVisualizer`](/lib/Map/Leaflet/LeafletVisualizer.ts).

### [Cesium Terrain Provider](https://cesium.com/learn/cesiumjs/ref-doc/TerrainProvider.html)

No feature picking is implemented

### [Cesium Abstract Primitive](https://cesium.com/learn/cesiumjs/ref-doc/Primitive.html)

No feature picking is implemented

## How Terria specific info is attached to features

### Terria `Feature` object

See [lib/Models/Feature/Feature.ts](/lib/Models/Feature/Feature.ts)

`Feature` is a wrapper around a Cesium [`Entity`](https://cesium.com/learn/cesiumjs/ref-doc/Entity.html)

- `data` property contains [`TerriaFeatureData`](#terriafeaturedata)
- `_catalogItem` - owner of feature
- `imageryProvider` - if feature picked is from imagery provider
- `loadingFeatureInfoUrl`
- `cesiumEntity` - original cesium entity (when picked)
- `cesiumPrimitive` - original cesium primitive (when picked)

#### `TerriaFeatureData`

See [lib/Models/Feature/FeatureData.ts](/lib/Models/Feature/FeatureData.ts)

This property of [`Feature`](#terria-feature-object) should be used for Terria specific data - it should only be added to [`Feature`](#terria-feature-object) objects when they are created.

Current properties:

- `rowIds` - array of table row IDS that correspond to the feature. This is required for TableMixin to find original data after a [`Feature`](#terria-feature-object) has been picked,
- `timeIntervalCollection` - if feature is time varying, this property can be used instead of `properties` for convenience.

#### Example usage

`TableMixin` example usage - enabling time-series charts in feature info:

- `TableMixin` adds `rowIds` to `data` property here [`lib/Table/createLongitudeLatitudeFeaturePerRow.ts`](/lib/Table/createLongitudeLatitudeFeaturePerRow.ts#L83)
- A feature is picked, which triggers `TableMixin.featureInfoContext()`.
- It calls [`lib/Table/tableFeatureInfoContext.ts`](/lib/Table/tableFeatureInfoContext.ts) which uses `data.rowIds` to add "Mustache context data" to the picked feature.
- The Mustache context data contain time series chart functionality

### `ImageryLayerFeatureInfo`

This is a Cesium object - unchanged in Terria. It is converted to a [`Feature`](#terria-feature-object) object when picked.

Note use of `data` property and how we use `featureDataToGeoJson` to convert `ImageryLayerFeatureInfo` `data` to geoJSON for feature highlighting

### Custom `buildFeatureFromPickResult`

`FeatureInfoUrlTemplateMixin` provides abstract function `buildFeatureFromPickResult` which can be used to implement custom feature picking.

## Feature info panel (view layer)

There are three nested React components

- [`FeatureInfoPanel`](/lib/ReactViews/FeatureInfo/FeatureInfoPanel.tsx)
  - [`FeatureInfoCatalogItem`](/lib/ReactViews/FeatureInfo/FeatureInfoCatalogItem.tsx) for each catalog item
    - [`FeatureInfoSection`](/lib/ReactViews/FeatureInfo/FeatureInfoSection.tsx) for each feature in each catalog item

### `FeatureInfoPanel`

Top level component

- Pulls features from `Terria.pickedFeatures`
- Matches features with catalog items
- Renders `FeatureInfoCatalogItem` for each.

### `FeatureInfoCatalogItem`

Simple component

- Applied limit to how many features are shown
- Renders `FeatureInfoSection` for each feature in specified catalog item

### `FeatureInfoSection`

Renders feature information.

There are two methods of rendering feature info:

- **"Raw data"** - presents all feature properties as a table
- **"Curated data"** - applies Mustache template using feature properties (and context data) to render complex view of feature properties
  - Curated data requires a Mustache [Feature Info Template](/doc/connecting-to-data/customizing-data-appearance/feature-info-template.md)

#### Cleans/pre-processes feature properties

- For time-varying features, gets values for `currentTime`
- Processes nested JSON values
- Replaces values which may interfere with Mustache templates
- Applies `FeatureInfoTraits.format` options (eg `number.toLocaleString` options)

#### Raw data: generate table

Cleaned feature properties are turned into a table for presentation

See [`generateCesiumInfoHTMLFromProperties`](/lib/ReactViews/FeatureInfo/generateCesiumInfoHTMLFromProperties.ts)

#### Curated data: Create "mustache context data"

This is an object with properties which can be used by Mustache templates:

- All (cleaned) feature properties - this forms the base of the object
- `properties` = array of key:value pairs of feature properties
- `terria` magical object
  - a bunch of custom mustache expressions
    - `partialByName`
    - `formatNumber`
    - `formatDateTime`
    - `urlEncodeComponent`
    - `urlEncode`
  - `coords` with `latitude` and `longitude`
  - `currentTime`
- properties provided by catalog item through `featureInfoContext` function

##### Example mustache template with context data

```md
Some Text: {{someFeatureProperty}}
A magical property from Terria: {{terria.currentTime}}

A custom expression - which formats `terria.currentTime` as `"dd-mm-yyyy HH:MM:ss"`
{{#terria.formatDateTime}}{"format": "dd-mm-yyyy HH:MM:ss"}{{terria.currentTime}}{{/terria.formatDateTime}}
```

#### Curated data: Render mustache template to HTML/markdown

Using three components:

- The template - see `FeatureInfoTraits.template`
- "Mustache context data" - see above
- Partials - see `FeatureInfoTraits.partials`

The output HTML/markdown may contain Custom Components. These are handled by the next step

#### Render HTML/markdown to React

This step is applied to "Raw" and "Curated" data

Uses [`parseCustomMarkdownToReact.ts`](/lib/ReactViews/Custom/parseCustomMarkdownToReact.ts) function to turn HTML/markdown with custom components to React.

This step may cause model layer side-effects - eg `CSVChartCustomComponent`

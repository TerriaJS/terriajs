# Feature picking

How Terria handles picking features on a map.

## Outline

1. Catalog item has `mapItems` which are rendered by Leaflet or Cesium
    - Imagery provider
    - Cesium data sources
    - Terrain
    - Abstract primitive
2. User clicks on map
    - Cesium resolves features
    - Leaflet resolves features
3. `FeatureInfoUrlMixin.getFeaturesFromPickResult` is called if applicable
4. Picked features appear in `FeatureInfoPanel`
    - Catalog item for each feature is resolved
    - Each catalog item renders `FeatureInfoCatalogItem`
    - Each feature in catalog item renders `FeatureInfoSection`
5. Feature info is rendered by `FeatureInfoSection`
    - Pre-processing/cleaning of feature properties
    - Setup Mustache template context data (eg custom expressions)
    - `FeatureInfoContext.featureInfoContext()` is called if applicable - and merged into Mustache template context
    - Feature info template is rendered
      - Mustache
      - parseCustomHtmlToReact

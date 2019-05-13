const GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
const defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Adds a location marker to the map with the position supplied in the result, adding a data source to terria if one hasn't
 * already been added, and removing all previously added markers in that data source. This data source is stored in
 * terria.locationMarker.
 */
export function addGeoJsonFeatureFromWorkbenchData(terria, feature) {
    if (!terria.workbenchSearchResult) {
        terria.workbenchSearchResult = new GeoJsonCatalogItem(terria);
        terria.workbenchSearchResult.name = "SearchedFeature";
        terria.workbenchSearchResult.clampToGround = true;
        terria.workbenchSearchResult.style = {
            'stroke-width': 2,
            'stroke': terria.baseMapContrastColor,
            'fill-opacity': 0,
            'marker-color': terria.baseMapContrastColor
        };
    }

    if (defined(terria.workbenchSearchResult.datasource)) terria.workbenchSearchResult.datasource.entities.removeAll();

    terria.workbenchSearchResult.data = feature;

    terria.workbenchSearchResult.load().then(function() {
        terria.workbenchSearchResult._enable();
        terria.workbenchSearchResult._show();
        terria.workbenchSearchResult.zoomTo();
    });
}

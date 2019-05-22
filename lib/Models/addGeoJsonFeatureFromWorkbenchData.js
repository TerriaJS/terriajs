const GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
const defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Adds a location marker to the map with the position supplied in the result, adding a data source to terria if one hasn't
 * already been added, and removing all previously added markers in that data source. This data source is stored in
 * terria.locationMarker.
 */
export default function addGeoJsonFeatureFromWorkbenchData(terria, result) {
    if (!terria.workbenchSearchResult) {
        terria.workbenchSearchResult = new GeoJsonCatalogItem(terria);
        terria.workbenchSearchResult.clampToGround = true;
        terria.workbenchSearchResult.style = {
            'stroke-width': 2,
            'stroke': terria.baseMapContrastColor,
            'fill-opacity': 0,
            'marker-color': terria.baseMapContrastColor
        };
    }
    terria.workbenchSearchResult.name = result.matchFieldText;

    if (defined(terria.workbenchSearchResult.datasource)) terria.workbenchSearchResult.datasource.entities.removeAll();

    terria.workbenchSearchResult.data = result.feature;

    if (terria.workbenchSearchResult.isShown || terria.workbenchSearchResult.isEnableable) {
        terria.workbenchSearchResult.isEnabled = true;
        terria.workbenchSearchResult.show = true;
        terria.workbenchSearchResult.zoomTo();    
    } else {
        terria.workbenchSearchResult.load().then(function() {
            terria.workbenchSearchResult.isEnabled = true;
            terria.workbenchSearchResult.show = true;
            terria.workbenchSearchResult.zoomTo();
        })
        .otherwise(function (err) {
            console.log("Couldn't zoom to feature");
        });        
    }

}

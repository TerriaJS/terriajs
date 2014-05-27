/*global require*/
require([
        'ausglobe',
        'ui/AusGlobeViewer',
        'domReady!'
    ], function(
        ausglobe,
        AusGlobeViewer) {
    "use strict";

    // GeoDataCollection Initialization
    var geoDataManager = new ausglobe.GeoDataCollection();

    // uncomment this line for local geospace testing
    geoDataManager.visStore = 'http://localhost:3000';
    console.log('The VisStore is set to:', geoDataManager.visStore);

    var viewer = new AusGlobeViewer(geoDataManager);
});
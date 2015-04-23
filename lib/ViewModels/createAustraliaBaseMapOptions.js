'use strict';

/*global require*/
var ArcGisMapServerCatalogItem = require('../Models/ArcGisMapServerCatalogItem');
var BaseMapViewModel = require('./BaseMapViewModel');
var CompositeCatalogItem = require('../Models/CompositeCatalogItem');
var WebMapServiceCatalogItem = require('../Models/WebMapServiceCatalogItem');

var createAustraliaBaseMapOptions = function(application) {
    var result = [];

    var naturalEarthII = new WebMapServiceCatalogItem(application);
    naturalEarthII.name = 'Natural Earth II';
    naturalEarthII.url = 'http://geoserver.nationalmap.nicta.com.au/imagery/natural-earth-ii/wms';
    naturalEarthII.layers = 'natural-earth-ii:NE2_HR_LC_SR_W_DR';
    naturalEarthII.parameters = {
        tiled: true
    };
    naturalEarthII.opacity = 1.0;

    var australianTopoOverlay = new ArcGisMapServerCatalogItem(application);
    australianTopoOverlay.name = 'Australian Topography';
    australianTopoOverlay.url = 'http://www.ga.gov.au/gis/rest/services/topography/National_Map_Basemap_WM/MapServer';
    australianTopoOverlay.opacity = 1.0;

    var australianTopo = new CompositeCatalogItem(application, [naturalEarthII, australianTopoOverlay]);
    australianTopo.name = 'Australian Topography';

    var australianHydroOverlay = new ArcGisMapServerCatalogItem(application);
    australianHydroOverlay.name = 'Australian Hydrography';
    australianHydroOverlay.url = 'http://www.ga.gov.au/gis/rest/services/topography/AusHydro_WM/MapServer';
    australianHydroOverlay.opacity = 1.0;

    var australianHydro = new CompositeCatalogItem(application, [naturalEarthII, australianHydroOverlay]);
    australianHydro.name = 'Australian Hydrography';

    result.push(new BaseMapViewModel({
        image: 'images/australian-topo.png',
        catalogItem: australianTopo,
    }));

    result.push(new BaseMapViewModel({
        image: 'images/hydro.png',
        catalogItem: australianHydro,
    }));

    return result;
};

module.exports = createAustraliaBaseMapOptions;

'use strict';

/*global require*/
var BaseMapViewModel = require('./BaseMapViewModel');
var BingMapsCatalogItem = require('../Models/BingMapsCatalogItem');
var WebMapServiceCatalogItem = require('../Models/WebMapServiceCatalogItem');

var BingMapsStyle = require('../../Cesium/Source/Scene/BingMapsStyle');

var createGlobalBaseMapOptions = function(application) {
    var result = [];

    var bingMapsAerialWithLabels = new BingMapsCatalogItem(application);
    bingMapsAerialWithLabels.name = 'Bing Maps Aerial with Labels';
    bingMapsAerialWithLabels.mapStyle = BingMapsStyle.AERIAL_WITH_LABELS;
    bingMapsAerialWithLabels.opacity = 1.0;

    result.push(new BaseMapViewModel({
        image: 'images/bing-aerial-labels.png',
        catalogItem: bingMapsAerialWithLabels
    }));

    var bingMapsAerial = new BingMapsCatalogItem(application);
    bingMapsAerial.name = 'Bing Maps Aerial';
    bingMapsAerial.mapStyle = BingMapsStyle.AERIAL;
    bingMapsAerial.opacity = 1.0;

    result.push(new BaseMapViewModel({
        image: 'images/bing-aerial.png',
        catalogItem: bingMapsAerial,
    }));

    var bingMapsRoads = new BingMapsCatalogItem(application);
    bingMapsRoads.name = 'Bing Maps Roads';
    bingMapsRoads.mapStyle = BingMapsStyle.ROAD;
    bingMapsRoads.opacity = 1.0;

    result.push(new BaseMapViewModel({
        image: 'images/bing-maps-roads.png',
        catalogItem: bingMapsRoads,
    }));

    var naturalEarthII = new WebMapServiceCatalogItem(application);
    naturalEarthII.name = 'Natural Earth II';
    naturalEarthII.url = 'http://geoserver.nationalmap.nicta.com.au/imagery/natural-earth-ii/wms';
    naturalEarthII.layers = 'natural-earth-ii:NE2_HR_LC_SR_W_DR';
    naturalEarthII.parameters = {
        tiled: true
    };
    naturalEarthII.opacity = 1.0;

    result.push(new BaseMapViewModel({
        image: 'images/natural-earth.png',
        catalogItem: naturalEarthII,
    }));

    var blackMarble = new WebMapServiceCatalogItem(application);
    blackMarble.name = 'NASA Black Marble';
    blackMarble.url = 'http://geoserver.nationalmap.nicta.com.au/imagery/nasa-black-marble/wms';
    blackMarble.layers = 'nasa-black-marble:dnb_land_ocean_ice.2012.54000x27000_geo';
    blackMarble.parameters = {
        tiled: true
    };
    blackMarble.opacity = 1.0;

    result.push(new BaseMapViewModel({
        image: 'images/black-marble.png',
        catalogItem: blackMarble,
    }));

    return result;
};

module.exports = createGlobalBaseMapOptions;

'use strict';

/*global require*/
const BaseMapViewModel = require('./BaseMapViewModel');
const BingMapsCatalogItem = require('../Models/BingMapsCatalogItem');
const BingMapsStyle = require('terriajs-cesium/Source/Scene/BingMapsStyle');

function createBingBaseMapOptions(terria, bingMapsKey) {
    const result = [];

    const bingMapsAerialWithLabels = new BingMapsCatalogItem(terria);
    bingMapsAerialWithLabels.name = 'Bing Maps Aerial with Labels';
    bingMapsAerialWithLabels.mapStyle = BingMapsStyle.AERIAL_WITH_LABELS;
    bingMapsAerialWithLabels.opacity = 1.0;
    bingMapsAerialWithLabels.key = bingMapsKey;
    bingMapsAerialWithLabels.isRequiredForRendering = true;

    result.push(new BaseMapViewModel({
        image: require('../../wwwroot/images/bing-aerial-labels.png'),
        catalogItem: bingMapsAerialWithLabels
    }));

    const bingMapsAerial = new BingMapsCatalogItem(terria);
    bingMapsAerial.name = 'Bing Maps Aerial';
    bingMapsAerial.mapStyle = BingMapsStyle.AERIAL;
    bingMapsAerial.opacity = 1.0;
    bingMapsAerial.key = bingMapsKey;
    bingMapsAerial.isRequiredForRendering = true;

    result.push(new BaseMapViewModel({
        image: require('../../wwwroot/images/bing-aerial.png'),
        catalogItem: bingMapsAerial
    }));

    const bingMapsRoads = new BingMapsCatalogItem(terria);
    bingMapsRoads.name = 'Bing Maps Roads';
    bingMapsRoads.mapStyle = BingMapsStyle.ROAD;
    bingMapsRoads.opacity = 1.0;
    bingMapsRoads.key = bingMapsKey;
    bingMapsRoads.isRequiredForRendering = true;

    result.push(new BaseMapViewModel({
        image: require('../../wwwroot/images/bing-maps-roads.png'),
        catalogItem: bingMapsRoads,
        contrastColor: '#000000'
    }));

    return result;
}

module.exports = createBingBaseMapOptions;

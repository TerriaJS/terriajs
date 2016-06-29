'use strict';

/*global require*/
var BaseMapViewModel = require('./BaseMapViewModel');
var BingMapsCatalogItem = require('../Models/BingMapsCatalogItem');

var BingMapsStyle = require('terriajs-cesium/Source/Scene/BingMapsStyle');

var createBingBaseMapOptions = function(terria, bingMapsKey) {
    var result = [];

    var bingMapsAerialWithLabels = new BingMapsCatalogItem(terria);
    bingMapsAerialWithLabels.name = 'Bing Maps Aerial with Labels';
    bingMapsAerialWithLabels.mapStyle = BingMapsStyle.AERIAL_WITH_LABELS;
    bingMapsAerialWithLabels.opacity = 1.0;
    bingMapsAerialWithLabels.key = bingMapsKey;
    bingMapsAerialWithLabels.isRequiredForRendering = true;

    result.push(new BaseMapViewModel({
        image: require('../../wwwroot/images/bing-aerial-labels.png'),
        catalogItem: bingMapsAerialWithLabels
    }));

    var bingMapsAerial = new BingMapsCatalogItem(terria);
    bingMapsAerial.name = 'Bing Maps Aerial';
    bingMapsAerial.mapStyle = BingMapsStyle.AERIAL;
    bingMapsAerial.opacity = 1.0;
    bingMapsAerial.key = bingMapsKey;
    bingMapsAerial.isRequiredForRendering = true;

    result.push(new BaseMapViewModel({
        image: require('../../wwwroot/images/bing-aerial.png'),
        catalogItem: bingMapsAerial
    }));

    var bingMapsRoads = new BingMapsCatalogItem(terria);
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
};

module.exports = createBingBaseMapOptions;

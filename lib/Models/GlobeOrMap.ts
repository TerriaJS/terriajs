'use strict';

import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Mappable from "./Mappable";

/*global require*/
var Color = require('terriajs-cesium/Source/Core/Color');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
// var featureDataToGeoJson = require('../Map/featureDataToGeoJson');
// var MapboxVectorTileImageryProvider = require('../Map/MapboxVectorTileImageryProvider');
// var MapboxVectorCanvasTileLayer = require('../Map/MapboxVectorCanvasTileLayer');
// var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');

var Feature = require('./Feature');
var ImageryLayer = require('terriajs-cesium/Source/Scene/ImageryLayer');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');

require('./ImageryLayerFeatureInfo'); // overrides Cesium's prototype.configureDescriptionFromProperties


export type CameraView = {
    rectangle: Cesium.Rectangle;
    position: any;
    direction: any;
    up: any;
}


export default interface GlobeOrMap {
    zoomTo(viewOrExtent: CameraView | Cesium.Rectangle | Mappable, flightDurationSeconds: number): void;
}

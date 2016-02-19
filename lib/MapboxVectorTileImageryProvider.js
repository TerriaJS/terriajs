'use strict';

/*global require*/
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var Event = require('terriajs-cesium/Source/Core/Event');
var defined = require('terriajs-cesium/Source/Core/defined');
var VectorTile = require('vector-tile').VectorTile;
var Protobuf = require('pbf');
var inside = require('point-in-polygon');
var loadArrayBuffer = require('terriajs-cesium/Source/Core/loadArrayBuffer');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var URI = require('urijs');
var URITemplate = require('urijs/src/URITemplate');

var ImageryLayerFeatureInfo = require('terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');

var POLYGON_FEATURE = 3; // feature.type == 3 for polygon features


var MapboxVectorTileImageryProvider = function (options) {
    // this._url = 'https://{s}.tiles.mapbox.com/v4/steve9164.1rjjq17t/';
    this._url = options.url; //'http://192.168.56.100:8080/SA4/';
    this._layerName = options.layerName; //'FID_SA4_2011_AUST';
    // this._fileExtension = defaultValue(options.fileExtension, 'vector.pbf');
    this._subdomains = defaultValue(options.subdomains, []);
    //this._csvItem = options.csvItem;

    if (defined(options.colorFunc)) {
        this._colorFunc = function (id) {
            var color = options.colorFunc(id);
            return color ? ('rgba(' + color.join(',') + ')') : undefined;

        }
    }
    else {
        this._colorFunc = function (id) {
            return 'rgb(0,' + (id & 0xFF00) + ',' + (id & 0xFF) + ')';
        }
    }

    this._tilingScheme = new WebMercatorTilingScheme();

    this._tileWidth = 256;
    this._tileHeight = 256;

    this._minimumLevel = 0;
    this._maximumLevel = 20;

    this._rectangle = defaultValue(Rectangle.intersection(options.rectangle, this._tilingScheme.rectangle), this._tilingScheme.rectangle);
    this._featurePicking = options.featurePicking;

    // Check the number of tiles at the minimum level.  If it's more than four,
    // throw an exception, because starting at the higher minimum
    // level will cause too many tiles to be downloaded and rendered.
    var swTile = this._tilingScheme.positionToTileXY(Rectangle.southwest(this._rectangle), this._minimumLevel);
    var neTile = this._tilingScheme.positionToTileXY(Rectangle.northeast(this._rectangle), this._minimumLevel);
    var tileCount = (Math.abs(neTile.x - swTile.x) + 1) * (Math.abs(neTile.y - swTile.y) + 1);
    if (tileCount > 4) {
        throw new DeveloperError('The imagery provider\'s rectangle and minimumLevel indicate that there are ' + tileCount + ' tiles at the minimum level. Imagery providers with more than four tiles at the minimum level are not supported.');
    }

    this._errorEvent = new Event();

    this._ready = true;
};

defineProperties(MapboxVectorTileImageryProvider.prototype, {
    url : {
        get : function() {
            return this._url;
        }
    },

    tileWidth : {
        get : function() {
            return this._tileWidth;
        }
    },


    tileHeight: {
        get : function() {
            return this._tileHeight;
        }
    },


    maximumLevel : {
        get : function() {
            return this._maximumLevel;
        }
    },


    minimumLevel : {
        get : function() {
            return this._minimumLevel;
        }
    },


    tilingScheme : {
        get : function() {
            return this._tilingScheme;
        }
    },


    rectangle : {
        get : function() {
            return this._rectangle;
        }
    },


    errorEvent : {
        get : function() {
            return this._errorEvent;
        }
    },


    ready : {
        get : function() {
            return this._ready;
        }
    },


    hasAlphaChannel : {
        get : function() {
            return true;
        }
    }
});

MapboxVectorTileImageryProvider.prototype._getSubdomain = function(x, y, level) {
    if (this._subdomains.length === 0) {
        return undefined;
    }
    else {
        var index = (x + y + level) % this._subdomains.length;
        return this._subdomains[index];
    }
};

MapboxVectorTileImageryProvider.prototype._buildImageUrl = function(x, y, level) {
    return URI.expand(this._url, {
        z: level,
        x: x,
        y: y,
        s: this._getSubdomain(x, y, level),
    });
};


/*MapboxVectorTileImageryProvider.prototype.getTileCredits = function(x, y, level) {
    return undefined;
};*/


MapboxVectorTileImageryProvider.prototype._requestImage = function(x, y, level, canvas) {
    var that = this;
    var url = this._buildImageUrl(x, y, level);

    return loadArrayBuffer(url).then(function(data) {
        var tile = new VectorTile(new Protobuf(data));
        var layer = tile.layers[that._layerName];

        if (!defined(layer)) {
            return canvas; // return blank canvas for blank tile
        }

        var context = canvas.getContext('2d');
        context.strokeStyle = "black";
        context.lineWidth = 1;

        // Change to tileXYToNative, convert points to native by using _tilingScheme.projection.project()
        var boundRect = that._tilingScheme.tileXYToNativeRectangle(x,y,level); // Bounding rectangle of requested tile

        var x_range = [boundRect.west, boundRect.east];
        var y_range = [boundRect.south, boundRect.north];

        var pixelArea = (x_range[1] - x_range[0])*(y_range[1] - y_range[0])/(canvas.width*canvas.height); // Web mercator is in metres

        var pos;

        var extentFactor = canvas.width/layer.extent;

        for (var i = 0; i < layer.length; i++) {
            var feature = layer.feature(i);
            if (feature.type === POLYGON_FEATURE) {
                var coordinates = feature.loadGeometry();

                //if (!defined(feature.properties.ALBERS_SQM) || feature.properties.ALBERS_SQM > pixelArea) {
                    var color = that._colorFunc(feature.properties[that._featurePicking.uniqueIdProp]);
                    if (!color) continue;
                    context.fillStyle = color;
                    for (var i2 = 0; i2 < coordinates.length; i2++) {
                        pos = coordinates[i2][0];
                        context.beginPath();
                        context.moveTo(pos.x*extentFactor, pos.y*extentFactor);

                        for (var j = 1; j < coordinates[i2].length; j++) {
                            pos = coordinates[i2][j];
                            //pos = Cartesian2.fromCartesian3(that._tilingScheme.projection.project(Cartographic.fromDegrees(json.geometry.coordinates[i2][j][0], json.geometry.coordinates[i2][j][1])));
                            //pos = map(pos, x_range, y_range, [0, canvas.width-1], [canvas.height-1, 0]);
                            context.lineTo(pos.x*extentFactor, pos.y*extentFactor);
                        }
                        context.closePath();
                        context.stroke();
                        context.fill();
                    }
                /*
                }
                else {
                    console.log('Skipping: ' + feature.properties[that._featurePicking.uniqueIdProp] + ' because it\'s area (' + feature.properties.ALBERS_SQM + ') is less than ' + pixelArea);
                }
                */
            }
            else {
                console.log('Unexpected geometry type: ' + feature.type + ' in region map');
            }
        }
        return canvas;
    });

};

MapboxVectorTileImageryProvider.prototype.requestImage = function(x, y, level) {
    var canvas = document.createElement('canvas');
    canvas.width = this._tileWidth;
    canvas.height = this._tileHeight;
    return this._requestImage(x, y, level, canvas);
};

function isExteriorRing(ring) {
    // Assuming ring.length >= 3 (a reasonable assumption since all polygons have >= 3 vertices)
    // The area calculated doesn't mean much since its in radians^2. The important aspect is the sign
    var n = ring.length;
    var twiceArea = ring[n-1][0]*(ring[0][1]-ring[n-2][1]) + ring[0][0]*(ring[1][1]-ring[n-1][1]);
    for (var i = 1; i <= n-2; i++) {
        twiceArea += ring[i][0]*(ring[i+1][1]-ring[i-1][1]); // From https://en.wikipedia.org/wiki/Shoelace_formula
    }
    return twiceArea >= 0;
}

// According to the Mapbox Vector Tile specifications, a polygon consists of one exterior ring followed by 0 or more interior rings. Therefore:
// for each ring:
//   if point in ring:
//     for each interior ring (following the exteri ring):
//       check point in interior ring
//     if point not in any interior rings, feature is clicked
function isFeatureClicked(rings, point) {
    for (var i = 0; i < rings.length; i++) {
        if (inside(point, rings[i])) { // Point is in an exterior ring
            // Check whether point is in any interior rings
            var inInteriorRing = false;
            while (i+1 < rings.length && !isExteriorRing(rings[i+1])) {
                i++;
                if (!inInteriorRing && inside(point, rings[i])) {
                    inInteriorRing = true;
                    // Don't break. Still need to iterate over the rest of the interior rings but don't do point-in-polygon tests on those
                }
            }

            // Point is in exterior ring, but not in any interior ring. Therefore point is in the feature region
            if (!inInteriorRing) {
                return true;
            }
        }
    }
    return false;
}


MapboxVectorTileImageryProvider.prototype.pickFeatures = function(x, y, level, longitude, latitude) {
    var that = this;
    var url = this._buildImageUrl(x, y, level);

    return loadArrayBuffer(url).then(function(data) {
        var layer = new VectorTile(new Protobuf(data)).layers[that._layerName];
        var point = [CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude)];

        var features = [];
        for (var i = 0; i < layer.length; i++) {
            var feature = layer.feature(i);
            if (feature.type === POLYGON_FEATURE && isFeatureClicked(feature.toGeoJSON(x, y, level).geometry.coordinates, point)) {
                var featureInfo = new ImageryLayerFeatureInfo();
                var uniqueId = feature.properties[that._featurePicking.uniqueIdProp];
                var rowObject = that._featurePicking.regionRowObjects[uniqueId];
                if (defined(rowObject)) {
                    featureInfo.properties = rowObject;
                    featureInfo.description = that._featurePicking.regionRowDescriptions[uniqueId];
                    featureInfo.configureNameFromProperties(feature.properties);
                } else {
                    featureInfo.properties = undefined;
                    featureInfo.description = undefined;
                }
                features.push(featureInfo);
            }

        }

        return features;
    });
};

module.exports = MapboxVectorTileImageryProvider;

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


var MapboxVectorTileImageryProvider = function (options) {
    // this._url = 'https://{s}.tiles.mapbox.com/v4/steve9164.1rjjq17t/';
    this._url = options.url; //'http://192.168.56.100:8080/SA4/';
    this._layerName = options.layerName; //'FID_SA4_2011_AUST';
    // this._fileExtension = defaultValue(options.fileExtension, 'vector.pbf');
    this._subdomains = defaultValue(options.subdomains, []);
    //this._csvItem = options.csvItem;

    if (defined(options.colorFunc)) {
        this._colorFunc = function (id) {
            return 'rgba(' + options.colorFunc(id).join(',') + ')';
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

    this._rectangle = defaultValue(options.rectangle, this._tilingScheme.rectangle);

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
        x: x,
        y: y,
        z: level,
        s: this._getSubdomain(x, y, level),
    });
};


MapboxVectorTileImageryProvider.prototype.getTileCredits = function(x, y, level) {
    return undefined;
};

MapboxVectorTileImageryProvider.prototype.requestImage = function(x, y, level) {
    var canvas = document.createElement('canvas');
    canvas.width = this._tileWidth;
    canvas.height = this._tileHeight;
    return this._requestImage(x, y, level, canvas);
};


MapboxVectorTileImageryProvider.prototype._requestImage = function(x, y, level, canvas) {
    var that = this;
    var url = this._buildImageUrl(x, y, level);

    return loadArrayBuffer(url).then(function(data) {
        var tile = new VectorTile(new Protobuf(data));
        var layer = tile.layers[that._layerName];

        if (!defined(layer)) {
            return undefined;
        }

        var context = canvas.getContext('2d');

        // Change to tileXYToNative, convert points to native by using _tilingScheme.projection.project()
        var boundRect = that._tilingScheme.tileXYToNativeRectangle(x,y,level); // Bounding rectangle of requested tile in cartographic (radians)

        var x_range = [boundRect.west, boundRect.east];
        var y_range = [boundRect.north, boundRect.south];

        var map = function (pos, in_x_range, in_y_range, out_x_range, out_y_range) {
            var offset = new Cartesian2();
            Cartesian2.subtract(pos, new Cartesian2(in_x_range[0], in_y_range[0]), offset); // Offset of point from bottom left corner of bounding box
            var scale = new Cartesian2((out_x_range[1] - out_x_range[0]) / (in_x_range[1] - in_x_range[0]), (out_y_range[1] - out_y_range[0]) / (in_y_range[1] - in_y_range[0]));
            return Cartesian2.add(Cartesian2.multiplyComponents(offset, scale, new Cartesian2()), new Cartesian2(out_x_range[0], out_y_range[0]), new Cartesian2());
        }

        var pos;

        for (var i = 0; i < layer.length; i++) {
            var json = layer.feature(i).toGeoJSON(x, y, level);
            if (json.geometry.type == 'Polygon') {
                for (var i2 = 0; i2 < json.geometry.coordinates.length; i2++) {
                    // Start path
                    context.beginPath();
                    pos = Cartesian2.fromCartesian3(that._tilingScheme.projection.project(Cartographic.fromDegrees(json.geometry.coordinates[i2][0][0], json.geometry.coordinates[i2][0][1])));
                    pos = map(pos, x_range, y_range, [0, that._tileWidth-1], [0, that._tileHeight-1]);
                    context.moveTo(pos.x, pos.y);

                    for (var j = 1; j < json.geometry.coordinates[i2].length; j++) {
                        pos = Cartesian2.fromCartesian3(that._tilingScheme.projection.project(Cartographic.fromDegrees(json.geometry.coordinates[i2][j][0], json.geometry.coordinates[i2][j][1])));
                        pos = map(pos, x_range, y_range, [0, that._tileWidth-1], [0, that._tileHeight-1]);
                        context.lineTo(pos.x, pos.y);
                    }
                    context.closePath();
                    context.strokeStyle = "black";
                    context.lineWidth = 1;
                    context.stroke();
                    context.fillStyle = that._colorFunc(json.properties.FID);
                    context.fill();
                }
            }

        }
        return canvas;
    }).otherwise(function(err) { });

};


MapboxVectorTileImageryProvider.prototype.pickFeatures = function(x, y, level, longitude, latitude) {
    var that = this;
    var url = this._buildImageUrl(x, y, level);

    return loadArrayBuffer(url).then(function(data) {
        var layer = new VectorTile(new Protobuf(data)).layers[that._layerName];

        var to_deg = function (rad) {
            return 180 * rad / Math.PI;
        }

        var point = [to_deg(longitude), to_deg(latitude)];

        var features = [];

        for (var i = 0; i < layer.length; i++) {
            var json = layer.feature(i).toGeoJSON(x, y, level);
            if (json.geometry.type == 'Polygon') {
                for (var i2 = 0; i2 < json.geometry.coordinates.length; i2++) {
                    // Check whether point is in this polygon
                    if (inside(point, json.geometry.coordinates[i2])) {
                        var feature = new ImageryLayerFeatureInfo();
                        /*feature.properties = Object.assign({}, json.properties);
                        feature.properties.FID = json.id - 1;*/
                        //feature.configureDescriptionFromProperties(that._csvItem.rowProperties(json.properties.FID));
                        feature.name = json.properties["SA4_NAME11"];
                        feature.data = json.geometry.coordinates;
                        features.push(feature);
                        break; // No need to check other polygons with the same id
                    }
                }
            }

        }

        return features;
    });
};

module.exports = MapboxVectorTileImageryProvider;

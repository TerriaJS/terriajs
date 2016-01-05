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
var loadArrayBuffer = require('terriajs-cesium/Source/Core/loadArrayBuffer');

var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');


var MapboxVectorTileImageryProvider = function (colorFunc) {
    this._url = 'https://b.tiles.mapbox.com/v4/steve9164.1rjjq17t/';
    this._layerName = '1270055001_sa4_2011_aust_shape';
    this._fileExtension = 'vector.pbf';
    this._accessToken = 'pk.eyJ1Ijoic3RldmU5MTY0IiwiYSI6ImNpaWd5b3g1MTAybnh0a2tzODVzc3pncXkifQ.N3eovPIHdr0dZopBqyQb-g';

    if (defined(colorFunc)) {
        this._colorFunc = function (id) {
            var color = colorFunc(id);
            color[3] = 1; // /= 255; // Convert alpha from 0-255 to 0-1
            return 'rgba(' + colorFunc(id).join(',') + ')';
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
    //this._maximumLevel = ?;

    this._rectangle = this._tilingScheme.rectangle;

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

function buildImageUrl(imageryProvider, x, y, level) {
    var url = imageryProvider.url + level + '/' + x + '/' + y + '.' + imageryProvider._fileExtension + '?access_token=' + imageryProvider._accessToken;
    return url;
}

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
    var url = buildImageUrl(this, x, y, level);

    return loadArrayBuffer(url).then(function(data) {
        var layer = new VectorTile(new Protobuf(data)).layers[that._layerName];

        var context = canvas.getContext('2d');

        var boundRect = that._tilingScheme.tileXYToRectangle(x,y,level); // Bounding rectangle of requested tile in cartographic (radians)

        var to_deg = function (rad) {
            return 180 * rad / Math.PI;
        }
        var x_range = [to_deg(boundRect.west), to_deg(boundRect.east)];
        var y_range = [to_deg(boundRect.north), to_deg(boundRect.south)];

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
                    pos = map(new Cartesian2(json.geometry.coordinates[i2][0][0], json.geometry.coordinates[i2][0][1]), x_range, y_range, [0, that._tileWidth-1], [0, that._tileHeight-1]);
                    context.moveTo(pos.x, pos.y);

                    for (var j = 1; j < json.geometry.coordinates[i2].length; j++) {
                        pos = map(new Cartesian2(json.geometry.coordinates[i2][j][0], json.geometry.coordinates[i2][j][1]), x_range, y_range, [0, that._tileWidth-1], [0, that._tileHeight-1]);
                        context.lineTo(pos.x, pos.y);
                    }
                    context.closePath();
                    context.fillStyle = that._colorFunc(json.id);
                    context.fill();
                }
            }

        }

        return canvas;
    });

};


MapboxVectorTileImageryProvider.prototype.pickFeatures = function() {
    return undefined;
};

module.exports = MapboxVectorTileImageryProvider;

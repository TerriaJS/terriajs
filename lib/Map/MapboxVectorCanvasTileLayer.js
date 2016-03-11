'use strict';

/*global require*/
var L = require('leaflet');
var defined = require('terriajs-cesium/Source/Core/defined');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var pollToPromise = require('../Core/pollToPromise');

var MapboxVectorCanvasTileLayer = L.TileLayer.Canvas.extend({
    initialize: function(imageryProvider, options) {
        this._imageryProvider = imageryProvider;
        options.tileSize = 256;
        this.errorEvent = new CesiumEvent();

        this.initialized = false;
        this._usable = false;

        this._delayedUpdate = undefined;
        this._zSubtract = 0;
        this._previousCredits = [];

        var that = this;
        this._ipReady = pollToPromise(function() { return that._imageryProvider.ready; });

        L.TileLayer.Canvas.prototype.initialize.call(this, options);
    },

    drawTile: function (canvas, tilePoint, zoom) {
        var that = this;
        this._ipReady.then(function() {
            var n = that._imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(zoom);
            return that._imageryProvider._requestImage(CesiumMath.mod(tilePoint.x, n), tilePoint.y, zoom, canvas);
        }).then(function (canvas) {
            that.tileDrawn(canvas);
        });
    },

    pickFeatures: function(map, longitudeRadians, latitudeRadians) {
        var point = new Cartographic(CesiumMath.negativePiToPi(longitudeRadians), latitudeRadians, 0.0);
        var level = map.getZoom();

        var that = this;
        return this._ipReady.then(function() {
            var tilingScheme = that._imageryProvider.tilingScheme;
            var tileCoordinates = tilingScheme.positionToTileXY(point, level);
            if (!defined(tileCoordinates)) {
                return undefined;
            }

            return that._imageryProvider.pickFeatures(tileCoordinates.x, tileCoordinates.y, level, longitudeRadians, latitudeRadians);
        });
    }
});

module.exports = MapboxVectorCanvasTileLayer;

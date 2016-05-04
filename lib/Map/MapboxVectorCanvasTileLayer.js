'use strict';

/*global require*/
var L = require('leaflet');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var pollToPromise = require('../Core/pollToPromise');

var MapboxVectorCanvasTileLayer = L.TileLayer.Canvas.extend({
    initialize: function(imageryProvider, options) {
        this.imageryProvider = imageryProvider;
        options.tileSize = 256;
        this.errorEvent = new CesiumEvent();

        this.initialized = false;
        this._usable = false;

        this._delayedUpdate = undefined;
        this._zSubtract = 0;
        this._previousCredits = [];

        var that = this;
        this._ipReady = pollToPromise(function() { return that.imageryProvider.ready; });

        L.TileLayer.Canvas.prototype.initialize.call(this, options);
    },

    drawTile: function (canvas, tilePoint, zoom) {
        var that = this;
        this._ipReady.then(function() {
            var n = that.imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(zoom);
            return that.imageryProvider._requestImage(CesiumMath.mod(tilePoint.x, n), tilePoint.y, zoom, canvas);
        }).then(function (canvas) {
            that.tileDrawn(canvas);
        });
    },

    getFeaturePickingCoords: function(map, longitudeRadians, latitudeRadians) {
        var ll = new Cartographic(CesiumMath.negativePiToPi(longitudeRadians), latitudeRadians, 0.0);
        var level = map.getZoom();

        var that = this;

        return pollToPromise(function() {
            return that.imageryProvider.ready;
        }).then(function() {
            var tilingScheme = that.imageryProvider.tilingScheme;
            var coords = tilingScheme.positionToTileXY(ll, level);
            return {
                x: coords.x,
                y: coords.y,
                level: level
            };
        });
    },

    pickFeatures: function(x, y, level, longitudeRadians, latitudeRadians) {
        var that = this;
        return pollToPromise(function() {
            return that.imageryProvider.ready;
        }).then(function() {
            return that.imageryProvider.pickFeatures(x, y, level, longitudeRadians, latitudeRadians);
        });
    },
});

module.exports = MapboxVectorCanvasTileLayer;

'use strict';

/*global require*/
var L = require('leaflet');
var defined = require('terriajs-cesium/Source/Core/defined');

var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var pollToPromise = require('./Core/pollToPromise');

var MapboxVectorCanvasTileLayer = L.TileLayer.Canvas.extend({
    initialize: function(imageryProvider, options) {
        this._imageryProvider = imageryProvider;
        options.tileSize = 256;
        options.reuseTiles = true;
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
            // Wrap tilePoint.x to the correct range when the map is zoomed out enough that it repeats
            function mod(x, n) { return ((x % n) + n) % n; } // Fix JS weird modulo operator
            var n = that._imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(zoom);
            return that._imageryProvider._requestImage(mod(tilePoint.x, n), tilePoint.y, zoom, canvas);
        }).then(function (canvas) {
            that.tileDrawn(canvas);
        });
    },

    pickFeatures: function(map, longitudeRadians, latitudeRadians) {
        // Wrap longitudeRadians to the range [-pi, pi)
        function mod(x, n) { return ((x % n) + n) % n; } // Fix JS weird modulo operator
        longitudeRadians = mod(longitudeRadians + Math.PI, 2*Math.PI) - Math.PI;

        var point = new Cartographic(longitudeRadians, latitudeRadians, 0.0);

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

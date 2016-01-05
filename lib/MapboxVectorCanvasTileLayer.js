'use strict';

/*global require*/
var L = require('leaflet');
var defined = require('terriajs-cesium/Source/Core/defined');

//var CesiumTileLayer = require('../Map/CesiumTileLayer');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');

var MapboxVectorCanvasTileLayer = L.TileLayer.Canvas.extend({
    initialize: function(imageryProvider, options) {
        this.imageryProvider = imageryProvider;
        this.tileSize = 256;
        this.errorEvent = new CesiumEvent();

        this.initialized = false;
        this._usable = false;

        this._delayedUpdate = undefined;
        this._zSubtract = 0;
        this._previousCredits = [];

        L.TileLayer.prototype.initialize.call(this, undefined, options);
    },

    drawTile: function (canvas, tilePoint, zoom) {
        var that = this;
        this.imageryProvider._requestImage(tilePoint.x, tilePoint.y, zoom, canvas).then(function (canvas) {
            that.tileDrawn(canvas);
        });


    }



});

module.exports = MapboxVectorCanvasTileLayer;

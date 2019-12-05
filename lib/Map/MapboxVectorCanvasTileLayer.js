"use strict";

/*global require*/
var L = require("leaflet");

var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var CesiumEvent = require("terriajs-cesium/Source/Core/Event").default;
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var pollToPromise = require("../Core/pollToPromise");

var MapboxVectorCanvasTileLayer = L.GridLayer.extend({
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
    this._ipReady = pollToPromise(function() {
      return that.imageryProvider.ready;
    });

    L.GridLayer.prototype.initialize.call(this, options);
  },

  createTile: function(tilePoint, done) {
    var canvas = L.DomUtil.create("canvas", "leaflet-tile");
    var size = this.getTileSize();
    canvas.width = size.x;
    canvas.height = size.y;

    var that = this;
    this._ipReady
      .then(function() {
        var n = that.imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(
          tilePoint.z
        );
        return that.imageryProvider._requestImage(
          CesiumMath.mod(tilePoint.x, n),
          tilePoint.y,
          tilePoint.z,
          canvas
        );
      })
      .then(function(canvas) {
        done(undefined, canvas);
      });
    return canvas; // Not yet drawn on, but Leaflet requires the tile
  },

  getFeaturePickingCoords: function(map, longitudeRadians, latitudeRadians) {
    var ll = new Cartographic(
      CesiumMath.negativePiToPi(longitudeRadians),
      latitudeRadians,
      0.0
    );
    var level = Math.round(map.getZoom());

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
      return that.imageryProvider.pickFeatures(
        x,
        y,
        level,
        longitudeRadians,
        latitudeRadians
      );
    });
  }
});

module.exports = MapboxVectorCanvasTileLayer;

'use strict';

/*global require*/
var L = require('leaflet');
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var ImageryProvider = require('terriajs-cesium/Source/Scene/ImageryProvider');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');

var pollToPromise = require('../Core/pollToPromise');

var swScratch = new Cartographic();
var neScratch = new Cartographic();
var swTileCoordinatesScratch = new Cartesian2();
var neTileCoordinatesScratch = new Cartesian2();

var CesiumTileLayer = L.TileLayer.extend({
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

    getTileUrl: function(tilePoint) {
        var z = tilePoint.z - this._zSubtract;
        if (z < 0) {
            return this.options.errorTileUrl;
        }

        var oldLoad = ImageryProvider.loadImage;

        var tileUrl = this.options.errorTileUrl;
        ImageryProvider.loadImage = function(imageryProvider, url) {
            tileUrl = url;
        };

        this.imageryProvider.requestImage(tilePoint.x, tilePoint.y, z);

        ImageryProvider.loadImage = oldLoad;

        return tileUrl;
    },

    _update: function() {
        if (!this.imageryProvider.ready) {
            if (!this._delayedUpdate) {
                var that = this;
                this._delayedUpdate = setTimeout(function() {
                    that._delayedUpdate = undefined;
                    that._update.apply(that, arguments);
                }, 100);
            }
            return;
        }

        if (!this.initialized) {
            this.initialized = true;

            var tilingScheme = this.imageryProvider.tilingScheme;
            if (!(tilingScheme instanceof WebMercatorTilingScheme)) {
                this.errorEvent.raiseEvent(this, 'This dataset cannot be displayed on the 2D map because it does not support the Web Mercator (EPSG:3857) projection.');
                return;
            }

            if (tilingScheme.getNumberOfXTilesAtLevel(0) === 2 && tilingScheme.getNumberOfYTilesAtLevel(0) === 2) {
                this._zSubtract = 1;
            } else if (tilingScheme.getNumberOfXTilesAtLevel(0) !== 1 || tilingScheme.getNumberOfYTilesAtLevel(0) !== 1) {
                this.errorEvent.raiseEvent(this, 'This dataset cannot be displayed on the 2D map because it uses an usual tiling scheme that is not supported.');
                return;
            }

            if (defined(this.imageryProvider.maximumLevel)) {
                this.options.maxNativeZoom = this.imageryProvider.maximumLevel;
            }

            if (defined(this.imageryProvider.credit)) {
                this._map.attributionControl.addAttribution(getCreditHtml(this.imageryProvider.credit));
            }

            this._usable = true;
        }

        if (this._usable) {
            L.TileLayer.prototype._update.apply(this, arguments);

            this._updateAttribution();
        }
    },

    _updateAttribution: function() {
        if (!this._usable || !defined(this.imageryProvider.getTileCredits)) {
            return;
        }

        var i;
        for (i = 0; i < this._previousCredits.length; ++i) {
            this._previousCredits[i]._shownInLeafletLastUpdate = this._previousCredits[i]._shownInLeaflet;
            this._previousCredits[i]._shownInLeaflet = false;
        }

        var bounds = this._map.getBounds();
        var zoom = this._map.getZoom() - this._zSubtract;

        var tilingScheme = this.imageryProvider.tilingScheme;

        swScratch.longitude = Math.max(CesiumMath.negativePiToPi(CesiumMath.toRadians(bounds.getWest())), tilingScheme.rectangle.west);
        swScratch.latitude = Math.max(CesiumMath.toRadians(bounds.getSouth()), tilingScheme.rectangle.south);
        var sw = tilingScheme.positionToTileXY(swScratch, zoom, swTileCoordinatesScratch);
        if (!defined(sw)) {
            sw = swTileCoordinatesScratch;
            sw.x = 0;
            sw.y = tilingScheme.getNumberOfYTilesAtLevel(zoom) - 1;
        }

        neScratch.longitude = Math.min(CesiumMath.negativePiToPi(CesiumMath.toRadians(bounds.getEast())), tilingScheme.rectangle.east);
        neScratch.latitude = Math.min(CesiumMath.toRadians(bounds.getNorth()), tilingScheme.rectangle.north);
        var ne = tilingScheme.positionToTileXY(neScratch, zoom, neTileCoordinatesScratch);
        if (!defined(ne)) {
            ne = neTileCoordinatesScratch;
            ne.x = tilingScheme.getNumberOfXTilesAtLevel(zoom) - 1;
            ne.y = 0;
        }

        var nextCredits = [];

        for (var j = ne.y; j < sw.y; ++j) {
            for (i = sw.x; i < ne.x; ++i) {
                var credits = this.imageryProvider.getTileCredits(i, j, zoom);
                if (!defined(credits)) {
                    continue;
                }

                for (var k = 0; k < credits.length; ++k) {
                    var credit = credits[k];
                    if (credit._shownInLeaflet) {
                        continue;
                    }

                    credit._shownInLeaflet = true;
                    nextCredits.push(credit);

                    if (!credit._shownInLeafletLastUpdate) {
                        this._map.attributionControl.addAttribution(getCreditHtml(credit));
                    }
                }
            }
        }

        // Remove attributions that applied last update but not this one.
        for (i = 0; i < this._previousCredits.length; ++i) {
            if (!this._previousCredits[i]._shownInLeaflet) {
                this._map.attributionControl.removeAttribution(getCreditHtml(this._previousCredits[i]));
                this._previousCredits[i]._shownInLeafletLastUpdate = false;
            }
        }

        this._previousCredits = nextCredits;
    },

    pickFeatures: function(map, longitudeRadians, latitudeRadians) {
        var ll = new Cartographic(longitudeRadians, latitudeRadians, 0.0);

        var level = map.getZoom();

        var that = this;
        return pollToPromise(function() {
            return that.imageryProvider.ready;
        }).then(function() {
            var tilingScheme = that.imageryProvider.tilingScheme;
            var tileCoordinates = tilingScheme.positionToTileXY(ll, level);
            if (!defined(tileCoordinates)) {
                return undefined;
            }

            return that.imageryProvider.pickFeatures(tileCoordinates.x, tileCoordinates.y, level, longitudeRadians, latitudeRadians);
        });
    },

    onRemove: function(map) {
        for (var i = 0; i < this._previousCredits.length; ++i) {
            this._previousCredits[i]._shownInLeafletLastUpdate = false;
            this._previousCredits[i]._shownInLeaflet = false;
            map.attributionControl.removeAttribution(getCreditHtml(this._previousCredits[i]));
        }

        if (this._usable && defined(this.imageryProvider.credit)) {
            map.attributionControl.removeAttribution(getCreditHtml(this.imageryProvider.credit));
        }

        L.TileLayer.prototype.onRemove.apply(this, [map]);
    }
});

function getCreditHtml(credit) {
    var result = '';
    if (credit.link) {
        result += '<a href="' + credit.link + '">';
    }
    if (credit.imageUrl) {
        result += '<img src="' + credit.imageUrl + '" />';
    } else if (credit.text) {
        result += credit.text;
    }
    if (credit.link) {
        result += '</a>';
    }
    return result;
}

module.exports = CesiumTileLayer;

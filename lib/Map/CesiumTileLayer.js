'use strict';

/*global require*/
var L = require('leaflet');
var ArcGisMapServerImageryProvider = require('terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider');
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var ImageryProvider = require('terriajs-cesium/Source/Scene/ImageryProvider');
var loadBlob = require('terriajs-cesium/Source/Core/loadBlob');
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

    createTile: function(coords, done) {
        var originalDone = done;

        console.log("ArcGisMapServerImageryProvider:1");                // TODO REMOVE DEBUG ONLY
        // Handle the case where we are using a ArcGisMapServerImageryProvider layer which has a token
        // (in this case loadImageViaBlob is used rather then ImageryProvider.loadImage and so our other
        // hack for obtaining the URI doesn't work).
        if (this.imageryProvider instanceof ArcGisMapServerImageryProvider) {
            console.log("ArcGisMapServerImageryProvider:2");            // TODO REMOVE DEBUG ONLY
            if (defined(this.imageryProvider._requestNewToken)) {
                this.arcGisMapServerWithToken = true;
                console.log("ArcGisMapServerImageryProvider:3");        // TODO REMOVE DEBUG ONLY

                // Temporarily replace done() with a placeholder function (we will restore this once we have async
                // retrieved the image). We replace the function so that we can use the default implementation and
                // only deviate in the specific ways that we need to for our special case.
                done = function(var1, var2) {};
            }
        }

        var tile = L.TileLayer.prototype.createTile.call(this, coords, done);

        if (this.arcGisMapServerWithToken) {
            var z = coords.z - this._zSubtract;
            if (z >= 0) {
                tile.originalDone = originalDone;
                this.requestImage(tile, coords.x, coords.y, z);
            }

            this.arcGisMapServerWithToken = false;
        }

        return tile;
    },

    // Note: This code has been largely copied wholesale from terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider.js and modified to fit this particular use case.
    //       While it would be desireable to refactor that code so that we could call it rather then copy-paste it, work is currently underway in Cesium to refactor how
    //       resources are loaded (https://github.com/AnalyticalGraphicsInc/cesium/pull/6035) and so it seems better to copy paste for now until that has been completed and
    //       merged and then come back and clean this up properly once that is in place.
    requestImage: function(tile, x, y, level) {
        var that = this;
        var tokenRetries = 1;
        function loadImageWithToken (url) {
            return that.loadImage(tile, url).otherwise(function(requestErrorEvent) {
                // If the token has expired or was not supplied the server sets the HTTP status code to 498/499 specifically to indicate these errors.
                if (((requestErrorEvent.statusCode === 498) || (requestErrorEvent.statusCode === 499)) && (tokenRetries > 0)) {
                    tokenRetries--;

                    // Note: The token may have already been updated between the request and now (when the response is received),
                    // but for now we don't detect and optimize for this case and send off a new token request regardless.
                    return ArcGisMapServerImageryProvider.updateToken(that.imageryProvider).then(function () {
                        // Rebuild the URL now that the token has been updated.
                        url = ArcGisMapServerImageryProvider.buildImageUrl(that.imageryProvider, x, y, level);
                        return loadImageWithToken(url);
                    });
                }

                throw requestErrorEvent;
            }).otherwise(function(requestErrorEvent) {
                // There is nothing more that we can do, so restore state and fail.
                L.DomEvent.on(tile, 'load', L.bind(that._tileOnLoad, that, tile.originalDone, tile));
                L.DomEvent.on(tile, 'error', L.bind(that._tileOnError, that, tile.originalDone, tile));
                tile.src = that.options.errorTileUrl;
            });
        }

        var url = ArcGisMapServerImageryProvider.buildImageUrl(this.imageryProvider, x, y, level);
        // TODO: Reimplement throttling.
        //return throttleRequestByServer(url, loadImageWithToken);
        loadImageWithToken(url);
    },

    loadImage: function(tile, url) {
        // TODO: Handle the case where blob is not supported for IE.

        var that = this;
        return loadBlob(url).then(function(blob) {
            var blobUrl = window.URL.createObjectURL(blob);

            function doneThenRevokeBlob(error, tile) {
                tile.originalDone(error, tile);

                window.URL.revokeObjectURL(blobUrl);
            };

            L.DomEvent.on(tile, 'load', L.bind(that._tileOnLoad, that, doneThenRevokeBlob, tile));
            L.DomEvent.on(tile, 'error', L.bind(that._tileOnError, that, doneThenRevokeBlob, tile));
            tile.src = blobUrl;
        });
    },

    getTileUrl: function(tilePoint) {
        var z = tilePoint.z - this._zSubtract;
        if (z < 0) {
            return this.options.errorTileUrl;
        }

        if (this.arcGisMapServerWithToken) {
            // We deal with this as a special case so don't bother generating a valid URL.
            // We use the error URL so that if we are not able to load a correct URL the error URL will be used.
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
        var that = this;

        if (!this.imageryProvider.ready) {
            if (!this._delayedUpdate) {
                this._delayedUpdate = setTimeout(function() {
                    that._delayedUpdate = undefined;
                    that._update();
                }, 100);
            }
            return;
        }

        if (!this.initialized) {
            this.initialized = true;

            // Cancel the existing delayed update, if any.
            if (this._delayedUpdate) {
                clearTimeout(this._delayedUpdate);
                this._delayedUpdate = undefined;
            }

            this._delayedUpdate = setTimeout(function() {
                that._delayedUpdate = undefined;

                // If we're no longer attached to a map, do nothing.
                if (!that._map) {
                    return;
                }

                var tilingScheme = that.imageryProvider.tilingScheme;
                if (!(tilingScheme instanceof WebMercatorTilingScheme)) {
                    that.errorEvent.raiseEvent(that, 'This dataset cannot be displayed on the 2D map because it does not support the Web Mercator (EPSG:3857) projection.');
                    return;
                }

                if (tilingScheme.getNumberOfXTilesAtLevel(0) === 2 && tilingScheme.getNumberOfYTilesAtLevel(0) === 2) {
                    that._zSubtract = 1;
                } else if (tilingScheme.getNumberOfXTilesAtLevel(0) !== 1 || tilingScheme.getNumberOfYTilesAtLevel(0) !== 1) {
                    that.errorEvent.raiseEvent(that, 'This dataset cannot be displayed on the 2D map because it uses an unusual tiling scheme that is not supported.');
                    return;
                }

                if (defined(that.imageryProvider.maximumLevel)) {
                    that.options.maxNativeZoom = that.imageryProvider.maximumLevel;
                }

                if (defined(that.imageryProvider.credit)) {
                    that._map.attributionControl.addAttribution(getCreditHtml(that.imageryProvider.credit));
                }

                that._usable = true;

                that._update();
            }, 100);
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

    getFeaturePickingCoords: function(map, longitudeRadians, latitudeRadians) {
        var ll = new Cartographic(CesiumMath.negativePiToPi(longitudeRadians), latitudeRadians, 0.0);
        var level = Math.round(map.getZoom());

        return pollToPromise(function() {
            return this.imageryProvider.ready;
        }.bind(this)).then(function() {
            var tilingScheme = this.imageryProvider.tilingScheme;
            var coords = tilingScheme.positionToTileXY(ll, level);
            return {
                x: coords.x,
                y: coords.y,
                level: level
            };
        }.bind(this));
    },

    pickFeatures: function(x, y, level, longitudeRadians, latitudeRadians) {
        return pollToPromise(function() {
            return this.imageryProvider.ready;
        }.bind(this)).then(function() {
            return this.imageryProvider.pickFeatures(x, y, level, longitudeRadians, latitudeRadians);
        }.bind(this));
    },

    onRemove: function(map) {
        if (this._delayedUpdate) {
            clearTimeout(this._delayedUpdate);
            this._delayedUpdate = undefined;
        }

        for (var i = 0; i < this._previousCredits.length; ++i) {
            this._previousCredits[i]._shownInLeafletLastUpdate = false;
            this._previousCredits[i]._shownInLeaflet = false;
            map.attributionControl.removeAttribution(getCreditHtml(this._previousCredits[i]));
        }

        if (this._usable && defined(this.imageryProvider.credit)) {
            map.attributionControl.removeAttribution(getCreditHtml(this.imageryProvider.credit));
        }

        L.TileLayer.prototype.onRemove.apply(this, [map]);

        // Check that this cancels tile requests when dragging the time slider and rapidly creating
        // and destroying layers.  If the image requests for previous times/layers are allowed to hang
        // around, they clog up the pipeline and it takes approximately forever for the browser
        // to get around to downloading the tiles that are actually needed.
        this._abortLoading();
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

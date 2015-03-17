'use strict';

/*global require,L*/
var defined = require('../../third_party/cesium/Source/Core/defined');

var CesiumTileLayer = L.TileLayer.extend({
    initialize: function(imageryProvider, options) {
        this.imageryProvider = imageryProvider;
        this.tileSize = 256;
    },

    _createTile: function() {
        var tile = L.DomUtil.create('div', 'leaflet-tile');
        tile.style.width = tile.style.height = this._getTileSize() + 'px';
        return tile;
    },

    _loadTile: function(div, tilePoint) {
        div._layer = this;

        var promise = this.imageryProvider.requestImage(tilePoint.x, tilePoint.y, tilePoint.z);
        if (!defined(promise)) {
            console.log('deferred');
        } else {
            var that = this;
            return promise.then(function(image) {
                var tile = L.DomUtil.create('img', 'leaflet-tile');
                tile.style.width = tile.style.height = that._getTileSize() + 'px';
                tile.galleryimg = 'no';

                tile.onselectstart = tile.onmousemove = L.Util.falseFn;

                if (L.Browser.ielt9 && that.options.opacity !== undefined) {
                    L.DomUtil.setOpacity(tile, that.options.opacity);
                }
                // without this hack, tiles disappear after zoom on Chrome for Android
                // https://github.com/Leaflet/Leaflet/issues/2078
                if (L.Browser.mobileWebkit3d) {
                    tile.style.WebkitBackfaceVisibility = 'hidden';
                }

                div.appendChild(tile);

                tile._layer = that;

                that._tileOnLoad.call(tile);
            });
        }
    }
});

module.exports = CesiumTileLayer;

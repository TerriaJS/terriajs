'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var when = require('terriajs-cesium/Source/ThirdParty/when');

/**
 * Finds the lowest (most accurate) available terrain level at the given cartographic position.
 * @param {Cartographic} position The cartographic position.
 * @param {TerrainProvider} terrainProvider The terrain provider.
 * @return {Promise} A promise which resolves to the terrain level.
 */
var lowestTerrainLevel = function(position, terrainProvider) {

    var deferred = when.defer();

    function getLevelWhenReady() {
        if (terrainProvider.ready) {
            var tilingScheme = terrainProvider.tilingScheme;
            var tiles = terrainProvider._availableTiles;
            if (!defined(tiles)) {deferred.resolve(0); return;}
            var lowestLevel;
            for (var level = tiles.length - 1; level >= 0; level--) {
                var xy = tilingScheme.positionToTileXY(position,level);
                if (defined(xy)) {
                    if (terrainProvider.getTileDataAvailable(xy.x,xy.y,level)) {
                        lowestLevel = level;
                        break;
                    }
                }
            }
            deferred.resolve(lowestLevel);
        } else {
            setTimeout(getLevelWhenReady, 10);
        }
    }

    getLevelWhenReady();

    return deferred.promise;

};

module.exports = lowestTerrainLevel;

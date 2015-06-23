'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * Selects a base map by name from a list of base map options.  The name is specified by `terria.baseMapName`, or,
 * if that property is undefined, by the specified `defaultBaseMapName`.  In addition to setting `terria.baseMap`,
 * this function subscribes to be notified when `terria.baseMapName` changes and updates `terria.baseMap`
 * accordingly.  If a base map with the name is not in the `baseMaps` list, this method leaves the
 * `terria.baseMap` property unmodified.
 *
 * @param {Terria} terria The TerriaJS application.
 * @param {BaseMapViewModel} baseMaps The list of possible base maps.
 * @param {string} defaultBaseMapName The name of the
 */
var selectBaseMap = function(terria, baseMaps, defaultBaseMapName) {
    var baseMapName = defaultValue(terria.baseMapName, defaultBaseMapName);

    function updateBaseMap(baseMapName) {
        if (!defined(baseMapName)) {
            return;
        }

        for (var i = 0; i < baseMaps.length; ++i) {
            if (baseMaps[i].catalogItem.name === baseMapName) {
                terria.baseMap = baseMaps[i].catalogItem;
            }
        }
    }

    updateBaseMap(baseMapName);

    knockout.getObservable(terria, 'baseMapName').subscribe(function() {
        updateBaseMap(terria.baseMapName);
    });
};

module.exports = selectBaseMap;